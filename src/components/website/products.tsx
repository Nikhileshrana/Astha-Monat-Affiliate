"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const METASHOP_URL = "https://monatsocialshop.com/ASTHA-RANA";

const NAV_BUTTON_CLASS =
  "static top-auto start-auto end-auto size-9 shrink-0 translate-x-0 translate-y-0 rounded-full border-border shadow-sm sm:size-10";

type Product = {
  id: string;
  category: string;
  title: string;
  features: string[];
  imageSrc: string;
  href: string;
};

const BEST_SELLERS: Product[] = [
  {
    id: "ir-clinical-serum",
    category: "Best Seller",
    title: "IR Clinical™ Hair Thinning Defense Serum",
    features: ["Scalp treatment", "Fast-absorbing", "Daily use"],
    imageSrc: "/images/hero/1.webp",
    href: `${METASHOP_URL}?q=ir-clinical-hair-thinning-defense`,
  },
  {
    id: "scalp-to-ends-duo",
    category: "Duo",
    title: "Scalp to Ends Duo",
    features: ["Serum + Rejuvabeads", "Root to tip care", "Bundle savings"],
    imageSrc: "/images/hero/6.png",
    href: `${METASHOP_URL}?q=scalp-to-ends-duo`,
  },
  {
    id: "thicken-shine-duo",
    category: "Duo",
    title: "Thicken & Shine Duo",
    features: ["Oil + Serum", "Fuller-looking hair", "Bundle savings"],
    imageSrc: "/images/hero/5.png",
    href: `${METASHOP_URL}?q=thicken-shine-duo`,
  },
];

function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted md:aspect-[5/4]">
        <Link
          href={product.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block size-full"
        >
          <Image
            src={product.imageSrc}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 88vw, 280px"
          />
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={saved}
          onClick={() => setSaved((value) => !value)}
          className={cn(
            "absolute end-3 top-3 size-9 rounded-full border border-black/5 bg-white/95 text-foreground shadow-sm backdrop-blur-sm hover:bg-white",
            saved && "text-rose-500",
          )}
        >
          <Heart
            className={cn("size-4", saved && "fill-current")}
            strokeWidth={1.75}
            aria-hidden
          />
        </Button>
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {product.category}
        </p>
        <h3 className="mt-2 line-clamp-2 font-heading text-base font-bold leading-snug text-foreground md:mt-1.5 md:text-sm">
          <Link
            href={product.href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
          >
            {product.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground md:mt-1.5 md:line-clamp-1 md:text-xs">
          {product.features.join(" • ")}
        </p>
      </div>
    </article>
  );
}

/** Best sellers — single carousel, three products. */
export default function ProductsSection() {
  return (
    <section
      id="best-sellers"
      className="w-full bg-background px-4 py-10 text-foreground sm:px-6 sm:py-12 lg:px-8 lg:py-14"
    >
      <div className="mx-auto w-full max-w-4xl">
        <Carousel
          opts={{
            align: "start",
            loop: false,
            containScroll: "trimSnaps",
          }}
          className="w-full"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
              Best Sellers
            </h2>
            <div className="flex shrink-0 items-center gap-2">
              <CarouselPrevious className={NAV_BUTTON_CLASS} />
              <CarouselNext className={NAV_BUTTON_CLASS} />
            </div>
          </div>

          <CarouselContent className="ms-0 gap-4">
            {BEST_SELLERS.map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-[88%] ps-0 md:basis-[calc((100%-2rem)/3)]"
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
