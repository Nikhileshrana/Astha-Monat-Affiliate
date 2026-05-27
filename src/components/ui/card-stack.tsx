"use client";

import { ChevronLeft, ChevronRight, SquareArrowOutUpRight } from "lucide-react";
import type { PanInfo } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { MARKETING_PURPLE } from "@/lib/marketing-theme";
import { cn } from "@/lib/utils";

/** Match `prefers-reduced-motion` (Motion’s hook may not resolve in every TS setup). */
function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);

    function onChange() {
      setReduceMotion(mq.matches);
    }

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduceMotion;
}

export type CardStackItem = {
  id: string | number;
  title: string;
  description?: string;
  imageSrc?: string;
  href?: string;
  ctaLabel?: string;
  tag?: string;
};

export type CardStackProps<T extends CardStackItem> = {
  items: T[];

  /** Selected index on mount */
  initialIndex?: number;

  /** How many cards are visible around the active (odd recommended) */
  maxVisible?: number;

  /** Card sizing */
  cardWidth?: number;
  cardHeight?: number;

  /** How much cards overlap each other (0..0.8). Higher = more overlap */
  overlap?: number;

  /** Total fan angle (deg). Higher = wider arc */
  spreadDeg?: number;

  /** 3D / depth feel */
  perspectivePx?: number;
  depthPx?: number;
  tiltXDeg?: number;

  /** Active emphasis */
  activeLiftPx?: number;
  activeScale?: number;
  inactiveScale?: number;

  /** Motion */
  springStiffness?: number;
  springDamping?: number;

  /** Behavior */
  loop?: boolean;
  autoAdvance?: boolean;
  intervalMs?: number;
  pauseOnHover?: boolean;

  /** UI */
  showDots?: boolean;
  className?: string;
  /** Lavender marketing palette (homepage sections). */
  theme?: "default" | "marketing";

  /** Hooks */
  onChangeIndex?: (index: number, item: T) => void;

  /** Custom renderer (optional) */
  renderCard?: (item: T, state: { active: boolean }) => React.ReactNode;
};

function wrapIndex(n: number, len: number) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

/** Minimal signed offset from active index to i, with wrapping (for loop behavior). */
function signedOffset(i: number, active: number, len: number, loop: boolean) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;

  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

