"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Trash2 } from "lucide-react";
import { parsePhoneNumber } from "libphonenumber-js";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { HairQuizFiltersPanel } from "@/app/(software)/protected/hairQuizForms/filters-panel";
import {
  appendFiltersToSearchParams,
  EMPTY_HAIR_QUIZ_FILTERS,
  type HairQuizFilterOptions,
  type HairQuizListFilters,
} from "@/lib/hair-quiz/filters";

type SubmissionMeta = {
  capturedAt?: string;
  ip?: string | null;
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
    timezone?: string;
    source?: string;
  };
  device?: {
    browser?: { name?: string; version?: string };
    os?: { name?: string; version?: string };
    device?: { type?: string; vendor?: string; model?: string };
    engine?: { name?: string; version?: string };
    cpu?: { architecture?: string };
  };
  userAgent?: string | null;
  acceptLanguage?: string | null;
  referer?: string | null;
  origin?: string | null;
  host?: string | null;
  clientHints?: Record<string, string>;
  clientContext?: {
    language?: string;
    platform?: string;
    screen?: string;
    viewport?: string;
    timezone?: string;
  };
};

type HairQuizFormData = {
  name: string;
  email: string;
  whatsapp: string;
  whatsappCountry?: string;
  instagramUsername: string;
  hairThickness: string;
  hairTexture: string;
  rootType: string;
  endsType: string | string[];
  hasDandruffOrItchyScalp: string;
  washFrequencyPerWeek: number;
  getsFrizzy: string;
  hotToolsFrequency: string;
  hairlossConcern: string | string[];
  currentProducts?: string;
  isColorTreated: string;
  ultimateHairGoal: string;
  budget: string;
  contactPreference: string;
};

type HairQuizSubmission = {
  _id: string;
  formData: HairQuizFormData;
  submissionMeta?: SubmissionMeta;
  createdAt: string;
  updatedAt: string;
};

const LABELS: Record<string, string> = {
  thin: "Thin",
  medium: "Medium",
  thick: "Thick",
  wavy: "Wavy",
  straight: "Straight",
  curly: "Curly",
  oily_24_48_hours: "Oily (24–48 hours)",
  dry: "Dry",
  oily_3_4_days: "Oily in 3–4 days",
  damaged: "Damaged",
  split: "Split",
  all_of_the_above: "All of the above",
  yes: "Yes",
  no: "No",
  weekly: "Weekly",
  every_other_day: "Every other day",
  twice_a_month: "Twice a month",
  very_rarely: "Very rarely",
  overall_thinning: "Overall thinning",
  postpartum_or_post_covid: "Postpartum / Post Covid",
  bald_spots: "Bald spots",
  receding_hairline: "Receding hairline",
  none: "No hairloss",
  "150_170": "$150–$170",
  "175_200": "$175–$200",
  "250_plus": "$250+",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
};

const OUTREACH_MESSAGE = "Hello! This is Astha! 💜😊";

function buildWhatsAppUrl(phone: string) {
  try {
    const parsed = parsePhoneNumber(phone);
    const digits = parsed?.format("E.164").replace(/\D/g, "") ?? phone.replace(/\D/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(OUTREACH_MESSAGE)}`;
  } catch {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(OUTREACH_MESSAGE)}`;
  }
}

