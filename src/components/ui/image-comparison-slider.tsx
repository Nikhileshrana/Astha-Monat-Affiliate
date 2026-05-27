"use client";

import { ArrowLeftRightIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export type ImageComparisonProps = {
  beforeImage: string;
  afterImage: string;
  altBefore?: string;
  altAfter?: string;
  /** 0–100; knob from the start edge — higher shows more **before** (clips more of the after layer). @default 50 */
  initialPosition?: number;
  className?: string;
  /** Show corner labels mapped to visuals: Before (left), After (right). @default false */
  showLabels?: boolean;
};

/**
 * Before (left) / After (right) comparison. Drag or use arrow keys while the handle is focused.
 */
export function ImageComparison({
  beforeImage,
  afterImage,
  altBefore = "Before",
  altAfter = "After",
  initialPosition = 50,
  className,
  showLabels = false,
}: ImageComparisonProps) {
  const [position, setPosition] = React.useState(() =>
    clampPercent(initialPosition),
  );
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const setFromClientX = React.useCallback((clientX: number) => {
    const root = containerRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const rtl = getComputedStyle(root).direction === "rtl";
    const ratio = rtl
      ? (rect.right - clientX) / rect.width
      : (clientX - rect.left) / rect.width;
    setPosition(clampPercent(ratio * 100));
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => setFromClientX(e.clientX);
    const stop = () => setIsDragging(false);

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", stop);
    document.addEventListener("pointercancel", stop);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", stop);
    };
  }, [isDragging, setFromClientX]);

  const onDividerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setFromClientX(e.clientX);
  };

  const onDividerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const rtl = containerRef.current
        ? getComputedStyle(containerRef.current).direction === "rtl"
        : false;
      const step = rtl
        ? e.key === "ArrowRight"
          ? -2
          : 2
        : e.key === "ArrowRight"
          ? 2
          : -2;
      setPosition((prev) => clampPercent(prev + step));
    }
    if (e.key === "Home") {
      e.preventDefault();
      setPosition(100);
    }
    if (e.key === "End") {
      e.preventDefault();
      setPosition(0);
    }
  };

  const pctRounded = Math.round(position);

  return (
    <div
      ref={containerRef}
        className={cn(
        "relative mx-auto aspect-[1200/800] w-full max-w-4xl select-none overflow-hidden rounded-2xl border border-border bg-muted shadow-lg",
        "touch-none",
        className,
      )}
    >
      {showLabels ? (
        <>
          <span className="pointer-events-none absolute start-4 top-4 z-10 rounded-lg border border-white/70 bg-black/55 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-widest text-white">
            Before
          </span>
          <span className="pointer-events-none absolute end-4 top-4 z-10 rounded-lg border border-white/70 bg-black/55 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-widest text-white">
            After
          </span>
        </>
      ) : null}

      {/* biome-ignore lint/performance/noImgElement: comparison slider needs native drag behavior */}
      <img
        src={beforeImage}
        alt={altBefore}
        className="block h-full w-full object-cover"
        draggable={false}
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          /* Knock out the left slice of AFTER so BEFORE shows left of the knob; knob X == position %. */
          clipPath: `inset(0 0 0 ${position}%)`,
        }}
        aria-hidden
      >
        {/* biome-ignore lint/performance/noImgElement: comparison slider */}
        <img
          src={afterImage}
          alt={altAfter}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Comparison slider. Drag or use arrow keys to compare before and after."
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pctRounded}
        aria-valuetext={`${pctRounded} percent`}
        className={cn(
          "absolute inset-y-0 z-10 flex w-8 cursor-ew-resize items-center justify-center bg-transparent outline-none select-none [-webkit-tap-highlight-color:transparent]",
          "touch-manipulation focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        style={{
          insetInlineStart: `${position}%`,
          transform: "translateX(-50%)",
        }}
        onPointerDown={onDividerPointerDown}
        onKeyDown={onDividerKeyDown}
      >
        <span
          aria-hidden
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background shadow-md transition-transform duration-150",
            "text-foreground [&_svg]:size-6",
            isDragging && "scale-105 shadow-xl",
          )}
        >
          <ArrowLeftRightIcon strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 50;
  return Math.max(0, Math.min(100, value));
}
