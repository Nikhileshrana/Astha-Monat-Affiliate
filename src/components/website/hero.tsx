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
    id: "barrier-booster",
    badge: "NEW",
    headline: "MONAT BARRIER BOOSTER™",
    subheadline: "Peptide-Powered Protection for Glass Skin.",
    ctaLabel: "NOW AVAILABLE!",
    ctaHref: "#",
    imageSrc: "/website/hero-barrier-booster.png",
    gradientClass: "from-[#f8d4d8] via-[#f5c9c4] to-[#f0b8a8]",
    imagePosition: "70% center",
  },
  {
    id: "skin-elixir",
    badge: "BESTSELLER",
    headline: "REJUVABEADS® ELIXIR",
    subheadline: "Oil-infused shine for visibly healthier strands.",
    ctaLabel: "DISCOVER MORE",
    ctaHref: "#",
    gradientClass: "from-[#fce4ec] via-[#f8bbd9] to-[#f48fb1]",
  },
  {
    id: "body-care",
    badge: null,
    headline: "BODY CARE ESSENTIALS",
    subheadline: "Hydration that lasts from morning to night.",
    ctaLabel: "SHOP BODY",
    ctaHref: "#",
    gradientClass: "from-[#fceee8] via-[#f5d5c8] to-[#e8b4a0]",
  },
  {
    id: "wellness",
    badge: "NEW",
    headline: "WELLNESS ROUTINE",
    subheadline: "Support radiance inside and out.",
    ctaLabel: "EXPLORE",
    ctaHref: "#",
    gradientClass: "from-[#f3e8f5] via-[#e1bee7] to-[#ce93d8]",
  },
  {
    id: "holiday",
    badge: null,
    headline: "GIFTS SHE’LL LOVE",
    subheadline: "Limited sets for every texture and scent.",
    ctaLabel: "SHOP GIFTS",
    ctaHref: "#",
    gradientClass: "from-[#ffebee] via-[#ffcdd2] to-[#ef9a9a]",
  },
  {
    id: "men",
    badge: null,
    headline: "MONAT BLACK™",
    subheadline: "Grooming engineered for effortless style.",
    ctaLabel: "FOR HIM",
    ctaHref: "#",
    gradientClass: "from-[#eceff1] via-[#cfd8dc] to-[#90a4ae]",
  },
  {
    id: "color",
    badge: null,
    headline: "COLOR & CARE SYSTEM",
    subheadline: "Vivid color meets bond-building moisture.",
    ctaLabel: "VIEW SYSTEM",
    ctaHref: "#",
    gradientClass: "from-[#fff3e0] via-[#ffe0b2] to-[#ffcc80]",
  },
  {
    id: "join",
    badge: null,
    headline: "JOIN THE MOVEMENT",
    subheadline: "Share MONAT™ and earn on your schedule.",
    ctaLabel: "LEARN MORE",
    ctaHref: "#",
    gradientClass: "from-[#e8eaf6] via-[#c5cae9] to-[#9fa8da]",
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
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/25 via-black/10 to-transparent"
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
