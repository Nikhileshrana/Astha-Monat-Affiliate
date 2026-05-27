import {
  ChevronRight,
  CircleHelp,
  FileQuestionMark,
  type LucideIcon,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { MARKETING_PURPLE } from "@/lib/marketing-theme";
import { cn } from "@/lib/utils";

const METASHOP_URL = "https://monatsocialshop.com/ASTHA-RANA";

type JourneyAction = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
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
    title: "Discover Your Plan",
    description: "Take the Custom Hair Quiz",
    href: "/hair-quiz",
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
  icon: Icon,
}: JourneyAction) {
  const content = (
    <>
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl",
          MARKETING_PURPLE.iconBg,
          MARKETING_PURPLE.icon,
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span
          className={cn(
            "block font-semibold leading-snug",
            MARKETING_PURPLE.title,
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-sm leading-snug",
            MARKETING_PURPLE.subtitle,
          )}
        >
          {description}
        </span>
      </span>
      <ChevronRight
        className={cn("size-5 shrink-0", MARKETING_PURPLE.icon)}
        strokeWidth={1.75}
        aria-hidden
      />
    </>
  );

  const className = cn(
    "flex w-full items-center gap-4 rounded-2xl border p-4 shadow-sm",
    MARKETING_PURPLE.cardBorder,
    MARKETING_PURPLE.cardSurface,
    "transition-shadow hover:shadow-md active:scale-[0.995]",
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
        MARKETING_PURPLE.sectionBg,
      )}
    >
      <div className="mx-auto flex w-full max-w-lg flex-col items-center">
        <h2
          className={cn(
            "text-center font-sans text-xl font-semibold leading-snug sm:text-[1.35rem]",
            MARKETING_PURPLE.heading,
          )}
        >
          Ready to start your haircare journey?
        </h2>

        <div className="mt-6 flex w-full flex-col gap-3.5 sm:mt-8 sm:gap-4">
          {JOURNEY_ACTIONS.map((action) => (
            <JourneyActionCard key={action.title} {...action} />
          ))}
        </div>

        <p
          className={cn(
            "mt-6 text-center font-sans text-sm font-medium sm:mt-8",
            MARKETING_PURPLE.heading,
          )}
        >
          Cannot wait to help you 💜
        </p>

        <div
          className={cn(
            "mt-10 w-full rounded-3xl px-6 py-10 text-center text-white sm:mt-12 sm:px-8 sm:py-11",
            MARKETING_PURPLE.affiliate,
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
            href="#"
            className={cn(
              "mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-10",
              "font-sans text-sm font-semibold shadow-sm transition-opacity hover:opacity-95",
              MARKETING_PURPLE.affiliateButton,
            )}
          >
            Apply Now
          </Link>
        </div>
      </div>
    </section>
  );
}
