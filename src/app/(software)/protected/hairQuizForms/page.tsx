"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Trash2 } from "lucide-react";
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
  SheetContent,
  SheetDescription,
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

type HairQuizSubmission = {
  _id: string;
  name: string;
  email: string;
  whatsapp: string;
  instagramUsername: string;
  hairThickness: string;
  hairTexture: string;
  rootType: string;
  endsType: string;
  hasDandruffOrItchyScalp: string;
  washFrequencyPerWeek: number;
  getsFrizzy: string;
  hotToolsFrequency: string;
  hairlossConcern: string;
  currentProducts?: string;
  isColorTreated: string;
  ultimateHairGoal: string;
  budget: string;
  contactPreference: string;
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

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
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

  return (
    <ScrollArea className="h-full max-h-[calc(100vh-8rem)] pr-4">
      <div className="space-y-6 pb-6">
        <section>
          <h3 className="text-sm font-semibold">Contact</h3>
          <dl className="divide-y divide-border">
            <DetailRow label="Name" value={submission.name} />
            <DetailRow label="Email" value={submission.email} />
            <DetailRow label="WhatsApp" value={submission.whatsapp} />
            <DetailRow label="Instagram" value={`@${submission.instagramUsername}`} />
            <DetailRow
              label="Contact preference"
              value={submission.contactPreference}
            />
          </dl>
        </section>

        <Separator />

        <section>
          <h3 className="text-sm font-semibold">Hair profile</h3>
          <dl className="divide-y divide-border">
            <DetailRow label="Thickness" value={submission.hairThickness} />
            <DetailRow label="Texture" value={submission.hairTexture} />
            <DetailRow label="Roots" value={submission.rootType} />
            <DetailRow label="Ends" value={submission.endsType} />
            <DetailRow
              label="Dandruff / itchy scalp"
              value={submission.hasDandruffOrItchyScalp}
            />
            <DetailRow
              label="Washes per week"
              value={submission.washFrequencyPerWeek}
            />
            <DetailRow label="Frizzy" value={submission.getsFrizzy} />
            <DetailRow label="Hot tools" value={submission.hotToolsFrequency} />
            <DetailRow label="Hairloss concern" value={submission.hairlossConcern} />
            <DetailRow label="Current products" value={submission.currentProducts} />
            <DetailRow label="Colour treated" value={submission.isColorTreated} />
            <DetailRow label="Hair goal" value={submission.ultimateHairGoal} />
            <DetailRow label="Budget" value={submission.budget} />
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
  const [selectedSubmission, setSelectedSubmission] = useState<HairQuizSubmission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HairQuizSubmission | null>(null);

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
    fetchSubmissions(pagination.pageIndex, pagination.pageSize, debouncedSearch);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, fetchSubmissions]);

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
      fetchSubmissions(pagination.pageIndex, pagination.pageSize, debouncedSearch);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<HairQuizSubmission>[] = [
    {
      accessorKey: "name",
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
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="max-w-[12rem] truncate text-sm">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "whatsapp",
      header: "WhatsApp",
      cell: ({ row }) => <div className="text-sm whitespace-nowrap">{row.getValue("whatsapp")}</div>,
    },
    {
      accessorKey: "instagramUsername",
      header: "Instagram",
      cell: ({ row }) => <div className="text-sm">@{row.getValue("instagramUsername")}</div>,
    },
    {
      accessorKey: "contactPreference",
      header: "Contact",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {formatValue(row.getValue("contactPreference"))}
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
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const geo = row.original.submissionMeta?.geo;
        const label = [geo?.city, geo?.country].filter(Boolean).join(", ");
        return <div className="text-sm text-muted-foreground">{label || "—"}</div>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
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
      <div className="mb-2">
        <h1 className="text-lg font-semibold">Hair Quiz Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Review quiz responses with contact details and submission metadata.
        </p>
      </div>

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
      />

      <Sheet
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>{selectedSubmission?.name ?? "Submission"}</SheetTitle>
            <SheetDescription>
              Submitted{" "}
              {selectedSubmission
                ? new Date(selectedSubmission.createdAt).toLocaleString()
                : ""}
            </SheetDescription>
          </SheetHeader>
          {selectedSubmission ? <SubmissionDetails submission={selectedSubmission} /> : null}
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
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>.
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
