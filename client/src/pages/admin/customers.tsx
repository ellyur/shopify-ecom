import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, Users, Mail, Phone, ShoppingBag, TrendingUp, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/adminFetch";
import type { Customer } from "@shared/schema";

export default function AdminCustomers() {
  const { logoutMutation } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const backfillMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("/api/customers/backfill", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Sync complete", description: `${data.inserted ?? 0} customers synced from orders.` });
    },
    onError: () => {
      toast({ title: "Sync failed", description: "Could not sync customers.", variant: "destructive" });
    },
  });

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", search],
    queryFn: async () => {
      const url = search
        ? `/api/customers?search=${encodeURIComponent(search)}`
        : "/api/customers";
      const res = await adminFetch(url);
      if (!res.ok) throw new Error("Failed to load customers");
      return res.json();
    },
  });

  const allSelected = customers.length > 0 && selected.size === customers.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(customers.map(c => c.id)));
  }

  function toggleOne(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportCsv() {
    const ids = selected.size > 0 ? [...selected].join(",") : "";
    const url = ids ? `/api/customers/export?ids=${ids}` : "/api/customers/export";
    window.location.href = url;
  }

  const totalSpentAll = useMemo(
    () => customers.reduce((sum, c) => sum + Number(c.totalSpent), 0),
    [customers]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <AdminSidebar logoutMutation={logoutMutation} />

      <main className="md:ml-72 flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-serif tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Deduplicated by email — updated automatically with every order. Use "Sync from Orders" to import existing orders.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Customers</p>
                <p className="text-xl font-bold font-serif">{isLoading ? "—" : customers.length.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold font-serif">
                  {isLoading ? "—" : `₱${totalSpentAll.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4 flex items-center gap-3 col-span-2 md:col-span-1">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Orders / Customer</p>
                <p className="text-xl font-bold font-serif">
                  {isLoading || customers.length === 0
                    ? "—"
                    : (customers.reduce((s, c) => s + c.totalOrders, 0) / customers.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-customer-search"
              />
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {selected.size} selected
                </Badge>
              )}
              <Button
                onClick={() => backfillMutation.mutate()}
                disabled={backfillMutation.isPending}
                size="sm"
                variant="outline"
                className="gap-2"
                data-testid="button-sync-customers"
              >
                <RefreshCw className={`h-4 w-4 ${backfillMutation.isPending ? "animate-spin" : ""}`} />
                Sync from Orders
              </Button>
              <Button
                onClick={exportCsv}
                size="sm"
                className="gap-2"
                data-testid="button-export-csv"
              >
                <Download className="h-4 w-4" />
                {selected.size > 0 ? `Export ${selected.size}` : "Export All"} as CSV
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        data-testid="checkbox-select-all"
                        aria-label="Select all customers"
                        className={someSelected ? "opacity-70" : ""}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Orders
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Total Spent
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                      Last Order
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-28" />
                              <Skeleton className="h-3 w-36" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-8 mx-auto rounded-full" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No customers yet</p>
                        <p className="text-xs mt-1 max-w-xs mx-auto">
                          Customers are added automatically when orders are placed with an email address.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    customers.map(customer => (
                      <tr
                        key={customer.id}
                        className={`hover:bg-muted/20 transition-colors ${selected.has(customer.id) ? "bg-primary/5" : ""}`}
                        data-testid={`row-customer-${customer.id}`}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selected.has(customer.id)}
                            onCheckedChange={() => toggleOne(customer.id)}
                            data-testid={`checkbox-customer-${customer.id}`}
                            aria-label={`Select ${customer.name}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{customer.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3 shrink-0" />
                                {customer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                          {customer.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />{customer.phone}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className="text-xs font-semibold">
                            {customer.totalOrders}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          ₱{Number(customer.totalSpent).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden lg:table-cell">
                          {customer.lastOrderDate
                            ? new Date(customer.lastOrderDate).toLocaleDateString("en-PH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && customers.length > 0 && (
              <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  {customers.length} customer{customers.length !== 1 ? "s" : ""} total
                </span>
                {selected.size > 0 && (
                  <button
                    onClick={() => setSelected(new Set())}
                    className="underline hover:text-foreground transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
