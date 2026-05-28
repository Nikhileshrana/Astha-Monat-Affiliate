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

type SubmissionMeta = {
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

type AffiliateFormData = {
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

type AffiliateSubmission = {
  _id: string;
  formData: AffiliateFormData;
  submissionMeta?: SubmissionMeta;
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

function openInstagramMessage(username: string) {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return;

  if (isMobileDevice()) {
    window.open(
      `https://ig.me/m/${handle}?text=${encodeURIComponent(OUTREACH_MESSAGE)}`,
      "_blank",
      "noopener,noreferrer",
    );
    return;
  }

  void navigator.clipboard
    .writeText(OUTREACH_MESSAGE)
    .then(() => toast.success("Message copied. Tap Message on their profile to paste."))
    .catch(() => toast.message(`Open their profile and send: ${OUTREACH_MESSAGE}`));

  window.open(`https://www.instagram.com/${handle}/`, "_blank", "noopener,noreferrer");
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    return value.map((item) => LABELS[String(item)] ?? String(item)).join(", ");
  }
  if (typeof value === "string") return LABELS[value] ?? value;
  return String(value);
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed wrap-break-word">{formatValue(value)}</dd>
    </div>
  );
}

function SubmissionDetails({ submission }: { submission: AffiliateSubmission }) {
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
            <DetailRow label="Instagram" value={`@${form.instagramUsername}`} />
            <DetailRow label="Phone" value={form.phone} />
            <DetailRow label="Contact preference" value={form.contactPreference} />
            {form.contactPreferenceOther ? (
              <DetailRow label="Contact (other)" value={form.contactPreferenceOther} />
            ) : null}
          </dl>
        </section>

        <Separator />

        <section>
          <h3 className="text-sm font-semibold">About you</h3>
          <dl className="divide-y divide-border">
            <DetailRow label="18 or older" value={form.isOver18} />
            <DetailRow label="Current occupation" value={form.currentOccupation} />
            <DetailRow label="About yourself" value={form.aboutYourself} />
            <DetailRow label="Why online work" value={form.whyOnlineWork} />
            <DetailRow label="Life needs" value={form.lifeNeeds} />
            <DetailRow label="Coachable" value={form.isCoachable} />
          </dl>
        </section>

        <Separator />

        <section>
          <h3 className="text-sm font-semibold">Goals & readiness</h3>
          <dl className="divide-y divide-border">
            <DetailRow label="Time commitment" value={form.timeCommitment} />
            <DetailRow label="Monthly income goal" value={form.monthlyIncomeGoal} />
            <DetailRow label="Startup budget" value={form.startupBudget} />
            <DetailRow label="Discovery source" value={form.discoverySource} />
            {form.discoverySourceOther ? (
              <DetailRow label="Discovery (other)" value={form.discoverySourceOther} />
            ) : null}
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
                <DetailRow label="City" value={meta.geo?.city} />
                <DetailRow label="Country" value={meta.geo?.country} />
                <DetailRow label="Timezone" value={meta.geo?.timezone ?? meta.clientContext?.timezone} />
              </dl>
            </section>
          </>
        ) : null}
      </div>
    </ScrollArea>
  );
}

export default function AffiliateApplicationsPage() {
  const [submissions, setSubmissions] = useState<AffiliateSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<AffiliateSubmission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AffiliateSubmission | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const fetchSubmissions = useCallback(
    async (pageIdx = 0, limit = 10, search = "") => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(pageIdx + 1),
          limit: String(limit),
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        if (search) params.set("search", search);

        const res = await fetch(`/api/apply-affiliate?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          toast.error(json.error || "Failed to fetch affiliate applications");
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
    fetchSubmissions(pagination.pageIndex, pagination.pageSize, debouncedSearch);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, fetchSubmissions]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      const res = await fetch("/api/apply-affiliate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget._id }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to delete application");
        return;
      }

      toast.success("Application deleted");
      setDeleteTarget(null);
      if (selectedSubmission?._id === deleteTarget._id) {
        setSelectedSubmission(null);
      }
      fetchSubmissions(pagination.pageIndex, pagination.pageSize, debouncedSearch);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<AffiliateSubmission>[] = [
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
      cell: ({ row }) => <div className="font-medium">{row.original.formData.name}</div>,
    },
    {
      id: "email",
      accessorFn: (row) => row.formData.email,
      header: "Email",
      cell: ({ row }) => (
        <div className="max-w-48 truncate text-sm">{row.original.formData.email}</div>
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
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const submission = row.original;
        const { phone, instagramUsername, contactPreference } = submission.formData;
        const whatsappUrl =
          contactPreference === "whatsapp" || contactPreference === "call"
            ? buildWhatsAppUrl(phone)
            : buildWhatsAppUrl(phone);

        return (
          <div className="flex items-center justify-end gap-2">
            {whatsappUrl ? (
              <Button asChild size="icon-sm" variant="outline" className="text-[#25D366] hover:text-[#25D366]">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Message on WhatsApp"
                  title="Message on WhatsApp"
                >
                  WA
                </a>
              </Button>
            ) : null}
            {instagramUsername ? (
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="text-[#E1306C] hover:text-[#E1306C]"
                onClick={() => openInstagramMessage(instagramUsername)}
                aria-label="Message on Instagram"
                title="Message on Instagram"
              >
                IG
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setSelectedSubmission(submission)}>
              <Eye className="mr-1.5 h-4 w-4" />
              View
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(submission)}>
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
        searchPlaceholder="Search by name, email, Instagram, phone..."
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
      />

      <Sheet
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <SheetHeader className="shrink-0 border-b px-6 py-4">
            <SheetTitle>{selectedSubmission?.formData.name ?? "Application"}</SheetTitle>
            <SheetDescription>
              Submitted{" "}
              {selectedSubmission
                ? new Date(selectedSubmission.createdAt).toLocaleString()
                : ""}
            </SheetDescription>
          </SheetHeader>
          {selectedSubmission ? (
            <div className="min-h-0 flex-1 overflow-hidden">
              <SubmissionDetails submission={selectedSubmission} />
            </div>
          ) : null}
          <SheetFooter className="mt-0 shrink-0 border-t px-6 py-4">
            <SheetClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the affiliate application for{" "}
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
