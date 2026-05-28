import { Aperture, Share2, SquarePlay } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const FOOTER_NAV = [
  { href: "https://monatsocialshop.com/products/thicken-shine-duo?utm_source=superfiliate&utm_campaign=ASTHA-RANA&utm_medium=microsite&utm_content=eyJzZi1leHRlcm5hbC1zZXNzaW9uLXV1aWQiOiI5ZDlkYjBkZi1mZWExLTQ1MjUtYWU3My00NDg3NmJjYTI3ZjgifQ%3D%3D&ref=superfiliate-ASTHA-RANA&attributes=%7B%22sf-external-session-uuid%22+%3D%3E+%221ff2d03e-b932-4b31-b9eb-41c9d6c9c247%22%2C+%22sf-origin%22+%3D%3E+%22microsite--ASTHA-RANA%22%7D#", label: "Cookie Policy" },
  { href: "https://monatsocialshop.com/policies/privacy-policy", label: "Privacy Policy" },
  { href: "https://monatsocialshop.com/policies/terms-of-service", label: "Terms of Service" },
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
