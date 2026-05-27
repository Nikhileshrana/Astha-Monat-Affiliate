"use client";

import * as React from "react";

import { CardStack, type CardStackItem } from "@/components/ui/card-stack";
import { MARKETING_PURPLE } from "@/lib/marketing-theme";
import { cn } from "@/lib/utils";

const TESTIMONIAL_SLIDE_PATHS = Array.from(
  { length: 14 },
  (_, i) => `/images/testimonials/${i + 1}.jpeg`,
);

const TESTIMONIAL_ITEMS: CardStackItem[] = TESTIMONIAL_SLIDE_PATHS.map(
  (src, index) => ({
    id: `testimonial-${index + 1}`,
    title: `Testimonial ${index + 1}`,
    description: undefined,
    imageSrc: src,
  }),
);

const MAX_TESTIMONIAL_CARD_WIDTH = 360;
const MIN_TESTIMONIAL_CARD_WIDTH = 240;

function useCardStackSize() {
  const [dimensions, setDimensions] = React.useState({
    cardWidth: 280,
    cardHeight: Math.round(280 * 1.15),
  });

  React.useEffect(() => {
    function compute() {
      const w = Math.min(
        MAX_TESTIMONIAL_CARD_WIDTH,
        Math.max(
          MIN_TESTIMONIAL_CARD_WIDTH,
          typeof window !== "undefined" ? window.innerWidth - 80 : 280,
        ),
      );
      const h = Math.round(w * 1.15);
      setDimensions({ cardWidth: w, cardHeight: h });
    }

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return dimensions;
}

/** Homepage testimonials as a draggable / auto‑advancing fan card stack (Motion). */
export default function TestimonialsCarousel() {
  const { cardWidth, cardHeight } = useCardStackSize();

  return (
    <section
      className={cn(
        "w-full px-4 py-8 text-foreground sm:px-6 sm:py-10 lg:px-8 lg:py-12",
        MARKETING_PURPLE.sectionBg,
      )}
    >
      <div className="mx-auto w-full">
        <h2 className="mb-2 text-center font-heading text-3xl font-bold tracking-tight md:mb-3 md:text-4xl">
          Testimonials
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground sm:text-base md:mb-10">
          Drag the front card sideways, tap the arrows or dots, or let it cycle
          automatically—hover to pause.
        </p>

        <div className="relative mx-auto w-full overflow-x-clip pb-6">
          <CardStack
            className="-mx-1 sm:mx-0"
            theme="marketing"
            items={TESTIMONIAL_ITEMS}
            initialIndex={0}
            loop
            autoAdvance
            intervalMs={2600}
            pauseOnHover
            showDots
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            maxVisible={7}
            spreadDeg={44}
            overlap={0.46}
            renderCard={(item, { active }) => (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center p-4",
                  MARKETING_PURPLE.cardInner,
                )}
              >
                {/* biome-ignore lint/performance/noImgElement: static public testimonials */}
                <img
                  src={item.imageSrc ?? ""}
                  alt={item.title}
                  className={cn(
                    "max-h-full max-w-full object-contain",
                    "[-webkit-touch-callout:none]",
                  )}
                  draggable={false}
                  loading={active ? "eager" : "lazy"}
                  decoding="async"
                  sizes={`${cardWidth}px`}
                />
              </div>
            )}
          />
        </div>
      </div>
    </section>
  );
}
