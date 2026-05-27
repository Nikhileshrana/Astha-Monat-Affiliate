import { Aperture, Share2, SquarePlay } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const FOOTER_NAV = [
  { href: "#", label: "The Science" },
  { href: "#", label: "Sustainability" },
  { href: "#", label: "Editorial" },
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
] as const;

const INSTAGRAM_URL = "https://www.instagram.com/asthasharma28/";

const iconLinkClass = cn(
  "inline-flex text-[#1a1a2e] transition-opacity hover:opacity-70",
  "dark:text-foreground",
);

/** Minimal centered footer (MONAT EXPERT mock). */
export function SiteFooter() {
  return (
    <footer
      className={cn(
        "border-t border-black/[0.04] bg-[#f5f5f7] px-6 py-14 text-center",
        "dark:border-border dark:bg-background md:py-16",
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 md:gap-10">
        <p
          className={cn(
            "font-heading text-[1.875rem] font-bold uppercase leading-none tracking-tight",
            "text-[#1a1a2e] sm:text-4xl dark:text-foreground",
          )}
        >
          ASTHA HAIR EXPERT
        </p>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        >
          {FOOTER_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "font-sans text-sm font-normal text-[#666666] transition-colors",
                "hover:text-[#1a1a2e] dark:text-muted-foreground dark:hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-center gap-6">
          <Link href="#" className={iconLinkClass} aria-label="Share">
            <Share2 className="size-5" strokeWidth={1.75} aria-hidden />
          </Link>
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={iconLinkClass}
            aria-label="Instagram (opens in a new tab)"
          >
            <Aperture className="size-5" strokeWidth={1.75} aria-hidden />
          </Link>
          <Link href="#" className={iconLinkClass} aria-label="Media gallery">
            <SquarePlay className="size-5" strokeWidth={1.75} aria-hidden />
          </Link>
        </div>

        <p
          className={cn(
            "font-sans text-[10px] font-medium uppercase tracking-[0.22em]",
            "text-gray-400 dark:text-muted-foreground/80",
          )}
        >
          © 2026 ASTHA HAIR EXPERT. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
