"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { patchHairQuizSubmission } from "@/lib/hair-quiz/client";
import {
  buildWhatsAppUrl,
  getInstagramOutreachTitle,
  normalizeInstagramHandle,
  openInstagramMessage,
} from "@/lib/hair-quiz/outreach";
import {
  formatFieldValue,
  getTreatmentStatusMeta,
  isFollowUpOverdue,
  TREATMENT_STATUS_OPTIONS,
  type HairQuizSubmission,
  type TreatmentStatus,
} from "@/lib/hair-quiz/schema";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function ContactTick() {
  return (
    <span className="absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
      <Check className="size-2.5" strokeWidth={3} aria-hidden />
    </span>
  );
}

function TreatmentStatusControl({
  status,
  disabled,
  onStatusChange,
}: {
  status: TreatmentStatus;
  disabled?: boolean;
  onStatusChange: (status: TreatmentStatus) => void;
}) {
  const current = getTreatmentStatusMeta(status);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
          title={current.label}
        >
          <span className={cn("size-3 shrink-0 rounded-full", current.dotClass)} aria-hidden />
          {current.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="grid gap-1">
          {TREATMENT_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                option.value === status && "bg-muted",
              )}
            >
              <span
                className={cn(
                  "size-3 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-background",
                  option.dotClass,
                  option.value === status ? option.activeRingClass : "ring-transparent",
                )}
                aria-hidden
              />
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TreatmentStatusDot({ status }: { status: TreatmentStatus }) {
  const meta = getTreatmentStatusMeta(status);
  return (
    <span
      className={cn("inline-block size-3 rounded-full", meta.dotClass)}
      title={meta.label}
      aria-label={meta.label}
    />
  );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-start gap-x-3 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-x-4">
      <dt className="pt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-sm leading-relaxed wrap-break-word">
        {formatFieldValue(value)}
      </dd>
    </div>
  );
}

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AdminControls({
  submission,
  onUpdated,
}: {
  submission: HairQuizSubmission;
  onUpdated: (submission: HairQuizSubmission) => void;
}) {
  const { adminTracking, formData, _id } = submission;
  const [noteDraft, setNoteDraft] = useState("");
  const [followUpDraft, setFollowUpDraft] = useState(
    toDatetimeLocalValue(adminTracking.followUpAt),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFollowUpDraft(toDatetimeLocalValue(adminTracking.followUpAt));
    setNoteDraft("");
  }, [_id, adminTracking.followUpAt]);

  const whatsappUrl = buildWhatsAppUrl(formData.whatsapp);
  const instagramHandle = normalizeInstagramHandle(formData.instagramUsername);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const updated = await patchHairQuizSubmission({ id: _id, ...body });
      if (updated) onUpdated(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Admin</h3>
        <TreatmentStatusControl
          status={adminTracking.treatmentStatus}
          disabled={saving}
          onStatusChange={(status) => void patch({ treatmentStatus: status })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-11 w-full text-[#25D366] hover:text-[#25D366]"
            disabled={!whatsappUrl || saving}
            onClick={() => {
              window.open(whatsappUrl!, "_blank", "noopener,noreferrer");
              void patch({ markOutreach: "whatsapp" });
            }}
          >
            <WhatsAppIcon className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
          {adminTracking.whatsappAt ? <ContactTick /> : null}
        </div>

        <div className="relative">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-11 w-full text-[#E1306C] hover:text-[#E1306C]"
            disabled={!instagramHandle || saving}
            onClick={() => {
              openInstagramMessage(instagramHandle);
              void patch({ markOutreach: "instagram" });
            }}
            title={getInstagramOutreachTitle()}
          >
            <InstagramIcon className="mr-2 h-4 w-4" />
            Instagram
          </Button>
          {adminTracking.instagramAt ? <ContactTick /> : null}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Follow-up reminder
        </p>
        <div className="flex flex-col gap-2">
          <Input
            type="datetime-local"
            value={followUpDraft}
            onChange={(event) => setFollowUpDraft(event.target.value)}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={saving}
              onClick={() =>
                void (async () => {
                  if (!followUpDraft) {
                    const updated = await patch({ clearFollowUp: true });
                    if (updated) toast.success("Follow-up cleared");
                    return;
                  }
                  const date = new Date(followUpDraft);
                  if (Number.isNaN(date.getTime())) {
                    toast.error("Enter a valid follow-up date");
                    return;
                  }
                  const updated = await patch({ followUpAt: date.toISOString() });
                  if (updated) toast.success("Follow-up saved");
                })()
              }
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              disabled={saving || !adminTracking.followUpAt}
              onClick={() => {
                setFollowUpDraft("");
                void patch({ clearFollowUp: true }).then((updated) => {
                  if (updated) toast.success("Follow-up cleared");
                });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
        {adminTracking.followUpAt ? (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              isFollowUpOverdue(adminTracking.followUpAt) && "font-medium text-destructive",
            )}
          >
            {isFollowUpOverdue(adminTracking.followUpAt) ? "Overdue · " : "Scheduled · "}
            {new Date(adminTracking.followUpAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin notes
        </p>
        <Textarea
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder="Add a note..."
          rows={3}
        />
        <Button
          type="button"
          size="sm"
          disabled={saving || !noteDraft.trim()}
          onClick={() =>
            void patch({ addNote: noteDraft.trim() }).then((updated) => {
              if (updated) {
                setNoteDraft("");
                toast.success("Note added");
              }
            })
          }
        >
          Add note
        </Button>
        {adminTracking.notes.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {adminTracking.notes.map((note, index) => (
              <li key={`${note.createdAt}-${index}`} className="rounded-md border bg-background p-3">
                <p className="text-sm leading-relaxed">{note.text}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(note.createdAt).toLocaleString()}
                  {note.createdBy ? ` · ${note.createdBy}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        )}
      </div>
    </section>
  );
}

export function HairQuizSubmissionSheet({
  submission,
  open,
  onOpenChange,
  onUpdated,
}: {
  submission: HairQuizSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (submission: HairQuizSubmission) => void;
}) {
  if (!submission) return null;

  const { formData, submissionMeta: meta } = submission;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full! max-w-none! flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full"
      >
        <SheetHeader className="border-b pe-12">
          <SheetTitle>{formData.name}</SheetTitle>
          <SheetDescription>
            Submitted {new Date(submission.createdAt).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6 px-4 py-4 pb-8 sm:px-6">
              <AdminControls submission={submission} onUpdated={onUpdated} />

              <Separator />

              <section className="space-y-1">
                <h3 className="text-sm font-semibold">Contact</h3>
                <dl className="divide-y divide-border">
                  <DetailRow label="Name" value={formData.name} />
                  <DetailRow label="Email" value={formData.email} />
                  <DetailRow label="WhatsApp" value={formData.whatsapp} />
                  <DetailRow label="Phone country" value={formData.whatsappCountry} />
                  <DetailRow label="Instagram" value={`@${formData.instagramUsername}`} />
                  <DetailRow label="Prefers" value={formData.contactPreference} />
                </dl>
              </section>

              <Separator />

              <section className="space-y-1">
                <h3 className="text-sm font-semibold">Hair profile</h3>
                <dl className="divide-y divide-border">
                  <DetailRow label="Thickness" value={formData.hairThickness} />
                  <DetailRow label="Texture" value={formData.hairTexture} />
                  <DetailRow label="Roots" value={formData.rootType} />
                  <DetailRow label="Ends" value={formData.endsType} />
                  <DetailRow label="Dandruff" value={formData.hasDandruffOrItchyScalp} />
                  <DetailRow label="Washes / week" value={formData.washFrequencyPerWeek} />
                  <DetailRow label="Frizzy" value={formData.getsFrizzy} />
                  <DetailRow label="Hot tools" value={formData.hotToolsFrequency} />
                  <DetailRow label="Hairloss" value={formData.hairlossConcern} />
                  <DetailRow label="Products" value={formData.currentProducts} />
                  <DetailRow label="Colour" value={formData.isColorTreated} />
                  <DetailRow label="Hair goal" value={formData.ultimateHairGoal} />
                  <DetailRow label="Budget" value={formData.budget} />
                </dl>
              </section>

              {meta ? (
                <>
                  <Separator />
                  <section className="space-y-1">
                    <h3 className="text-sm font-semibold">Submission context</h3>
                    <dl className="divide-y divide-border">
                      <DetailRow label="IP" value={meta.ip} />
                      <DetailRow label="Country" value={meta.geo?.country} />
                      <DetailRow label="City" value={meta.geo?.city} />
                      <DetailRow
                        label="Device"
                        value={
                          meta.device
                            ? [
                                meta.device.os?.name,
                                meta.device.browser?.name,
                                meta.device.device?.type,
                              ]
                                .filter(Boolean)
                                .join(" · ")
                            : undefined
                        }
                      />
                      <DetailRow label="Language" value={meta.clientContext?.language} />
                    </dl>
                  </section>
                </>
              ) : null}
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="border-t">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
