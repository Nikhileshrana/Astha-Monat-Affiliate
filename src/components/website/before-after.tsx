"use client";

import Image from "next/image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type BeforeAfterPair = {
  id: string;
  beforeImage: string;
  afterImage: string;
};

const BEFORE_AFTER_GROUPS: BeforeAfterPair[][] = [
  [
    { id: "1", beforeImage: "/images/bnf/b1.png", afterImage: "/images/bnf/a1.png" },
    { id: "2", beforeImage: "/images/bnf/b2.png", afterImage: "/images/bnf/a2.png" },
    { id: "3", beforeImage: "/images/bnf/b3.png", afterImage: "/images/bnf/a3.png" },
  ],
  [
    { id: "4", beforeImage: "/images/bnf/b4.png", afterImage: "/images/bnf/a4.png" },
    { id: "5", beforeImage: "/images/bnf/b5.png", afterImage: "/images/bnf/a5.png" },
    { id: "6", beforeImage: "/images/bnf/b6.png", afterImage: "/images/bnf/a6.png" },
  ],
  [
    { id: "7", beforeImage: "/images/bnf/b7.png", afterImage: "/images/bnf/a7.png" },
    { id: "8", beforeImage: "/images/bnf/b8.png", afterImage: "/images/bnf/a8.png" },
  ],
];

const NAV_BUTTON_CLASS =
  "static top-auto start-auto end-auto size-9 shrink-0 translate-x-0 translate-y-0 rounded-full border-border shadow-sm sm:size-10";

function BeforeAfterPairImages({ pair }: { pair: BeforeAfterPair }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-5">
      <figure className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted md:aspect-[4/3] lg:aspect-[3/2]">
        <Image
          src={pair.beforeImage}
          alt="Before treatment"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 44vw, (max-width: 1280px) 42vw, 560px"
        />
        <figcaption className="absolute start-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm md:px-3 md:py-1.5 md:text-sm">
          Before
        </figcaption>
      </figure>
      <figure className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted md:aspect-[4/3] lg:aspect-[3/2]">
        <Image
          src={pair.afterImage}
          alt="After treatment"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 44vw, (max-width: 1280px) 42vw, 560px"
        />
        <figcaption className="absolute start-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm md:px-3 md:py-1.5 md:text-sm">
          After
        </figcaption>
      </figure>
    </div>
  );
}

function BeforeAfterCarousel({
  pairs,
  className,
}: {
  pairs: BeforeAfterPair[];
  className?: string;
}) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: false,
        containScroll: "trimSnaps",
      }}
      className={cn("w-full", className)}
    >
      <div className="mb-3 flex items-center justify-end gap-2">
        <CarouselPrevious className={NAV_BUTTON_CLASS} />
        <CarouselNext className={NAV_BUTTON_CLASS} />
      </div>

      <CarouselContent className="ms-0 gap-4 md:gap-6">
        {pairs.map((pair) => (
          <CarouselItem
            key={pair.id}
            className="basis-[88%] ps-0 md:basis-full"
          >
            <BeforeAfterPairImages pair={pair} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

export default function BeforeAfterSection() {
  return (
    <section
      id="before-and-after"
      className="w-full bg-background px-4 pt-4 pb-8 text-foreground sm:px-6 sm:py-10 lg:px-8 lg:py-12"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 md:max-w-6xl">
        <div className="text-center md:mb-2">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Before & After
          </h2>
          <p className="mt-3 px-2 text-sm text-muted-foreground sm:text-base">
            Real results from real routines. Swipe through each row to see more
            transformations.
          </p>
        </div>

        <div className="space-y-8 md:space-y-10">
          {BEFORE_AFTER_GROUPS.map((pairs, index) => (
            <BeforeAfterCarousel key={`group-${index + 1}`} pairs={pairs} />
          ))}
        </div>
      </div>
    </section>
  );
}
