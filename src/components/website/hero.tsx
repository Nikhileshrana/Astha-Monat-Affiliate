"use client";

import { useEffect, useState } from "react";

import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";

const REVEAL_SPRING = {
  type: "spring" as const,
  stiffness: 200,
  damping: 21,
};

const HERO_DISPLAY_MS = 3000;
const HERO_EXIT_MS = 400;

/** Full-screen intro splash; dismisses after 3s so testimonials is the page entry. */
export function HeroSection() {
  const [phase, setPhase] = useState<"visible" | "exiting" | "gone">("visible");

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document.body.style.overflow = "hidden";

    const exitTimer = window.setTimeout(() => {
      if (reduceMotion) {
        setPhase("gone");
        document.body.style.overflow = "";
        window.scrollTo({ top: 0, left: 0 });
        return;
      }

      setPhase("exiting");
    }, HERO_DISPLAY_MS);

    return () => {
      window.clearTimeout(exitTimer);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (phase !== "exiting") return;

    const removeTimer = window.setTimeout(() => {
      setPhase("gone");
      document.body.style.overflow = "";
      window.scrollTo({ top: 0, left: 0 });
    }, HERO_EXIT_MS);

    return () => window.clearTimeout(removeTimer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <section
      aria-hidden={phase === "exiting"}
      className={cn(
        "fixed inset-0 z-50 flex h-dvh w-full items-center justify-center bg-white px-5 transition-opacity duration-400 sm:px-10 md:px-14 lg:px-20",
        phase === "exiting" && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-8 text-center sm:gap-10 md:gap-12 lg:gap-14">
        <h1 className="w-full font-heading text-[clamp(2.25rem,8.5vw,5.75rem)] font-bold leading-[1.05] tracking-tight text-neutral-950">
          <VerticalCutReveal
            splitBy="characters"
            staggerDuration={0.025}
            staggerFrom="first"
            transition={REVEAL_SPRING}
            containerClassName="justify-center"
          >
            Let Me Help You Love
          </VerticalCutReveal>
          <VerticalCutReveal
            splitBy="characters"
            staggerDuration={0.025}
            staggerFrom="last"
            reverse
            transition={{
              ...REVEAL_SPRING,
              delay: 0.45,
            }}
            containerClassName="mt-1 justify-center sm:mt-2"
          >
            Your Hair Again ❤️
          </VerticalCutReveal>
        </h1>

        <p className="w-full max-w-[min(100%,42rem)] text-[clamp(0.9375rem,2.4vw,1.375rem)] font-normal leading-relaxed text-neutral-600">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.06}
            staggerFrom="center"
            transition={{
              ...REVEAL_SPRING,
              delay: 0.9,
            }}
            containerClassName="justify-center"
          >
            My Monat routine for fuller, healthier hair—easy steps you can
            follow. 😊
          </VerticalCutReveal>
        </p>
      </div>
    </section>
  );
}
