"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  buildWhatsAppUrl,
  getInstagramOutreachTitle,
  normalizeInstagramHandle,
  openInstagramMessage,
} from "@/lib/hair-quiz/outreach";

export type AffiliateFormData = {
  name: string;
  email: string;
  instagramUsername: string;
  phone: string;
  isOver18: string;
  currentOccupation: string;
  aboutYourself: string;
  whyOnlineWork: string;
  lifeNeeds: string[];
  isCoachable: string;
  timeCommitment: string;
  monthlyIncomeGoal: string;
  startupBudget: string;
  discoverySource: string;
  discoverySourceOther?: string;
  contactPreference: string;
  contactPreferenceOther?: string;
};

export type AffiliateSubmission = {
  _id: string;
  formData: AffiliateFormData;
  submissionMeta?: {
    capturedAt?: string;
    ip?: string | null;
    geo?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
    device?: {
      browser?: { name?: string; version?: string };
      os?: { name?: string; version?: string };
    };
    userAgent?: string | null;
    clientContext?: {
      language?: string;
      platform?: string;
      screen?: string;
      viewport?: string;
      timezone?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
};

const LABELS: Record<string, string> = {
  yes: "Yes",
  no: "No",
  true: "True",
  false: "False",
  additional_income: "Additional Income",
  like_minded_community: "Like minded community",
  time_freedom: "Time freedom",
  work_from_anywhere: "Ability to work from anywhere",
  "1_2_hrs_day": "1–2 hrs/day",
  part_time: "Part-time",
  full_time: "Full-time",
  "100_500_cad": "100–500 CAD$",
  "500_1000_cad": "500–1000 CAD$",
  "1000_2000_cad": "1000–2000 CAD$",
  "2500_5000_cad": "2500–5000 CAD$",
  "10000_plus": "10,000$+",
  "200_250": "200–250$",
  "350": "350$",
  "500_800": "500–800$",
  new_follower: "New Follower",
  have_been_following: "Have been following you",
  friend: "A friend told me about you",
  other: "Other",
  call: "Call",
  whatsapp: "WhatsApp",
  instagram_message: "Instagram Message",
};

export function formatAffiliateValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    return value.map((item) => LABELS[String(item)] ?? String(item)).join(", ");
  }
  if (typeof value === "string") return LABELS[value] ?? value;
  return String(value);
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-start gap-x-3 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-x-4">
      <dt className="pt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-sm leading-relaxed wrap-break-word">
        {formatAffiliateValue(value)}
      </dd>
    </div>
  );
}

function QuickActions({ form }: { form: AffiliateFormData }) {
  const whatsappUrl = buildWhatsAppUrl(form.phone);
  const instagramHandle = normalizeInstagramHandle(form.instagramUsername);

  return (
    <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <h3 className="text-sm font-semibold">Reach out</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 text-[#25D366] hover:text-[#25D366]"
          disabled={!whatsappUrl}
          onClick={() => {
            if (!whatsappUrl) return;
            window.open(whatsappUrl, "_blank", "noopener,noreferrer");
          }}
        >
          <WhatsAppIcon className="mr-2 h-5 w-5" />
          WhatsApp
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 text-[#E1306C] hover:text-[#E1306C]"
          disabled={!instagramHandle}
          onClick={() => openInstagramMessage(instagramHandle)}
          title={getInstagramOutreachTitle()}
        >
          <InstagramIcon className="mr-2 h-5 w-5" />
          Instagram
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Prefers {formatAffiliateValue(form.contactPreference)}
        {form.contactPreferenceOther ? ` · ${form.contactPreferenceOther}` : ""}
      </p>
    </section>
  );
}

export function AffiliateSubmissionSheet({
  submission,
  open,
  onOpenChange,
}: {
  submission: AffiliateSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!submission) return null;

  const form = submission.formData;
  const meta = submission.submissionMeta;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full! max-w-none! flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full"
      >
        <SheetHeader className="border-b pe-12">
          <SheetTitle>{form.name}</SheetTitle>
          <SheetDescription>
            Submitted {new Date(submission.createdAt).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6 px-4 py-4 pb-8 sm:px-6">
              <QuickActions form={form} />

              <Separator />

              <section className="space-y-1">
                <h3 className="text-sm font-semibold">Contact</h3>
                <dl className="divide-y divide-border">
                  <DetailRow label="Name" value={form.name} />
                  <DetailRow label="Email" value={form.email} />
                  <DetailRow label="Instagram" value={`@${form.instagramUsername}`} />
                  <DetailRow label="Phone" value={form.phone} />
                  <DetailRow label="Prefers" value={form.contactPreference} />
                  {form.contactPreferenceOther ? (
                    <DetailRow label="Other" value={form.contactPreferenceOther} />
                  ) : null}
                </dl>
              </section>

              <Separator />

              <section className="space-y-1">
                <h3 className="text-sm font-semibold">About</h3>
                <dl className="divide-y divide-border">
                  <DetailRow label="18+" value={form.isOver18} />
                  <DetailRow label="Occupation" value={form.currentOccupation} />
                  <DetailRow label="About" value={form.aboutYourself} />
                  <DetailRow label="Why online" value={form.whyOnlineWork} />
                  <DetailRow label="Life needs" value={form.lifeNeeds} />
                  <DetailRow label="Coachable" value={form.isCoachable} />
                </dl>
              </section>

              <Separator />

              <section className="space-y-1">
                <h3 className="text-sm font-semibold">Goals & readiness</h3>
                <dl className="divide-y divide-border">
                  <DetailRow label="Time" value={form.timeCommitment} />
                  <DetailRow label="Income goal" value={form.monthlyIncomeGoal} />
                  <DetailRow label="Budget" value={form.startupBudget} />
                  <DetailRow label="Found via" value={form.discoverySource} />
                  {form.discoverySourceOther ? (
                    <DetailRow label="Other" value={form.discoverySourceOther} />
                  ) : null}
                </dl>
              </section>

              {meta ? (
                <>
                  <Separator />
                  <section className="space-y-1">
                    <h3 className="text-sm font-semibold">Submission context</h3>
                    <dl className="divide-y divide-border">
                      <DetailRow label="IP" value={meta.ip} />
                      <DetailRow label="Country" value={meta.geo?.country} />
                      <DetailRow label="City" value={meta.geo?.city} />
                      <DetailRow
                        label="Timezone"
                        value={meta.geo?.timezone ?? meta.clientContext?.timezone}
                      />
                    </dl>
                  </section>
                </>
              ) : null}
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="border-t">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
