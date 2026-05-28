"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialIcon } from "react-social-icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Set `NEXT_PUBLIC_INSTAGRAM_URL` in `.env` to your IG profile. */
const INSTAGRAM_URL = "https://www.instagram.com/asthasharma28/";
const METASHOP_URL = "https://monatsocialshop.com/ASTHA-RANA";

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
  scrollToId?: string;
};

const NAV_LINKS: NavLink[] = [
  {
    label: "Before and After",
    href: "/#before-and-after",
    scrollToId: "before-and-after",
  },
  {
    label: "Shop Essentials",
    href: METASHOP_URL,
    external: true,
  },
  {
    label: "Hair Quiz Consultation",
    href: "/hair-quiz",
  },
  {
    label: "Be an Affiliate",
    href: "/apply-affiliate",
  },
];

const NAV_LINK_CLASS =
  "rounded-none px-4 py-3 text-sm font-semibold uppercase tracking-widest text-foreground underline-offset-4 hover:bg-muted hover:no-underline";

function NavSheetLink({ item }: { item: NavLink }) {
  const pathname = usePathname();

  if (item.scrollToId) {
    return (
      <SheetClose asChild>
        <Link
          href={item.href}
          className={NAV_LINK_CLASS}
          onClick={(event) => {
            if (pathname !== "/") return;

            event.preventDefault();
            document
              .getElementById(item.scrollToId ?? "")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {item.label}
        </Link>
      </SheetClose>
    );
  }

  if (item.external) {
    return (
      <SheetClose asChild>
        <Link
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={NAV_LINK_CLASS}
        >
          {item.label}
        </Link>
      </SheetClose>
    );
  }

  return (
    <SheetClose asChild>
      <Link href={item.href} className={NAV_LINK_CLASS}>
        {item.label}
      </Link>
    </SheetClose>
  );
}
function TopBanner() {
  return (
    <div className="bg-black px-4 py-2">
      <div className="mx-auto flex max-w-[1600px] items-center justify-center text-[11px] font-medium uppercase tracking-[0.12em] text-white">
        <Link
          href="/apply-affiliate"
          className="transition-opacity hover:opacity-80"
        >
          Be an Affiliate
        </Link>
      </div>
    </div>
  );
}

/** Official MONAT wordmark paths (converted to `currentColor`). */
function MonatWordmarkSvg({ className }: { className?: string }) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: redundant; parent AsthaMonatLogo Link has descriptive aria-label
    <svg
      className={cn(
        "block h-[0.9375rem] w-auto shrink-0 sm:h-[1.0833rem] md:h-[1.25rem]",
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1840 221.7"
      aria-hidden
    >
      <g fill="currentColor">
        <path d="M138.8,209.8L179.9,0l67,151.7L316.3,0l36.9,209.8h-30.2l-18.8-117.8-57.8,126.8-56.1-126.9-21,117.9h-30.5Z" />
        <path d="M516.1,111.3c0-27.5,10.1-51.1,30.2-70.8,20-19.7,44.2-29.6,72.3-29.6s51.7,9.9,71.5,29.8c20,19.9,30,43.8,30,71.7s-10,51.9-30.1,71.4c-20.1,19.6-44.5,29.4-72.9,29.4s-47.8-8.7-67.9-26.2c-22.1-19.3-33.1-44.6-33.1-75.9ZM545.8,111.7c0,21.6,7.2,39.3,21.7,53.2,14.4,13.9,31,20.8,49.9,20.8s37.8-7.1,51.8-21.2c14.1-14.3,21.1-31.7,21.1-52.3s-7-38.2-20.8-52.3c-13.8-14.1-30.9-21.2-51.3-21.2s-37.5,7.1-51.4,21.2c-14,14-21,31.2-21,51.8Z" />
        <path d="M896.7,209.8V1.4l142.3,148.9V14.7h29.4v207l-142.3-148.5v136.6h-29.5Z" />
        <path d="M1363.2,134.7l-28.9-66.3-30.3,66.3-12.3,27.7-21.7,47.4h-31.7L1334.8,2.4l93.2,207.4h-32.2l-20.5-47.4-12-27.7Z" />
        <path d="M1656.3,42.3v167.5h-29.4V42.3h-44.9V14.7h119.1v27.7h-44.7Z" />
        <path d="M1840,42.9c0,8.5-3,15.8-8.9,21.8-6,6-13.2,9-21.7,9s-15.7-3-21.7-9c-6-6-8.9-13.3-8.9-21.8s1-9.1,2.9-13c2-4.2,4.7-7.7,8.2-10.6,5.7-4.7,12.1-7.1,19.2-7.1s9,.9,12.8,2.7c5.4,2.4,9.8,6.1,13.1,11.3,3.3,5.2,5,10.8,5,16.7ZM1809.2,16.7c-7,0-13,2.6-18,7.7-5,5.2-7.5,11.3-7.5,18.4s2.5,13.5,7.5,18.7c5,5.2,11.1,7.7,18.2,7.7s13.1-2.6,18.1-7.7c5-5.2,7.5-11.4,7.5-18.7s-1-7.9-2.9-12.1c-1.9-3.9-4.5-7-7.7-9.3-4.5-3.2-9.6-4.8-15.2-4.8ZM1812.4,45.9l11.5,14.8h-8.3l-10.5-14v14h-6.8V25.3h7.1c4.9,0,8.6.9,10.8,2.6,2.5,2,3.8,4.7,3.8,8s-.7,4.3-2,6.2c-1.3,1.8-3.1,3.1-5.2,3.7h-.5ZM1805.1,41h1.2c4.8,0,7.3-1.7,7.3-5s-2.3-4.7-7-4.7h-1.4v9.7Z" />
      </g>
    </svg>
  );
}

function AsthaMonatLogo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-[0.375rem] font-sans text-neutral-950 hover:opacity-85 sm:gap-2 md:gap-[0.625rem]"
      aria-label="ASTHA × MONAT, home"
    >
      <span className="shrink-0 text-sm font-semibold uppercase leading-none tracking-[0.28em] md:text-xl">
        ASTHA
      </span>
      <span
        className="shrink-0 translate-y-[0.035em] px-px text-xs font-extrabold leading-none sm:text-sm md:text-base"
        aria-hidden
      >
        ×
      </span>
      <MonatWordmarkSvg />
    </Link>
  );
}