function normalizeInstagramHandle(username: string) {
  return username.trim().replace(/^@+/, "");
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function buildInstagramMobileUrl(username: string) {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return null;
  return `https://ig.me/m/${handle}?text=${encodeURIComponent(OUTREACH_MESSAGE)}`;
}

function buildInstagramWebUrl(username: string) {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return null;
  return `https://www.instagram.com/${handle}/`;
}

function openInstagramMessage(username: string) {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return;

  if (isMobileDevice()) {
    const url = buildInstagramMobileUrl(handle);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const profileUrl = buildInstagramWebUrl(handle);
  if (!profileUrl) return;

  void navigator.clipboard
    .writeText(OUTREACH_MESSAGE)
    .then(() => {
      toast.success("Message copied. Tap Message on their profile to paste.");
    })
    .catch(() => {
      toast.message(`Open their profile and send: ${OUTREACH_MESSAGE}`);
    });

  window.open(profileUrl, "_blank", "noopener,noreferrer");
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

function ContactActionButtons({
  whatsapp,
  instagramUsername,
}: {
  whatsapp: string;
  instagramUsername: string;
}) {
  const whatsappUrl = buildWhatsAppUrl(whatsapp);
  const instagramHandle = normalizeInstagramHandle(instagramUsername);
  const instagramTitle = isMobileDevice()
    ? "Message on Instagram"
    : "Open Instagram profile (message copied to clipboard)";

  return (
    <>
      {whatsappUrl ? (
        <Button
          asChild
          size="icon-sm"
          variant="outline"
          className="text-[#25D366] hover:text-[#25D366]"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message on WhatsApp"
            title="Message on WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </a>
        </Button>
      ) : (
        <Button
          size="icon-sm"
          variant="outline"
          className="text-[#25D366]"
          disabled
          aria-label="WhatsApp number unavailable"
        >
          <WhatsAppIcon className="h-4 w-4" />
        </Button>
      )}
      {instagramHandle ? (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          className="text-[#E1306C] hover:text-[#E1306C]"
          onClick={() => openInstagramMessage(instagramHandle)}
          aria-label={instagramTitle}
          title={instagramTitle}
        >
          <InstagramIcon className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="icon-sm"
          variant="outline"
          className="text-[#E1306C]"
          disabled
          aria-label="Instagram username unavailable"
        >
          <InstagramIcon className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    return value.map((item) => LABELS[String(item)] ?? String(item)).join(", ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return LABELS[value] ?? value;
  return JSON.stringify(value);
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed break-words">{formatValue(value)}</dd>
    </div>
  );
}

function SubmissionDetails({ submission }: { submission: HairQuizSubmission }) {
  const meta = submission.submissionMeta;
  const form = submission.formData;

  return (
    <ScrollArea className="h-full px-6 pb-4">
      <div className="space-y-6 pb-6">
        <section>
          <h3 className="text-sm font-semibold">Contact</h3>
          <dl className="divide-y divide-border">
            <DetailRow label="Name" value={form.name} />
            <DetailRow label="Email" value={form.email} />
            <DetailRow label="WhatsApp" value={form.whatsapp} />
            <DetailRow label="Phone country" value={form.whatsappCountry} />
            <DetailRow label="Instagram" value={`@${form.instagramUsername}`} />
            <DetailRow label="Contact preference" value={form.contactPreference} />
          </dl>
        </section>

        <Separator />

        <section>
          <h3 className="text-sm font-semibold">Hair profile</h3>
          <dl className="divide-y divide-border">
            <DetailRow label="Thickness" value={form.hairThickness} />
            <DetailRow label="Texture" value={form.hairTexture} />
            <DetailRow label="Roots" value={form.rootType} />
            <DetailRow label="Ends" value={form.endsType} />
            <DetailRow
              label="Dandruff / itchy scalp"
              value={form.hasDandruffOrItchyScalp}
            />
            <DetailRow label="Washes per week" value={form.washFrequencyPerWeek} />
            <DetailRow label="Frizzy" value={form.getsFrizzy} />
            <DetailRow label="Hot tools" value={form.hotToolsFrequency} />
            <DetailRow label="Hairloss concern" value={form.hairlossConcern} />
            <DetailRow label="Current products" value={form.currentProducts} />
            <DetailRow label="Colour treated" value={form.isColorTreated} />
            <DetailRow label="Hair goal" value={form.ultimateHairGoal} />
            <DetailRow label="Budget" value={form.budget} />
          </dl>
        </section>

        {meta ? (
          <>
            <Separator />
            <section>
              <h3 className="text-sm font-semibold">Submission metadata</h3>
              <dl className="divide-y divide-border">
                <DetailRow label="Captured at" value={meta.capturedAt} />
                <DetailRow label="IP address" value={meta.ip} />
                <DetailRow label="Country" value={meta.geo?.country} />
                <DetailRow label="Region" value={meta.geo?.region} />
                <DetailRow label="City" value={meta.geo?.city} />
                <DetailRow label="Timezone" value={meta.geo?.timezone ?? meta.clientContext?.timezone} />
                <DetailRow
                  label="Coordinates"
                  value={
                    meta.geo?.latitude && meta.geo?.longitude
                      ? `${meta.geo.latitude}, ${meta.geo.longitude}`
                      : undefined
                  }
                />
                <DetailRow
                  label="Browser"
                  value={
                    meta.device?.browser
                      ? `${meta.device.browser.name ?? ""} ${meta.device.browser.version ?? ""}`.trim()
                      : undefined
                  }
                />
                <DetailRow
                  label="Operating system"
                  value={
                    meta.device?.os
                      ? `${meta.device.os.name ?? ""} ${meta.device.os.version ?? ""}`.trim()
                      : undefined
                  }
                />
                <DetailRow
                  label="Device"
                  value={
                    meta.device?.device
                      ? [meta.device.device.vendor, meta.device.device.model, meta.device.device.type]
                          .filter(Boolean)
                          .join(" · ")
                      : undefined
                  }
                />
                <DetailRow label="Language" value={meta.clientContext?.language ?? meta.acceptLanguage} />
                <DetailRow label="Screen" value={meta.clientContext?.screen} />
                <DetailRow label="Viewport" value={meta.clientContext?.viewport} />
                <DetailRow label="Platform" value={meta.clientContext?.platform} />
                <DetailRow label="Referer" value={meta.referer} />
                <DetailRow label="User agent" value={meta.userAgent} />
              </dl>
            </section>
          </>
        ) : null}
      </div>
    </ScrollArea>
  );
}

export default function HairQuizFormsPage() {
  const [submissions, setSubmissions] = useState<HairQuizSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<HairQuizListFilters>(
    EMPTY_HAIR_QUIZ_FILTERS,
  );
  const [filterOptions, setFilterOptions] = useState<HairQuizFilterOptions>({
    ipCountries: [],
    ipCities: [],
    phoneCountries: [],
  });
  const [selectedSubmission, setSelectedSubmission] = useState<HairQuizSubmission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HairQuizSubmission | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/hair-quiz?filterOptions=true");
      const json = await res.json();
      if (res.ok && json.filterOptions) {
        setFilterOptions(json.filterOptions);
      }
    } catch {
      // Non-blocking: enum filters still work without dynamic location options.
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const fetchSubmissions = useCallback(
    async (
      pageIdx = 0,
      limit = 10,
      search = "",
      filters: HairQuizListFilters = EMPTY_HAIR_QUIZ_FILTERS,
    ) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(pageIdx + 1),
          limit: String(limit),
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        if (search) params.set("search", search);
        appendFiltersToSearchParams(params, filters);

        const res = await fetch(`/api/hair-quiz?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          toast.error(json.error || "Failed to fetch hair quiz submissions");
          return;
        }

        setSubmissions(json.data ?? []);
        setTotalItems(json.pagination?.total ?? 0);
        setPageCount(json.pagination?.pageCount ?? 0);
      } catch {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchSubmissions(
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
      appliedFilters,
    );
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    appliedFilters,
    fetchSubmissions,
  ]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      const res = await fetch("/api/hair-quiz", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget._id }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to delete submission");
        return;
      }

      toast.success("Submission deleted");
      setDeleteTarget(null);
      if (selectedSubmission?._id === deleteTarget._id) {
        setSelectedSubmission(null);
      }
      fetchSubmissions(
        pagination.pageIndex,
        pagination.pageSize,
        debouncedSearch,
        appliedFilters,
      );
      fetchFilterOptions();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<HairQuizSubmission>[] = [
    {
      id: "name",
      accessorFn: (row) => row.formData.name,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-transparent"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.formData.name}</div>
      ),
    },
    {
      id: "whatsapp",
      accessorFn: (row) => row.formData.whatsapp,
      header: "WhatsApp",
      cell: ({ row }) => (
        <div className="text-sm whitespace-nowrap">{row.original.formData.whatsapp}</div>
      ),
    },
    {
      id: "instagramUsername",
      accessorFn: (row) => row.formData.instagramUsername,
      header: "Instagram",
      cell: ({ row }) => (
        <div className="text-sm">@{row.original.formData.instagramUsername}</div>
      ),
    },
    {
      id: "contactPreference",
      accessorFn: (row) => row.formData.contactPreference,
      header: "Contact",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {formatValue(row.original.formData.contactPreference)}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(row.getValue("createdAt")).toLocaleString()}
        </div>
      ),
    },
    {
      id: "ipCountry",
      header: "IP Country",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.submissionMeta?.geo?.country || "—"}
        </div>
      ),
    },
    {
      id: "ipCity",
      header: "IP City",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.submissionMeta?.geo?.city || "—"}
        </div>
      ),
    },
    {
      id: "phoneCountry",
      header: "Phone Country",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.formData.whatsappCountry || "—"}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const submission = row.original;
        const { whatsapp, instagramUsername } = submission.formData;
        return (
          <div className="flex items-center justify-end gap-2">
            <ContactActionButtons
              whatsapp={whatsapp}
              instagramUsername={instagramUsername}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedSubmission(submission)}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              View
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteTarget(submission)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={submissions}
        searchKey="name"
        searchPlaceholder="Search by name, email, Instagram, WhatsApp..."
        loading={loading}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        manualFiltering
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        totalItems={totalItems}
        defaultPageSize={10}
        leftActions={
          <HairQuizFiltersPanel
            appliedFilters={appliedFilters}
            filterOptions={filterOptions}
            onApply={(filters) => {
              setAppliedFilters(filters);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
        }
      />

      <Sheet
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl!"
        >
          <SheetHeader className="border-b">
            <SheetTitle>{selectedSubmission?.formData.name ?? "Submission"}</SheetTitle>
            <SheetDescription>
              Submitted{" "}
              {selectedSubmission
                ? new Date(selectedSubmission.createdAt).toLocaleString()
                : ""}
            </SheetDescription>
          </SheetHeader>
          {selectedSubmission ? (
            <div className="min-h-0 flex-1 overflow-hidden py-4">
              <SubmissionDetails submission={selectedSubmission} />
            </div>
          ) : null}
          <SheetFooter className="border-t">
            <SheetClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the hair quiz submission for{" "}
              <span className="font-medium text-foreground">{deleteTarget?.formData.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
