"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  AffiliateSubmissionSheet,
  formatAffiliateValue,
  type AffiliateSubmission,
} from "./submission-sheet";

export default function AffiliateApplicationsPage() {
  const [submissions, setSubmissions] = useState<AffiliateSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<AffiliateSubmission | null>(null);

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
      cell: ({ row }) => (
        <div className="truncate font-medium">{row.original.formData.name}</div>
      ),
    },
    {
      id: "contactPreference",
      accessorFn: (row) => row.formData.contactPreference,
      header: "Prefers",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {formatAffiliateValue(row.original.formData.contactPreference)}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
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
        hideEdgePageButtons
        onRowClick={setSelectedSubmission}
      />

      <AffiliateSubmissionSheet
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      />
    </>
  );
}
