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

const SECTION_TITLE =
  "font-heading text-3xl font-bold tracking-tight md:text-4xl";

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

const SINGLE_PRODUCTS: Product[] = [
  {
    id: "serum",
    category: "Hair Care",
    title: "IR Clinical™ Hair Thinning Defense Serum",
    features: ["Scalp treatment", "Fast-absorbing", "Daily use"],
    imageSrc: "/images/hero/1.webp",
    href: `${METASHOP_URL}?q=ir-clinical-hair-thinning-defense`,
  },
  {
    id: "oil",
    category: "Hair & Skin",
    title: "Rejuveniqe® Oil Intensive",
    features: ["13+ botanical oils", "Frizz control", "Adds shine"],
    imageSrc: "/images/hero/2.webp",
    href: `${METASHOP_URL}?q=rejuveniqe-oil-intensive`,
  },
  {
    id: "rejuvabeads",
    category: "Hair Care",
    title: "Rejuvabeads™ Split End Mender",
    features: ["Targets split ends", "Lightweight", "Heat-friendly"],
    imageSrc: "/images/hero/3.webp",
    href: `${METASHOP_URL}?q=rejuvabeads`,
  },
];

const DUO_PRODUCTS: Product[] = [
  {
    id: "oil-rejuvabeads-duo",
    category: "Duo",
    title: "Mend & Shine Haircare Duo",
    features: ["Oil + Rejuvabeads", "Shine & repair", "Bundle savings"],
    imageSrc: "/images/hero/4.png",
    href: `${METASHOP_URL}?q=mend-shine-haircare-duo`,
  },
  {
    id: "oil-serum-duo",
    category: "Duo",
    title: "Thicken & Shine Duo",
    features: ["Oil + Serum", "Fuller-looking hair", "Bundle savings"],
    imageSrc: "/images/hero/5.png",
    href: `${METASHOP_URL}?q=thicken-shine-duo`,
  },
  {
    id: "serum-rejuvabeads-duo",
    category: "Duo",
    title: "Scalp to Ends Duo",
    features: ["Serum + Rejuvabeads", "Root to tip care", "Bundle savings"],
    imageSrc: "/images/hero/6.png",
    href: `${METASHOP_URL}?q=scalp-to-ends-duo`,
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

function ProductCarousel({
  products,
  title,
  className,
}: {
  products: Product[];
  title?: string;
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
      <div className="mb-4 flex items-center justify-between gap-4">
        {title ? (
          <h2 className={SECTION_TITLE}>{title}</h2>
        ) : (
          <div aria-hidden className="min-w-0 flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-2">
          <CarouselPrevious className={NAV_BUTTON_CLASS} />
          <CarouselNext className={NAV_BUTTON_CLASS} />
        </div>
      </div>

      <CarouselContent className="ms-0 gap-4">
        {products.map((product) => (
          <CarouselItem
            key={product.id}
            className="basis-[88%] ps-0 md:basis-[calc((100%-2rem)/3)]"
          >
            <ProductCard product={product} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

/** Two product carousels — swipe on mobile, three-across on desktop. */
export default function ProductsSection() {
  return (
    <section
      id="products"
      className="w-full bg-background px-4 py-10 text-foreground sm:px-6 sm:py-12 lg:px-8 lg:py-14"
    >
      <div className="mx-auto w-full max-w-4xl">
        <ProductCarousel products={SINGLE_PRODUCTS} title="Products" />
        <ProductCarousel products={DUO_PRODUCTS} className="mt-10 md:mt-12" />
      </div>
    </section>
  );
}
