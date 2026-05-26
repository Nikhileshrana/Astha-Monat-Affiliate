"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { ROUTES_CONFIG } from "@/lib/routes";

// Keep only groups that contain protected routes to assign
const groupedRoutes = ROUTES_CONFIG.map((group) => ({
  ...group,
  items: group.items.filter(item => item.requiresAccess)
})).filter(group => group.items.length > 0);

export default function AccessManagementPage() {
  const [email, setEmail] = useState("");
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [usersAccess, setUsersAccess] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [routeSearch, setRouteSearch] = useState("");

  const filteredGroups = groupedRoutes.map(group => {
    const s = routeSearch.toLowerCase();
    const matchesGroup = group.title.toLowerCase().includes(s);
    const visibleItems = group.items.filter(item =>
      matchesGroup ||
      item.title.toLowerCase().includes(s) ||
      item.url.toLowerCase().includes(s)
    );
    return { ...group, items: visibleItems };
  }).filter(group => group.items.length > 0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    fetchAccessData(pagination.pageIndex, pagination.pageSize, debouncedSearch);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const fetchAccessData = async (pageIdx = 0, limit = 10, search = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/access-management?page=${pageIdx + 1}&limit=${limit}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setUsersAccess(data.users || []);
        setTotalItems(data.total || 0);
        setPageCount(data.pageCount || 0);
      } else {
        toast.error(data.error || "Failed to fetch user access data");
      }
    } catch (e: any) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRoute = (route: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(route) ? prev.filter(r => r !== route) : [...prev, route]
    );
  };

  const handleGrantAccess = async () => {
    if (!email) {
      toast.error("Please provide an email.");
      return;
    }

    if (selectedRoutes.length === 0) {
      toast.warning("No routes selected. You can revoke their entire access using Wipe Identity.");
    }

    try {
      setLoading(true);
      const res = await fetch("/api/access-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, routes: selectedRoutes })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setEmail("");
        setSelectedRoutes([]);
        setIsSheetOpen(false);
        fetchAccessData(pagination.pageIndex, pagination.pageSize, debouncedSearch); // refresh the table
      } else {
        toast.error(data.error);
      }
    } catch (e: any) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAll = async (targetEmail: string) => {
    if (!window.confirm("Are you sure you want to revoke all access for this user at once?")) return;

    try {
      setLoading(true);
      const res = await fetch("/api/access-management", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchAccessData(pagination.pageIndex, pagination.pageSize, debouncedSearch); // refresh the table
      } else {
        toast.error(data.error);
      }
    } catch (e: any) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEmail(user.email);
    setSelectedRoutes(user.routes || []);
    setIsEditing(true);
    setIsSheetOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-transparent"
          >
            Email Address
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("email")}</div>,
    },
    {
      id: "moduleCount",
      header: "Module Count",
      cell: ({ row }) => <div>{row.original.routes?.length || 0} Routes Allowed</div>,
    },
    {
      accessorKey: "updatedAt",
      header: () => <div className="hidden md:block">Last Active Assignment</div>,
      cell: ({ row }) => {
        const date = row.getValue("updatedAt");
        return (
          <div className="hidden md:block text-sm text-muted-foreground">
            {date ? new Date(date as string).toLocaleDateString() : "Presently Unknown"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action Vectors</div>,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-right flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
              Edit Config
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleRevokeAll(user.email)}>
              Wipe Identity
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:max-w-md flex flex-col h-full overflow-hidden">
          <SheetHeader className="border-b">
            <SheetTitle>{isEditing ? "Edit User Access" : "Grant New Access"}</SheetTitle>
            <SheetDescription>
              Assign the available protected modules securely to any specific user via their verified Next.js email.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">User Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="administrator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEditing}
              />
            </div>

            <div className="space-y-3 flex flex-col h-full">
              <Label className="font-medium">Assign Authorizations ({selectedRoutes.length} selected)</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search routes..."
                  className="pl-8"
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                />
              </div>
              <div className="flex-1 mt-2 border rounded-md bg-muted/20 overflow-hidden flex flex-col min-h-[300px]">
                {filteredGroups.length === 0 ? (
                  <div className="p-4 text-sm text-center text-muted-foreground">No matching routes found.</div>
                ) : (
                  <ScrollArea className="flex-1 h-[300px]">
                    <div className="p-2 px-4">
                      <Accordion type="multiple" defaultValue={filteredGroups.map(g => g.title)} className="w-full">
                        {filteredGroups.map((group) => {
                          const Icon = group.icon as React.ElementType;
                          return (
                            <AccordionItem key={group.title} value={group.title} className="border-b-0">
                              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                                <div className="flex items-center gap-2">
                                  {Icon && <Icon className="h-4 w-4" />}
                                  {group.title}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pt-1 pb-3 pl-4 border-l-2 ml-2 border-muted">
                                  {group.items.map((item) => (
                                    <div key={item.url} className="flex flex-row items-start space-x-3">
                                      <Checkbox
                                        id={`chk-${item.url}`}
                                        checked={selectedRoutes.includes(item.url)}
                                        onCheckedChange={() => handleToggleRoute(item.url)}
                                        className="mt-1"
                                      />
                                      <Label htmlFor={`chk-${item.url}`} className="font-normal cursor-pointer text-sm leading-snug">
                                        {item.title}
                                        <span className="block text-xs text-muted-foreground mt-0.5">{item.url}</span>
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 border-t mt-auto bg-background/80 backdrop-blur-sm">
            <Button disabled={loading || !email} onClick={handleGrantAccess} className="w-full">
              {isEditing ? "Save Adjustments" : "Grant Access"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <DataTable
        columns={columns}
        data={usersAccess}
        searchKey="email"
        searchPlaceholder="Search users by email..."
        loading={loading}
        manualPagination={true}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        manualFiltering={true}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        totalItems={totalItems}
        leftActions={
          <Button onClick={() => { setEmail(''); setSelectedRoutes([]); setIsEditing(false); setIsSheetOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Access
          </Button>
        }
      />
    </>
  );
}