export function CardStack<T extends CardStackItem>({
  items,
  initialIndex = 0,
  maxVisible = 7,

  cardWidth = 520,
  cardHeight = 320,

  overlap = 0.48,
  spreadDeg = 48,

  perspectivePx = 1100,
  depthPx = 140,
  tiltXDeg = 12,

  activeLiftPx = 22,
  activeScale = 1.03,
  inactiveScale = 0.94,

  springStiffness = 280,
  springDamping = 28,

  loop = true,
  autoAdvance = false,
  intervalMs = 2800,
  pauseOnHover = true,

  showDots = true,
  className,
  theme = "default",

  onChangeIndex,
  renderCard,
}: CardStackProps<T>) {
  const reduceMotion = usePrefersReducedMotion();
  const len = items.length;

  const [active, setActive] = React.useState(() =>
    wrapIndex(initialIndex, len),
  );
  const [hovering, setHovering] = React.useState(false);

  React.useEffect(() => {
    setActive((a) => wrapIndex(a, len));
  }, [len]);

  const activeItem = len > 0 ? items[active] : undefined;
  React.useEffect(() => {
    if (!activeItem || !onChangeIndex) return;
    onChangeIndex(active, activeItem);
  }, [active, activeItem, onChangeIndex]);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));

  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const canGoPrev = loop || active > 0;
  const canGoNext = loop || active < len - 1;

  const prev = React.useCallback(() => {
    if (!len) return;
    if (!canGoPrev) return;
    setActive((a) => wrapIndex(a - 1, len));
  }, [canGoPrev, len]);

  const next = React.useCallback(() => {
    if (!len) return;
    if (!canGoNext) return;
    setActive((a) => wrapIndex(a + 1, len));
  }, [canGoNext, len]);

  React.useEffect(() => {
    if (!autoAdvance) return;
    if (reduceMotion) return;
    if (!len) return;
    if (pauseOnHover && hovering) return;

    const id = window.setInterval(
      () => {
        setActive((a) => {
          if (!loop && a >= len - 1) return a;
          return wrapIndex(a + 1, len);
        });
      },
      Math.max(700, intervalMs),
    );

    return () => window.clearInterval(id);
  }, [
    autoAdvance,
    intervalMs,
    hovering,
    pauseOnHover,
    reduceMotion,
    len,
    loop,
  ]);

  if (!len) return null;

  const isMarketing = theme === "marketing";
  const controlButtonClass = cn(
    "shrink-0",
    isMarketing &&
      cn(
        MARKETING_PURPLE.accentBorder,
        MARKETING_PURPLE.accentText,
        MARKETING_PURPLE.accentHover,
      ),
  );

  const showOpenLink =
    Boolean(activeItem?.href) &&
    typeof activeItem?.href === "string" &&
    activeItem.href.trim() !== "";

  return (
    <div className={cn("w-full", className)}>
      <section
        className={cn(
          "relative w-full rounded-2xl outline-none ring-offset-background focus-within:ring-2 focus-within:ring-offset-2",
          isMarketing
            ? MARKETING_PURPLE.focusRing
            : "focus-within:ring-ring/35",
        )}
        aria-roledescription="carousel"
        aria-label="Card stack gallery"
        style={{ height: Math.max(380, cardHeight + 80) }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* background wash */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-6 mx-auto h-48 w-[70%] rounded-full blur-3xl",
            isMarketing
              ? MARKETING_PURPLE.spotlightTop
              : "bg-black/5 dark:bg-white/5",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-40 w-[76%] rounded-full blur-3xl",
            isMarketing
              ? MARKETING_PURPLE.spotlightBottom
              : "bg-black/10 dark:bg-black/30",
          )}
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 flex items-end justify-center overflow-visible"
          style={{
            perspective: `${perspectivePx}px`,
          }}
        >
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, active, len, loop);
              const abs = Math.abs(off);
              const visible = abs <= maxOffset;

              if (!visible) return null;

              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const y = abs * 10;
              const z = -abs * depthPx;

              const isActive = off === 0;

              const scale = isActive ? activeScale : inactiveScale;
              const lift = isActive ? -activeLiftPx : 0;

              const rotateX = isActive ? 0 : tiltXDeg;

              const zIndex = 100 - abs;

              const dragProps = isActive
                ? {
                    drag: "x" as const,
                    dragConstraints: { left: 0, right: 0 },
                    dragElastic: 0.18,
                    onDragEnd: (
                      _e: MouseEvent | TouchEvent | PointerEvent,
                      info: PanInfo,
                    ) => {
                      if (reduceMotion) return;
                      const travel = info.offset.x;
                      const v = info.velocity.x;
                      const threshold = Math.min(160, cardWidth * 0.22);

                      if (travel > threshold || v > 650) prev();
                      else if (travel < -threshold || v < -650) next();
                    },
                  }
                : {};

              return (
                <motion.div
                  key={item.id}
                  className={cn(
                    "absolute bottom-0 overflow-hidden rounded-2xl shadow-xl",
                    "will-change-transform select-none",
                    isMarketing
                      ? cn(
                          "border",
                          MARKETING_PURPLE.cardBorder,
                          MARKETING_PURPLE.cardSurface,
                          isActive && MARKETING_PURPLE.activeCardRing,
                        )
                      : "border-2 border-border bg-card",
                    isActive
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-pointer",
                  )}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    zIndex,
                    transformStyle: "preserve-3d",
                  }}
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: y + 40,
                          x,
                          rotateZ,
                          rotateX,
                          scale,
                        }
                  }
                  animate={{
                    opacity: 1,
                    x,
                    y: y + lift,
                    rotateZ,
                    rotateX,
                    scale,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: springStiffness,
                    damping: springDamping,
                  }}
                  onClick={() => setActive(i)}
                  {...dragProps}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      transform: `translateZ(${z}px)`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {renderCard ? (
                      renderCard(item, { active: isActive })
                    ) : (
                      <DefaultFanCard item={item} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {showDots ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous slide"
            disabled={!canGoPrev}
            onClick={prev}
            className={controlButtonClass}
          >
            <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              {items.map((it, idx) => {
                const on = idx === active;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setActive(idx)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      on
                        ? isMarketing
                          ? MARKETING_PURPLE.accent
                          : "bg-primary"
                        : isMarketing
                          ? MARKETING_PURPLE.accentMuted
                          : "bg-muted-foreground/40 hover:bg-muted-foreground/65",
                    )}
                    aria-label={`Go to ${it.title}`}
                  />
                );
              })}
            </div>
            {showOpenLink && activeItem?.href ? (
              <Link
                href={activeItem.href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "inline-flex shrink-0 transition-colors",
                  isMarketing
                    ? cn(
                        MARKETING_PURPLE.subtitle,
                        "hover:text-[#6d5b8e] dark:hover:text-primary",
                      )
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Open link"
              >
                <SquareArrowOutUpRight className="size-4" />
              </Link>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next slide"
            disabled={!canGoNext}
            onClick={next}
            className={controlButtonClass}
          >
            <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function DefaultFanCard({ item }: { item: CardStackItem }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        {item.imageSrc ? (
          <>
            {/* biome-ignore lint/performance/noImgElement: card stack URLs / locals */}
            <img
              src={item.imageSrc}
              alt={item.title}
              className="h-full w-full object-cover"
              draggable={false}
              loading="eager"
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-end p-5">
        <div className="truncate text-lg font-semibold text-white">
          {item.title}
        </div>
        {item.description ? (
          <div className="mt-1 line-clamp-2 text-sm text-white/85">
            {item.description}
          </div>
        ) : null}
      </div>
    </div>
  );
}
