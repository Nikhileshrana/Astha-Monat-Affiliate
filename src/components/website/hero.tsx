"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type HeroSlideData = {
  id: string;
  badge: string | null;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc?: string;
  gradientClass: string;
  imagePosition?: string;
};

const HERO_SLIDES: HeroSlideData[] = [
  {
    id: "men",
    badge: null,
    headline: "MONAT IR CLINICAL™ HAIR THINNING DEFENSE SERUM",
    subheadline: "This targeted treatment helps nourish the scalp and support thicker-looking hair over time. The fast-absorbing, non-greasy formula helps improve overall hair appearance and resilience for stronger-looking strands from the foundation.",
    ctaLabel: "Buy Now",
    ctaHref: "https://monatsocialshop.com/ASTHA-RANA?q=ir-clinical-hair-thinning-defense",
    gradientClass: "from-[#eceff1] via-[#cfd8dc] to-[#90a4ae]",
    imageSrc: "/images/hero/1.webp",
  },
  {
    id: "color",
    badge: null,
    headline: "MONAT REJUVENIQE® Oil Intensive",
    subheadline: "This lightweight treatment oil is formulated with a proprietary blend of 13+ plant and essential oils to help smooth frizz, improve softness, and enhance shine while also hydrating the skin.",
    ctaLabel: "Buy Now",
    ctaHref: "https://monatsocialshop.com/ASTHA-RANA?q=rejuveniqe-oil-intensive",
    gradientClass: "from-[#fff3e0] via-[#ffe0b2] to-[#ffcc80]",
    imageSrc: "/images/hero/2.webp",
  },
  {
    id: "join",
    badge: null,
    headline: "MONAT REJUVABEADS",
    subheadline: "This targeted formula helps minimize friction along the hair fiber to support healthier-looking ends without weighing hair down.",
    ctaLabel: "Buy Now",
    ctaHref: "https://monatsocialshop.com/ASTHA-RANA?q=rejuvabeads",
    gradientClass: "from-[#e8eaf6] via-[#c5cae9] to-[#9fa8da]",
    imageSrc: "/images/hero/3.webp",
  },
];

const AUTOPLAY_MS = 5500;

function HeroDots({
  slideIds,
  activeIndex,
  onDotClick,
  className,
}: {
  slideIds: readonly string[];
  activeIndex: number;
  onDotClick: (index: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex touch-manipulation items-center justify-center gap-2",
        className,
      )}
      role="tablist"
      aria-label="Hero slides"
    >
      {slideIds.map((id, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => onDotClick(i)}
            className={cn(
              "size-2.5 rounded-full transition-transform",
              active
                ? "box-border scale-110 border-2 border-[#1a2f4a] bg-transparent"
                : "bg-[#1a2f4a]",
            )}
          />
        );
      })}
    </div>
  );
}

function HeroSlideCard({
  slide,
  className,
}: {
  slide: HeroSlideData;
  className?: string;
}) {
  const objectPosition = slide.imagePosition ?? "center";

  return (
    <div
      className={cn(
        "relative flex min-h-[min(88vh,720px)] w-full overflow-hidden bg-linear-to-br",
        slide.gradientClass,
        className,
      )}
    >
      {slide.imageSrc ? (
        <Image
          src={slide.imageSrc}
          alt={slide.headline}
          fill
          priority={slide.id === "barrier-booster"}
          className="object-cover"
          style={{ objectPosition }}
          sizes="100vw"
        />
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#4b3d60]/95 via-[#4b3d60]/45 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex w-full flex-col justify-end px-5 pb-16 pt-24 sm:px-8 sm:pb-20 md:max-w-[1600px] md:justify-center md:pb-24 md:pt-28 lg:mx-auto lg:px-10">
        <div className="max-w-xl">
          {slide.badge ? (
            <p className="mb-3 inline-block bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:text-[11px]">
              {slide.badge}
            </p>
          ) : null}
          <h1 className="mb-2 text-2xl font-bold uppercase leading-[1.1] tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-3xl md:text-4xl lg:text-[2.75rem]">
            {slide.headline}
          </h1>
          <p className="mb-6 text-base font-medium text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] sm:text-lg md:text-xl">
            {slide.subheadline}
          </p>
          <Link
            href={slide.ctaHref}
            className="inline-flex min-h-11 items-center justify-center bg-black px-8 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 sm:min-h-12 sm:text-xs"
          >
            {slide.ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Full-width hero: slide content + Embla carousel + dot navigation. */
export function HeroSection() {
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
    <section className="relative w-full bg-black">
      <Carousel
        opts={{ loop: true, duration: 20 }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="ms-0">
          {HERO_SLIDES.map((slide) => (
            <CarouselItem key={slide.id} className="basis-full ps-0">
              <HeroSlideCard slide={slide} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center sm:bottom-6 md:bottom-8">
        <HeroDots
          slideIds={HERO_SLIDES.map((s) => s.id)}
          activeIndex={current}
          onDotClick={scrollTo}
        />
      </div>
    </section>
  );
}
