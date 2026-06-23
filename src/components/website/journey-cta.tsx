import {
  ChevronRight,
  CircleHelp,
  FileQuestionMark,
  type LucideIcon,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const METASHOP_URL = "https://monatsocialshop.com/ASTHA-RANA";

type JourneyAction = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  featured?: boolean;
  icon: LucideIcon;
};

const JOURNEY_ACTIONS: JourneyAction[] = [
  {
    title: "Shop Essentials",
    description: "Curated sets for your needs",
    href: METASHOP_URL,
    external: true,
    icon: ShoppingBag,
  },
  {
    title: "Take Your Custom Hair Journey Plan",
    description: "Free hair quiz — get a routine made just for you",
    href: "/hair-quiz",
    featured: true,
    icon: FileQuestionMark,
  },
  {
    title: "FAQ & Tips",
    description: "Ask our expert community",
    href: "#",
    icon: CircleHelp,
  },
];

function JourneyActionCard({
  title,
  description,
  href,
  external,
  featured,
  icon: Icon,
}: JourneyAction) {
  const content = (
    <>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl",
          featured
            ? "size-14 bg-primary text-primary-foreground shadow-md sm:size-16"
            : "size-12 bg-primary text-primary-foreground",
        )}
      >
        <Icon
          className={cn(featured ? "size-6 sm:size-7" : "size-5")}
          strokeWidth={1.75}
          aria-hidden
        />
      </span>
      <span className="min-w-0 flex-1 text-start">
        {featured ? (
          <span className="mb-1.5 inline-flex rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Start here
          </span>
        ) : null}
        <span
          className={cn(
            "block font-semibold leading-snug",
            featured
              ? "text-lg font-bold text-foreground sm:text-xl"
              : "text-foreground",
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "mt-0.5 block leading-snug",
            featured
              ? "text-sm text-foreground/80 sm:text-base"
              : "text-sm text-muted-foreground",
          )}
        >
          {description}
        </span>
      </span>
      <ChevronRight
        className={cn(
          "size-5 shrink-0",
          featured ? "size-6 text-primary" : "text-muted-foreground",
        )}
        strokeWidth={featured ? 2.25 : 1.75}
        aria-hidden
      />
    </>
  );

  const className = cn(
    "flex w-full items-center gap-4 rounded-2xl border shadow-sm transition-all",
    "hover:shadow-md active:scale-[0.995]",
    featured
      ? "gap-5 border-2 border-primary/50 bg-linear-to-br from-primary/12 via-primary/5 to-card p-5 shadow-md ring-2 ring-primary/15 sm:scale-[1.02] sm:gap-6 sm:p-6 md:p-7"
      : "border-2 border-border bg-card p-4",
  );

  if (external) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/** Journey CTAs + affiliate block (centered card stack layout). */
export default function JourneyCtaSection() {
  return (
    <section
      className={cn(
        "w-full px-4 py-12 sm:px-6 sm:py-14",
        "bg-background",
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <h2
          className={cn(
            "text-center font-heading text-3xl font-bold tracking-tight md:text-4xl",
            "text-foreground",
          )}
        >
          Ready to start your haircare journey?
        </h2>

        <div className="mt-6 flex w-full flex-col gap-3.5 sm:mt-8 sm:gap-4">
          {JOURNEY_ACTIONS.map((action) => (
            <JourneyActionCard key={action.title} {...action} />
          ))}
        </div>

        <p className="mt-6 text-center text-sm font-medium text-foreground sm:mt-8 sm:text-base">
          Cannot wait to help you 💜
        </p>

        <div
          className={cn(
            "mt-10 w-full rounded-3xl px-6 py-10 text-center text-white sm:mt-12 sm:px-8 sm:py-11",
            "bg-primary",
          )}
        >
          <h3 className="font-sans text-2xl font-bold tracking-tight sm:text-[1.65rem]">
            Grow With Us
          </h3>
          <p className="mx-auto mt-4 max-w-sm font-sans text-sm leading-relaxed text-white/95 sm:text-[0.9375rem]">
            Love our products? Become a partner and share the secret to radiant
            hair with your community.
          </p>
          <p className="mt-8 font-sans text-sm font-bold sm:text-base">
            Affiliate Program Application
          </p>
          <Link
            href="/apply-affiliate"
            className={cn(
              "mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-10",
              "font-sans text-sm font-semibold text-primary shadow-sm transition-opacity hover:opacity-95",
            )}
          >
            Apply Now
          </Link>
        </div>
      </div>
    </section>
  );
}
