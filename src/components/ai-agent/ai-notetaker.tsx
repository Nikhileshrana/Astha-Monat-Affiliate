"use client";

import { format } from "date-fns";
import { Mic, MicOff, Save, Sparkles, Square } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AgentMarkdown } from "@/components/ai-agent/agent-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  createDraftClinicalNote,
  type ClinicalNote,
} from "@/lib/patients/clinical-notes";

/** Each segment is a full WebM file (stop/start). Timeslice chunks break Sarvam after #1. */
const SEGMENT_MS = 6_000;
const MIN_SEGMENT_BYTES = 2_000;
const MAX_SESSION_MS = 60 * 60 * 1000;
const MAX_SESSION_MIN = MAX_SESSION_MS / 60_000;

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: {
    resultIndex: number;
    results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
  }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function appendTranscript(prev: string, chunk: string): string {
  const t = chunk.trim();
  if (!t) return prev;
  if (!prev.trim()) return t;
  return `${prev.trimEnd()}\n\n${t}`;
}

export type AiNotetakerProps = {
  patientId: string;
  patientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  editingNote?: ClinicalNote | null;
  /** Set when editing an existing prescription; omit for new (draft) prescriptions. */
  prescriptionId?: string | null;
  /** When creating a new prescription (no id yet), save into local draft list. */
  onDraftSaved?: (note: ClinicalNote) => void;
};

