import { useAdminDashboard as useDashboardHook, useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight, X, Download, ChevronDown, Calendar, ShoppingCart, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminPagination } from "@/components/admin-pagination";
import { AdminCharts } from "@/components/admin-charts";
import { isSameDay } from "date-fns";

export default function AdminDashboard() {
  const [dateFilter, setDateFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("");
  const [filterMode, setFilterMode] = useState<"month" | "day">("month");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);

  const { data: stats, isLoading } = useDashboardHook({ 
    month: dayFilter ? undefined : dateFilter,
    date: dayFilter || undefined
  });
  const { data: allOrders, isLoading: isLoadingOrders } = useOrders();
  const { logoutMutation } = useAuth();

  // Filter + search client activity from all orders
  const filteredActivity = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter(order => {
      let matchesDate = true;
      if (dayFilter) {
        const od = order.createdAt ? new Date(order.createdAt) : null;
        matchesDate = od ? isSameDay(od, new Date(dayFilter)) : false;
      } else if (dateFilter !== "all") {
        const od = order.createdAt ? new Date(order.createdAt) : null;
        matchesDate = od ? od.getMonth() === parseInt(dateFilter) : false;
      }
      const q = activitySearch.toLowerCase().trim();
      const matchesSearch = !q ||
        order.customerName?.toLowerCase().includes(q) ||
        order.orderNumber?.toLowerCase().includes(q) ||
        order.customerPhone?.toLowerCase().includes(q);
      return matchesDate && matchesSearch;
    }).sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }, [allOrders, dayFilter, dateFilter, activitySearch]);

  const activityTotalPages = Math.max(1, Math.ceil(filteredActivity.length / activityPageSize));
  const activitySafePage = Math.min(activityPage, activityTotalPages);
  const paginatedActivity = filteredActivity.slice(
    (activitySafePage - 1) * activityPageSize,
    activitySafePage * activityPageSize
  );

  const handleExport = () => {
    if (!stats) return;
    const reportData = [
      ["Boutique Insights Report"],
      ["Generated At", new Date().toLocaleString()],
      ["Filter", dayFilter ? `Day: ${dayFilter}` : `Month: ${dateFilter}`],
      [],
      ["Summary Statistics"],
      ["Total Revenue", `₱${stats.totalRevenueMonth.toLocaleString()}`],
      ["Total Orders", stats.totalOrdersToday],
      ["Pending Orders", stats.pendingOrders],
      ["Total Products", stats.totalProducts],
      [],
      ["Recent Orders"],
      ["Order Number", "Customer", "Amount", "Status", "Date"],
      ...stats.recentOrders.map(o => [
        o.orderNumber,
        o.customerName,
        `₱${Number(o.totalAmount).toLocaleString()}`,
        o.status,
        o.createdAt ? new Date(o.createdAt).toLocaleString() : "N/A"
      ])
    ];
    const csvContent = reportData.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `boutique-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-600",
    downpayment: "bg-blue-50 text-blue-700",
    paid: "bg-cyan-50 text-cyan-700",
    processing: "bg-purple-50 text-purple-700",
    delivery: "bg-orange-50 text-orange-700",
    completed: "bg-primary/10 text-primary",
    cancelled: "bg-red-50 text-red-700",
  };

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex flex-col md:flex-row">
      <AdminSidebar logoutMutation={logoutMutation} />

      <main className="md:ml-72 flex-1 p-4 md:p-12 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 md:mb-12 gap-6">
          <div>
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-accent font-bold mb-2 block">System Analytics</span>
            <h1 className="text-3xl md:text-5xl font-serif leading-tight">Boutique Insights</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "rounded-none h-10 px-4 gap-2 text-[10px] uppercase tracking-widest font-bold transition-all",
                    (dayFilter || dateFilter !== "all") ? "border-primary ring-1 ring-primary text-primary" : "border-border"
                  )}
                >
                  <Calendar className={cn("h-4 w-4", (dayFilter || dateFilter !== "all") ? "text-primary" : "opacity-50")} />
                  {dayFilter ? `Day: ${dayFilter}` : dateFilter !== "all" ? `Month filter active` : "Day: All Dates"}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 rounded-none border-border shadow-xl p-4 space-y-4" align="end">
                <div className="flex bg-muted p-1 rounded-none border border-border gap-1">
                  <button
                    onClick={() => { setFilterMode("month"); setDayFilter(""); }}
                    className={cn("flex-1 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all", filterMode === "month" ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
                  >Month</button>
                  <button
                    onClick={() => { setFilterMode("day"); setDateFilter("all"); }}
                    className={cn("flex-1 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all", filterMode === "day" ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
                  >Day</button>
                </div>
                {filterMode === "month" ? (
                  <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setDayFilter(""); setActivityPage(1); }}>
                    <SelectTrigger className="rounded-none w-full">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-none shadow-xl">
                      <SelectItem value="all">All Months</SelectItem>
                      <SelectItem value="0">January</SelectItem>
                      <SelectItem value="1">February</SelectItem>
                      <SelectItem value="2">March</SelectItem>
                      <SelectItem value="3">April</SelectItem>
                      <SelectItem value="4">May</SelectItem>
                      <SelectItem value="5">June</SelectItem>
                      <SelectItem value="6">July</SelectItem>
                      <SelectItem value="7">August</SelectItem>
                      <SelectItem value="8">September</SelectItem>
                      <SelectItem value="9">October</SelectItem>
                      <SelectItem value="10">November</SelectItem>
                      <SelectItem value="11">December</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="date"
                    value={dayFilter}
                    onChange={(e) => { setDayFilter(e.target.value); setDateFilter("all"); setActivityPage(1); }}
                    className="rounded-none h-9 text-sm"
                  />
                )}
                {(dayFilter || dateFilter !== "all") && (
                  <button
                    onClick={() => { setDayFilter(""); setDateFilter("all"); setFilterOpen(false); setActivityPage(1); }}
                    className="w-full text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1 pt-1"
                  >
                    <X className="h-3 w-3" /> Clear Filter
                  </button>
                )}
              </PopoverContent>
            </Popover>

            <Button 
              variant="outline" 
              onClick={handleExport}
              className="w-full sm:w-auto rounded-none uppercase tracking-widest text-[10px] font-bold h-10 px-6"
            >
              <Download className="h-3 w-3 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
        
        {/* Stat Cards */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-16"
        >
          {[
            { label: "Revenue", value: stats ? `₱${stats.totalRevenueMonth.toLocaleString()}` : null, icon: DollarSign, sub: "Period revenue insights", color: "bg-primary/5", iconColor: "text-accent" },
            { label: "Orders", value: stats ? stats.totalOrdersToday : null, icon: Activity, sub: "Activity for selected period", color: "bg-accent/5", iconColor: "text-primary" },
            { label: "Pending Orders", value: stats ? stats.pendingOrders : null, icon: ShoppingCart, sub: "Awaiting fulfillment", color: "bg-yellow-500/5", iconColor: "text-yellow-600" },
            { label: "Total Products", value: stats ? stats.totalProducts : null, icon: Package, sub: "Active inventory", color: "bg-blue-500/5", iconColor: "text-blue-600" },
          ].map((stat, i) => (
            <motion.div variants={item} key={i}>
              <Card className="border-none shadow-sm rounded-none group hover:shadow-md transition-all duration-500 overflow-hidden relative">
                <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700", stat.color)} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-10 w-24 mb-1" />
                  ) : (
                    <div className="text-3xl font-serif font-medium mb-1">{stat.value}</div>
                  )}
                  <div className={cn("flex items-center text-[10px] font-bold", stat.iconColor)}>
                    {stat.label === "Revenue" && <TrendingUp className="h-3 w-3 mr-1" />}
                    <span>{stat.sub}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Client Activity + Inventory Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-12">
          {/* Client Activity */}
          <Card className="xl:col-span-2 border-none shadow-sm rounded-none bg-white overflow-hidden">
            <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-4">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-2xl">Client Activity</CardTitle>
                <Link href="/admin/orders">
                  <Button variant="ghost" className="text-[10px] uppercase tracking-widest font-bold hover:bg-secondary rounded-none group">
                    View All <ArrowUpRight className="h-3 w-3 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name, order #, phone..."
                  value={activitySearch}
                  onChange={(e) => { setActivitySearch(e.target.value); setActivityPage(1); }}
                  className="pl-9 h-9 rounded-none text-sm"
                  data-testid="input-activity-search"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingOrders ? (
                <div className="p-6 space-y-5">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-4 w-24 ml-auto" />
                        <Skeleton className="h-3 w-16 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border/30">
                    {paginatedActivity.map((order) => (
                      <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {order.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">{order.customerName}</p>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{order.orderNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">₱{Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          <span className={cn(
                            "text-[8px] uppercase tracking-[0.2em] font-bold px-2 py-0.5",
                            STATUS_COLORS[order.status || "pending"] || "bg-muted text-muted-foreground"
                          )}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {paginatedActivity.length === 0 && (
                      <p className="text-muted-foreground italic font-light text-sm text-center py-12 px-6">
                        {activitySearch ? "No orders match your search." : "No activity for the selected period."}
                      </p>
                    )}
                  </div>
                  <AdminPagination
                    currentPage={activitySafePage}
                    totalPages={activityTotalPages}
                    pageSize={activityPageSize}
                    totalItems={filteredActivity.length}
                    onPageChange={setActivityPage}
                    onPageSizeChange={(s) => { setActivityPageSize(s); setActivityPage(1); }}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="col-span-1 border-none shadow-sm rounded-none bg-white">
            <CardHeader className="border-b border-border/50 pb-6 mb-6">
              <CardTitle className="font-serif text-2xl text-destructive/80">
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-1 w-full" />
                    </div>
                  ))
                ) : (
                  <>
                    {stats?.lowStockProducts.map((product) => (
                      <div key={product.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{product.name}</p>
                          <span className="text-destructive font-bold text-xs uppercase tracking-widest">{product.stock} Units</span>
                        </div>
                        <div className="w-full h-1 bg-secondary overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(product.stock / 20) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-destructive/60"
                          />
                        </div>
                      </div>
                    ))}
                    {stats?.lowStockProducts && stats.lowStockProducts.length === 0 && (
                      <p className="text-muted-foreground italic font-light text-sm text-center py-8">All inventory levels optimal.</p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <AdminCharts />
      </main>
    </div>
  );
}
