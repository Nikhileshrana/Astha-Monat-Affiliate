import Link from "next/link";
import { Bot, ClipboardList, UserPlus } from "lucide-react";

import { cn } from "@/lib/utils";

const DASHBOARD_LINKS = [
  {
    title: "Hair Quiz Submissions",
    description: "View custom hair plan quiz responses and follow up.",
    href: "/protected/hairQuizForms",
    icon: ClipboardList,
    tone: {
      card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/30",
      icon: "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
      title: "text-emerald-950 dark:text-emerald-50",
    },
  },
  {
    title: "Affiliate Applications",
    description: "Review affiliate applications and reach out.",
    href: "/protected/affiliateApplications",
    icon: UserPlus,
    tone: {
      card: "border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:border-violet-900/50 dark:from-violet-950/40 dark:via-background dark:to-fuchsia-950/30",
      icon: "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-900/60 dark:text-violet-300",
      title: "text-violet-950 dark:text-violet-50",
    },
  },
  {
    title: "AI Chat",
    description: "Open the assistant chat for quick help.",
    href: "/protected/ai-agent",
    icon: Bot,
    tone: {
      card: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:border-sky-900/50 dark:from-sky-950/40 dark:via-background dark:to-cyan-950/30",
      icon: "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-900/60 dark:text-sky-300",
      title: "text-sky-950 dark:text-sky-50",
    },
  },
] as const;

export default function ProtectedPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jump into submissions and chat.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DASHBOARD_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group block rounded-2xl border p-4 shadow-sm transition-all",
              "hover:-translate-y-0.5 hover:shadow-md",
              item.tone.card,
              item.href === "/protected/ai-agent" && "sm:col-span-2",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                  item.tone.icon,
                )}
              >
                <item.icon className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className={cn("text-base font-semibold", item.tone.title)}>
                  {item.title}
                </h2>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
