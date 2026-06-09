"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Download, Trash2 } from "lucide-react";
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
import { HairQuizFiltersPanel } from "@/app/(software)/protected/hairQuizForms/filters-panel";
import {
  HairQuizSubmissionSheet,
  TreatmentStatusDot,
} from "@/app/(software)/protected/hairQuizForms/submission-sheet";
import { appendFiltersToSearchParams } from "@/lib/hair-quiz/queries";
import {
  EMPTY_HAIR_QUIZ_FILTERS,
  formatFieldValue,
  isFollowUpOverdue,
  type HairQuizFilterOptions,
  type HairQuizListFilters,
  type HairQuizSubmission,
} from "@/lib/hair-quiz/schema";
import { cn } from "@/lib/utils";

export default function HairQuizFormsPage() {
  const [submissions, setSubmissions] = useState<HairQuizSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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
  const cursorsRef = useRef<(string | null)[]>([null]);

  const resetPagination = useCallback(() => {
    cursorsRef.current = [null];
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

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
          limit: String(limit),
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        if (pageIdx === 0) params.set("includeTotal", "true");

        const cursor = cursorsRef.current[pageIdx];
        if (cursor) params.set("cursor", cursor);
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

        if (json.pagination?.nextCursor) {
          cursorsRef.current[pageIdx + 1] = json.pagination.nextCursor;
        }
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
    resetPagination();
  }, [debouncedSearch, pagination.pageSize, resetPagination]);

  const mergeSubmissionUpdate = useCallback((updated: HairQuizSubmission) => {
    setSubmissions((prev) =>
      prev.map((item) => (item._id === updated._id ? updated : item)),
    );
    setSelectedSubmission((prev) =>
      prev && prev._id === updated._id ? updated : prev,
    );
  }, []);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams({ export: "csv" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      appendFiltersToSearchParams(params, appliedFilters);

      const res = await fetch(`/api/hair-quiz?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || "Failed to export CSV");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `hair-quiz-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch {
      toast.error("Network error");
    } finally {
      setExporting(false);
    }
  };

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
          {formatFieldValue(row.original.formData.contactPreference)}
        </Badge>
      ),
    },
    {
      id: "treatmentStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.adminTracking.treatmentStatus;
        return <TreatmentStatusDot status={status} />;
      },
    },
    {
      id: "followUpAt",
      header: "Follow-up",
      cell: ({ row }) => {
        const followUpAt = row.original.adminTracking.followUpAt;
        if (!followUpAt) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        const overdue = isFollowUpOverdue(followUpAt);
        return (
          <span
            className={cn(
              "text-sm whitespace-nowrap",
              overdue && "font-medium text-destructive",
            )}
          >
            {new Date(followUpAt).toLocaleString()}
          </span>
        );
      },
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
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            aria-label={`Delete ${row.original.formData.name}`}
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
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
        hideEdgePageButtons
        onRowClick={setSelectedSubmission}
        leftActions={
          <HairQuizFiltersPanel
            appliedFilters={appliedFilters}
            filterOptions={filterOptions}
            onApply={(filters) => {
              resetPagination();
              setAppliedFilters(filters);
            }}
          />
        }
        rightActions={
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={exporting || loading}
            onClick={() => void handleExportCsv()}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <HairQuizSubmissionSheet
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
        onUpdated={mergeSubmissionUpdate}
      />

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