/** SocialIcon renders its own anchor; nesting inside Next Link is invalid HTML. */
function InstagramNavLink() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center">
      <SocialIcon
        url={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        label="Instagram (opens in a new tab)"
        style={{ height: 26, width: 26 }}
      />
    </div>
  );
}

export function Navbar() {
  return (
    <>
      <TopBanner />

      <header className="sticky top-0 z-40 border-b border-black/5 bg-white">
        <nav
          aria-label="Main"
          className="relative mx-auto flex h-[3.25rem] max-w-[1600px] items-stretch px-4 py-0 md:h-16 md:px-6"
        >
          <div className="relative z-10 flex items-center">
            <InstagramNavLink />
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-[3.25rem] md:px-14">
            <div className="pointer-events-auto">
              <AsthaMonatLogo />
            </div>
          </div>

          <div className="relative z-10 ms-auto flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-10 shrink-0 rounded-none text-black hover:bg-black/5"
                  aria-label="Open navigation menu"
                >
                  <MenuIcon aria-hidden className="size-6" strokeWidth={1.75} />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="flex max-h-svh flex-col gap-0 border-black/10 p-0 sm:max-w-sm"
                showCloseButton
              >
                <SheetHeader className="gap-3 border-b border-border p-8 pb-6 text-start">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                    Explore products and affiliate resources.
                  </SheetDescription>
                </SheetHeader>

                <nav aria-label="Mobile" className="flex flex-col px-4 py-4">
                  {NAV_LINKS.map((item) => (
                    <NavSheetLink key={item.label} item={item} />
                  ))}
                </nav>

                <div className="mt-auto border-t border-border px-8 py-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Follow along
                  </p>
                  <div className="mt-4 flex gap-4">
                    <SocialIcon
                      url={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      label="Instagram"
                      style={{ height: 36, width: 36 }}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>
    </>
  );
}
