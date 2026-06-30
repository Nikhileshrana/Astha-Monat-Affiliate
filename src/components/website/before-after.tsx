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
  beforeRatio: number;
  afterRatio: number;
  layout?: "horizontal" | "stacked";
};

const SLIDE_HEIGHT = "clamp(280px, 52vw, 480px)";

const BEFORE_AFTER_PAIRS: BeforeAfterPair[] = [
  { id: "1", beforeImage: "/images/bnf/b1.png", afterImage: "/images/bnf/a1.png", beforeRatio: 1650 / 1462, afterRatio: 1600 / 1462 },
  { id: "7", beforeImage: "/images/bnf/b7.png", afterImage: "/images/bnf/a7.png", beforeRatio: 1505 / 723, afterRatio: 2070 / 1023, layout: "stacked" },
  { id: "3", beforeImage: "/images/bnf/b3.png", afterImage: "/images/bnf/a3.png", beforeRatio: 1174 / 1018, afterRatio: 1555 / 1368 },
  { id: "9", beforeImage: "/images/bnf/b9.png", afterImage: "/images/bnf/a9.png", beforeRatio: 1528 / 1305, afterRatio: 1528 / 1305, layout: "stacked" },
  { id: "4", beforeImage: "/images/bnf/b4.png", afterImage: "/images/bnf/a4.png", beforeRatio: 1375 / 1080, afterRatio: 1369 / 1285 },
  { id: "2", beforeImage: "/images/bnf/b2.png", afterImage: "/images/bnf/a2.png", beforeRatio: 1346 / 1328, afterRatio: 1248 / 1168 },
  { id: "5", beforeImage: "/images/bnf/b5.png", afterImage: "/images/bnf/a5.png", beforeRatio: 1165 / 1210, afterRatio: 1141 / 1230 },
  { id: "6", beforeImage: "/images/bnf/b6.png", afterImage: "/images/bnf/a6.png", beforeRatio: 656 / 1036, afterRatio: 600 / 994 },
  { id: "8", beforeImage: "/images/bnf/b8.png", afterImage: "/images/bnf/a8.png", beforeRatio: 1147 / 1255, afterRatio: 1156 / 1201 },
];

const NAV_BUTTON_CLASS =
  "static top-auto start-auto end-auto size-9 shrink-0 translate-x-0 translate-y-0 rounded-full border-border shadow-sm sm:size-10";

function BeforeAfterImage({
  src,
  label,
  className,
}: {
  src: string;
  label: "Before" | "After";
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "relative h-full min-h-0 min-w-0 overflow-hidden rounded-2xl",
        className,
      )}
    >
      <Image
        src={src}
        alt={`${label} treatment`}
        fill
        className="object-cover object-center"
        sizes="(max-width: 768px) 46vw, 560px"
      />
      <figcaption className="absolute start-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm md:px-3 md:py-1.5 md:text-sm">
        {label}
      </figcaption>
    </figure>
  );
}

function SideBySidePair({ pair }: { pair: BeforeAfterPair }) {
  return (
    <div
      className="grid h-full w-full gap-2 sm:gap-3 md:gap-5"
      style={{
        gridTemplateColumns: `${pair.beforeRatio}fr ${pair.afterRatio}fr`,
      }}
    >
      <BeforeAfterImage src={pair.beforeImage} label="Before" />
      <BeforeAfterImage src={pair.afterImage} label="After" />
    </div>
  );
}

function StackedPair({ pair }: { pair: BeforeAfterPair }) {
  const beforeRow = 1 / pair.beforeRatio;
  const afterRow = 1 / pair.afterRatio;

  return (
    <div
      className="grid h-full w-full gap-2 sm:gap-3 md:gap-4"
      style={{
        gridTemplateRows: `${beforeRow}fr ${afterRow}fr`,
      }}
    >
      <BeforeAfterImage src={pair.beforeImage} label="Before" />
      <BeforeAfterImage src={pair.afterImage} label="After" />
    </div>
  );
}

function BeforeAfterPairSlide({ pair }: { pair: BeforeAfterPair }) {
  if (pair.layout === "stacked") {
    return <StackedPair pair={pair} />;
  }

  return <SideBySidePair pair={pair} />;
}

export default function BeforeAfterSection() {
  return (
    <section
      id="before-and-after"
      className="w-full bg-background px-4 pt-4 pb-8 text-foreground sm:px-6 sm:py-10 lg:px-8 lg:py-12"
    >
      <div className="mx-auto w-full max-w-4xl md:max-w-6xl">
        <div className="text-center md:mb-6">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Before & After
          </h2>
          <p className="mt-3 px-2 text-sm text-muted-foreground sm:text-base">
            Real results from real routines. Swipe through to see more
            transformations.
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: false,
            containScroll: "trimSnaps",
          }}
          className="mt-8 w-full"
        >
          <div className="mb-3 flex items-center justify-end gap-2">
            <CarouselPrevious className={NAV_BUTTON_CLASS} />
            <CarouselNext className={NAV_BUTTON_CLASS} />
          </div>

          <CarouselContent className="ms-0">
            {BEFORE_AFTER_PAIRS.map((pair) => (
              <CarouselItem
                key={pair.id}
                className="basis-full overflow-hidden ps-0 pe-3 md:pe-4"
              >
                <div className="w-full" style={{ height: SLIDE_HEIGHT }}>
                  <BeforeAfterPairSlide pair={pair} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
