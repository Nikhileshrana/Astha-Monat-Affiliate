"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ImageComparison } from "@/components/ui/image-comparison-slider";
import { cn } from "@/lib/utils";

const BEFORE_AFTER_PAIRS = [
  {
    id: "1",
    beforeImage: "/images/bnf/b1.png",
    afterImage: "/images/bnf/a1.png",
  },
  {
    id: "2",
    beforeImage: "/images/bnf/b2.png",
    afterImage: "/images/bnf/a2.png",
  },
] as const;

const AUTOPLAY_MS = 6000;

function BeforeAfterDots({
  count,
  activeIndex,
  onDotClick,
}: {
  count: number;
  activeIndex: number;
  onDotClick: (index: number) => void;
}) {
  return (
    <div
      className="mt-6 flex items-center justify-center gap-2"
      role="tablist"
      aria-label="Before and after slides"
    >
      {Array.from({ length: count }, (_, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => onDotClick(i)}
            className={cn(
              "size-2.5 rounded-full transition-transform",
              active
                ? "box-border scale-110 border-2 border-primary bg-transparent"
                : "bg-muted-foreground/40 hover:bg-muted-foreground/65",
            )}
          />
        );
      })}
    </div>
  );
}

export default function BeforeAfterSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback((embla: CarouselApi) => {
    if (!embla) return;
    setCurrent(embla.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  useEffect(() => {
    if (!api) return;
    const timer = window.setInterval(() => {
      api.scrollNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [api]);

  const scrollTo = (index: number) => {
    api?.scrollTo(index);
  };

  return (
    <section
      id="before-and-after"
      className="w-full bg-background px-4 pt-4 pb-8 text-foreground sm:px-6 sm:py-10 lg:px-8 lg:py-12"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="text-center md:mb-2">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Before & After
          </h2>
          <p className="mt-3 px-2 text-sm text-muted-foreground sm:text-base">
            Drag to see the difference. Swipe or use the arrows to browse more
            results.
          </p>
        </div>

        <Carousel
            opts={{ loop: true, watchDrag: false }}
            setApi={setApi}
            className="w-full"
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <CarouselPrevious className="static top-auto start-auto end-auto size-9 shrink-0 translate-x-0 translate-y-0 sm:size-10" />
              <div className="min-w-0 flex-1">
                <CarouselContent className="ms-0">
                  {BEFORE_AFTER_PAIRS.map((pair) => (
                    <CarouselItem key={pair.id} className="basis-full ps-0">
                      <ImageComparison
                        showLabels
                        className="mx-auto aspect-[4/5] w-full md:aspect-[1200/800]"
                        beforeImage={pair.beforeImage}
                        afterImage={pair.afterImage}
                        altBefore="Before treatment"
                        altAfter="After treatment"
                        initialPosition={50}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </div>
              <CarouselNext className="static top-auto start-auto end-auto size-9 shrink-0 translate-x-0 translate-y-0 sm:size-10" />
            </div>

            <BeforeAfterDots
              count={BEFORE_AFTER_PAIRS.length}
              activeIndex={current}
              onDotClick={scrollTo}
            />
          </Carousel>
      </div>
    </section>
  );
}