export function AiNotetaker({
  patientId,
  patientName,
  open,
  onOpenChange,
  onSaved,
  editingNote,
  prescriptionId = null,
  onDraftSaved,
}: AiNotetakerProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [listening, setListening] = useState(false);
  const [sttBusy, setSttBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryStream, setSummaryStream] = useState("");
  const [useBrowserStt, setUseBrowserStt] = useState(false);
  const [sessionElapsedSec, setSessionElapsedSec] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const abortSummaryRef = useRef<AbortController | null>(null);
  const listeningRef = useRef(false);
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionLimitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentLoopRef = useRef<Promise<void> | null>(null);

  const resetForm = useCallback(() => {
    setTitle(
      editingNote?.title ??
        `Visit · ${format(new Date(), "dd MMM yyyy, HH:mm")}`,
    );
    setBody(editingNote?.body ?? "");
    setRawTranscript(editingNote?.rawTranscript ?? "");
    setAiSummary(editingNote?.aiSummary ?? "");
    setSummaryStream("");
  }, [editingNote]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const clearSessionTimers = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (sessionLimitRef.current) {
      clearTimeout(sessionLimitRef.current);
      sessionLimitRef.current = null;
    }
    setSessionElapsedSec(0);
  }, []);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    clearSessionTimers();

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    speechRef.current?.stop();
    speechRef.current = null;
  }, [clearSessionTimers]);

  const pickRecorderMime = useCallback((): string => {
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      return "audio/webm;codecs=opus";
    }
    if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
      return "audio/ogg;codecs=opus";
    }
    return "audio/webm";
  }, []);

  const recordOneSegment = useCallback(
    (stream: MediaStream, mime: string, durationMs: number): Promise<Blob | null> => {
      return new Promise((resolve) => {
        if (!listeningRef.current) {
          resolve(null);
          return;
        }

        const chunks: Blob[] = [];
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, { mimeType: mime });
        } catch {
          resolve(null);
          return;
        }

        mediaRecorderRef.current = recorder;

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          mediaRecorderRef.current = null;
          if (chunks.length === 0) {
            resolve(null);
            return;
          }
          const type = mime.split(";")[0] || "audio/webm";
          resolve(new Blob(chunks, { type }));
        };

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onerror = () => finish();
        recorder.onstop = () => finish();

        recorder.start();
        window.setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, durationMs);
      });
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      stopListening();
      abortSummaryRef.current?.abort();
      setSummarizing(false);
    }
  }, [open, stopListening]);

  const sendChunkToSarvam = useCallback(async (blob: Blob) => {
    const fd = new FormData();
    const mime = blob.type.split(";")[0]?.trim() || "audio/webm";
    const payload = new Blob([await blob.arrayBuffer()], { type: mime });
    const ext = mime.includes("ogg") ? "ogg" : "webm";
    fd.append("file", payload, `chunk.${ext}`);
    fd.append("language_code", "en-IN");
    const res = await fetch("/api/sarvam/speech-to-text", {
      method: "POST",
      body: fd,
    });
    if (res.status === 503) {
      setUseBrowserStt(true);
      throw new Error("Sarvam not configured");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Transcription failed",
      );
    }
    const data = (await res.json()) as { transcript?: string };
    return (data.transcript ?? "").trim();
  }, []);

  const appendLiveText = useCallback((text: string) => {
    setRawTranscript((r) => appendTranscript(r, text));
    setBody((b) => appendTranscript(b, text));
  }, []);

  const processSegmentBlob = useCallback(
    async (blob: Blob) => {
      if (blob.size < MIN_SEGMENT_BYTES) return;
      setSttBusy(true);
      try {
        const text = await sendChunkToSarvam(blob);
        if (text) appendLiveText(text);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Transcription failed";
        toast.error(`${msg} — continuing listening…`);
      } finally {
        setSttBusy(false);
      }
    },
    [appendLiveText, sendChunkToSarvam],
  );

  const runSegmentLoop = useCallback(
    async (stream: MediaStream) => {
      const mime = pickRecorderMime();
      while (listeningRef.current) {
        const blob = await recordOneSegment(stream, mime, SEGMENT_MS);
        if (!listeningRef.current) break;
        if (blob && blob.size >= MIN_SEGMENT_BYTES) {
          uploadQueueRef.current = uploadQueueRef.current.then(() =>
            processSegmentBlob(blob),
          );
        }
      }
    },
    [pickRecorderMime, recordOneSegment, processSegmentBlob],
  );

  const startBrowserStt = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error("Speech recognition is not supported in this browser");
      return false;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-IN";
    rec.onresult = (ev) => {
      let chunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) {
          chunk += ev.results[i][0].transcript;
        }
      }
      if (chunk.trim()) appendLiveText(chunk);
    };
    rec.onerror = () => {
      toast.error("Browser speech recognition error");
      stopListening();
    };
    rec.start();
    speechRef.current = rec;
    setUseBrowserStt(true);
    return true;
  }, [appendLiveText, stopListening]);

  const startListening = useCallback(async () => {
    if (listening) return;

    uploadQueueRef.current = Promise.resolve();
    listeningRef.current = true;
    setListening(true);
    setUseBrowserStt(false);
    setSessionElapsedSec(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      sessionTimerRef.current = setInterval(() => {
        setSessionElapsedSec((s) => s + 1);
      }, 1000);

      sessionLimitRef.current = setTimeout(() => {
        toast.message("1-hour session limit reached");
        stopListening();
      }, MAX_SESSION_MS);

      segmentLoopRef.current = runSegmentLoop(stream);
      toast.success(
        `Listening — up to ${MAX_SESSION_MIN} min. Notes append every ~${SEGMENT_MS / 1000}s.`,
      );
    } catch {
      listeningRef.current = false;
      setListening(false);
      clearSessionTimers();
      if (!startBrowserStt()) {
        toast.error("Microphone access denied or unavailable");
      } else {
        toast.message("Using browser speech recognition");
      }
    }
  }, [
    listening,
    runSegmentLoop,
    startBrowserStt,
    stopListening,
    clearSessionTimers,
  ]);

  const runSummarize = useCallback(async () => {
    if (!body.trim()) {
      toast.error("Add transcript text before summarizing");
      return;
    }
    abortSummaryRef.current?.abort();
    const ac = new AbortController();
    abortSummaryRef.current = ac;
    setSummarizing(true);
    setSummaryStream("");
    try {
      const res = await fetch(
        `/api/patients/${patientId}/prescriptions/notes/summarize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: body, title }),
          signal: ac.signal,
        },
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Summarize failed");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setSummaryStream(acc);
      }
      setAiSummary(acc);
      toast.success("Structured note generated");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast.error(e instanceof Error ? e.message : "Could not summarize");
    } finally {
      setSummarizing(false);
      abortSummaryRef.current = null;
    }
  }, [body, patientId, title]);

  const saveNote = useCallback(async () => {
    if (!body.trim() && !aiSummary.trim()) {
      toast.error("Note is empty");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim() || `Visit · ${format(new Date(), "dd MMM yyyy")}`,
        body: body.trim(),
        rawTranscript: rawTranscript.trim() || undefined,
        aiSummary: (aiSummary || summaryStream).trim() || undefined,
        source: listening || rawTranscript ? "voice" : "ai-assisted",
      };

      if (!prescriptionId) {
        const draft = createDraftClinicalNote({
          title: payload.title,
          body: payload.body,
          rawTranscript: payload.rawTranscript,
          aiSummary: payload.aiSummary,
          source:
            payload.source === "voice" ||
            payload.source === "manual" ||
            payload.source === "ai-assisted"
              ? payload.source
              : undefined,
        });
        if (editingNote?.id) {
          onDraftSaved?.({
            ...draft,
            id: editingNote.id,
            createdAt: editingNote.createdAt,
          });
        } else {
          onDraftSaved?.(draft);
        }
        toast.success("Note added to this prescription (save prescription to persist)");
        onSaved?.();
        onOpenChange(false);
        return;
      }

      if (editingNote?.id) {
        const res = await fetch(
          `/api/patients/${patientId}/prescriptions/${prescriptionId}/notes`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ noteId: editingNote.id, ...payload }),
          },
        );
        if (!res.ok) throw new Error("Failed to update note");
        toast.success("Note updated");
      } else {
        const res = await fetch(
          `/api/patients/${patientId}/prescriptions/${prescriptionId}/notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!res.ok) throw new Error("Failed to save note");
        toast.success("Note saved to prescription");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [
    body,
    aiSummary,
    summaryStream,
    title,
    rawTranscript,
    listening,
    editingNote,
    patientId,
    prescriptionId,
    onDraftSaved,
    onSaved,
    onOpenChange,
  ]);

  const displaySummary = summaryStream || aiSummary;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) stopListening();
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[min(92vh,820px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border/40 px-5 py-4 text-left">
          <DialogTitle className="text-base font-medium">
            AI notetaker
          </DialogTitle>
          <DialogDescription className="text-xs">
            Live transcript for {patientName}.
            {" Notes save to this prescription. AI Records for up to 1 hour."}{" "}
            Save or AI-summarize when done.
            {useBrowserStt ? " (Browser STT fallback)" : ""}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          layout
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4"
        >
          <motion.div
            layout
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1"
          >
            <div aria-hidden />
            <motion.div
              className="relative flex h-28 w-28 shrink-0 items-center justify-center justify-self-center"
              animate={
                listening
                  ? { scale: [1, 1.06, 1], opacity: [0.92, 1, 0.92] }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                listening
                  ? { repeat: Number.POSITIVE_INFINITY, duration: 1.4 }
                  : { duration: 0.3 }
              }
            >
              <div
                className={`absolute inset-0 rounded-full blur-xl transition-colors ${
                  listening
                    ? "bg-primary/40"
                    : "bg-muted-foreground/15"
                }`}
                aria-hidden
              />
              <motion.div
                className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-lg ${
                  listening
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {sttBusy ? (
                  <Spinner className="h-8 w-8" />
                ) : listening ? (
                  <Mic className="h-9 w-9" aria-hidden />
                ) : (
                  <MicOff className="h-9 w-9 opacity-60" aria-hidden />
                )}
              </motion.div>
            </motion.div>

            <motion.div
              layout
              className="flex w-full max-w-[11.5rem] flex-col gap-2 justify-self-end"
            >
              {!listening ? (
                <Button
                  type="button"
                  className="w-full justify-center"
                  onClick={() => void startListening()}
                >
                  <Mic className="h-4 w-4" />
                  Start recording
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full justify-center"
                  onClick={() => {
                    stopListening();
                    void (async () => {
                      await segmentLoopRef.current?.catch(() => {});
                      await uploadQueueRef.current;
                    })();
                  }}
                >
                  <Square className="h-4 w-4" />
                  Stop recording
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center"
                disabled={summarizing || !body.trim()}
                onClick={() => void runSummarize()}
              >
                <Sparkles className="h-4 w-4" />
                {summarizing ? "Summarizing…" : "AI summarize"}
              </Button>
              {listening ? (
                <p className="text-center text-xs tabular-nums text-muted-foreground">
                  {Math.floor(sessionElapsedSec / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(sessionElapsedSec % 60).toString().padStart(2, "0")} /{" "}
                  {MAX_SESSION_MIN}:00
                </p>
              ) : null}
            </motion.div>
          </motion.div>

          <div className="space-y-2">
            <Label htmlFor="note-title">Note title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Consultation note"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-body">Live document</Label>
            <Textarea
              id="note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Transcript and manual notes appear here…"
              className="min-h-[200px] resize-y font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              Speech is appended in blocks as you talk. Edit freely before
              saving.
            </p>
          </div>

          {(displaySummary || summarizing) && (
            <Accordion
              type="single"
              collapsible
              defaultValue="ai-summary"
              className="rounded-lg border border-border/40 bg-muted/30"
            >
              <AccordionItem value="ai-summary" className="border-0 px-3">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                    AI structured note
                    {summarizing ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        Generating…
                      </span>
                    ) : null}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  {summarizing && !displaySummary ? (
                    <motion.div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </motion.div>
                  ) : (
                    <motion.div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                      <AgentMarkdown source={displaySummary} />
                    </motion.div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </motion.div>

        <DialogFooter className="mx-0 mb-0 mt-auto flex shrink-0 flex-row flex-wrap justify-end gap-2 rounded-b-xl border-t border-border/40 bg-muted/50 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void saveNote()} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            Save to chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
