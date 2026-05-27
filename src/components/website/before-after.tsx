"use client";

import { ImageComparison } from "@/components/ui/image-comparison-slider";

export default function BeforeAfterSection() {
  return (
    <section className="w-full bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-[1600px] flex flex-col gap-8">
        <div className="mb-6 text-center md:mb-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Before & After
          </h2>
          <p className="mt-3 max-w-2xl px-2 text-sm text-muted-foreground sm:mx-auto sm:text-base">
            Drag to see the difference.
          </p>
        </div>

        <div className="mx-auto grid w-full grid-cols-1 gap-6 lg:max-w-4xl lg:grid-cols-2 lg:gap-8">
          <ImageComparison
            showLabels
            className="mx-auto w-full max-w-xl lg:max-w-none"
            beforeImage="/images/bnf/b1.png"
            afterImage="/images/bnf/a1.png"
            altBefore="Before treatment"
            altAfter="After treatment"
            initialPosition={50}
          />

          <ImageComparison
            showLabels
            className="mx-auto w-full max-w-xl lg:max-w-none"
            beforeImage="/images/bnf/b2.png"
            afterImage="/images/bnf/a2.png"
            altBefore="Before treatment"
            altAfter="After treatment"
            initialPosition={50}
          />
        </div>
      </div>
    </section>
  );
}
