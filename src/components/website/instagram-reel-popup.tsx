"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: (element?: HTMLElement) => void;
      };
    };
  }
}

type InstagramReelPopupProps = {
  url: string;
  defaultOpen?: boolean;
  className?: string;
};

export function InstagramReelPopup({
  url,
  defaultOpen = true,
  className,
}: InstagramReelPopupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const embedHostRef = useRef<HTMLDivElement>(null);

  const processEmbed = useCallback(() => {
    if (!embedHostRef.current || !window.instgrm) return;
    window.instgrm.Embeds.process(embedHostRef.current);
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/instagram-oembed?url=${encodeURIComponent(url)}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || "Failed to load Instagram embed");
        }
        if (!cancelled) {
          setEmbedHtml(json.html as string);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load Instagram embed",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, url]);

  useEffect(() => {
    if (!embedHtml || !scriptReady) return;
    processEmbed();
  }, [embedHtml, scriptReady, processEmbed]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[2px]"
        aria-hidden
        onClick={() => setOpen(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instagram reel"
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6",
          className,
        )}
      >
        <div className="relative w-full max-w-[min(100%,22rem)]">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -top-3 -right-3 z-10 size-9 rounded-full shadow-md"
            aria-label="Close video"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>

          <div className="overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
            {loading ? (
              <div className="flex aspect-[9/16] items-center justify-center text-sm text-white/70">
                Loading reel...
              </div>
            ) : null}

            {error ? (
              <div className="flex aspect-[9/16] items-center justify-center px-6 text-center text-sm text-white/80">
                {error}
              </div>
            ) : null}

            {embedHtml ? (
              <div
                ref={embedHostRef}
                className="[&_.instagram-media]:!m-0 [&_.instagram-media]:!max-w-none [&_.instagram-media]:!min-w-0 [&_.instagram-media]:!w-full"
                dangerouslySetInnerHTML={{ __html: embedHtml }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <Script
        src="https://www.instagram.com/embed.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
    </>
  );
}
