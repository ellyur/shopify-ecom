import { useOrders, useUpdateOrderStatus, useAdminOrder, useDeleteOrder } from "@/hooks/use-orders";
import { Loader2, Eye, Filter, X, Trash2, Check, Printer, Clock, ChevronDown, Calendar, Package, Truck, Search } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminPagination } from "@/components/admin-pagination";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format, isWithinInterval, startOfMonth, endOfMonth, subMonths, isSameDay } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { OrderItem } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { adminFetch } from "@/lib/adminFetch";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  downpayment: "bg-blue-100 text-blue-800",
  paid: "bg-cyan-100 text-cyan-800",
  processing: "bg-purple-100 text-purple-800",
  delivery: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const { data: orders, isLoading } = useOrders();
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("");
  const [filterMode, setFilterMode] = useState<"month" | "day">("month");
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"orders" | "delivery">("orders");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: orderDetails, isLoading: isLoadingDetails } = useAdminOrder(selectedOrderId || 0);

  const filteredOrders = orders?.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    let matchesDate = true;
    const orderDate = order.createdAt ? new Date(order.createdAt) : null;
    const scheduledDate = order.scheduledDate ? new Date(order.scheduledDate) : null;
    const pickupDate = order.orderType === 'pickup' && order.preferredDeliveryDate ? new Date(order.preferredDeliveryDate) : null;

    const targetDate = viewMode === "orders" ? orderDate : (order.orderType === 'pickup' ? pickupDate : scheduledDate);

    if (targetDate) {
      if (dayFilter) {
        const filterDate = new Date(dayFilter);
        matchesDate = isSameDay(targetDate, filterDate);
      } else if (dateFilter !== "all") {
        const filterMonth = parseInt(dateFilter);
        matchesDate = targetDate.getMonth() === filterMonth;
      }
    } else if (dayFilter || dateFilter !== "all") {
      matchesDate = false;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      order.orderNumber?.toLowerCase().includes(q) ||
      order.customerName?.toLowerCase().includes(q) ||
      order.customerPhone?.toLowerCase().includes(q);
    
    return matchesStatus && matchesDate && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil((filteredOrders?.length ?? 0) / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders?.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleDelete = () => {
    // Accept either "deleteOrder" as the deletion password
    if (deletePassword !== "deleteOrder") {
      toast({ variant: "destructive", title: "Incorrect deletion password. Use 'deleteOrder'" });
      return;
    }

    if (orderToDelete) {
      deleteOrder.mutate(orderToDelete, {
        onSuccess: () => {
          toast({ title: "Order deleted successfully" });
          setOrderToDelete(null);
          setDeletePassword("");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Delete failed", description: err.message });
        }
      });
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast({ title: "Order status updated" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Update failed", description: err.message });
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      <AdminSidebar logoutMutation={logoutMutation} />

      <main className="md:ml-72 flex-1 p-4 md:p-12 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">Orders</h1>
            <p className="text-muted-foreground text-sm">Monitor and process client requests</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-10 rounded-none text-sm"
                data-testid="input-orders-search"
              />
            </div>
            <div className="flex bg-muted p-1 rounded-none border border-border">
              <button
                onClick={() => setViewMode("orders")}
                className={cn(
                  "px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all",
                  viewMode === "orders" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Orders
              </button>
              <button
                onClick={() => setViewMode("delivery")}
                className={cn(
                  "px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all",
                  viewMode === "delivery" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Delivery
              </button>
            </div>

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
                  {dayFilter
                    ? `Day: ${dayFilter}`
                    : dateFilter !== "all"
                    ? "Month filter active"
                    : "Day: All Months"}
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
                  <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setDayFilter(""); }}>
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
                    onChange={(e) => { setDayFilter(e.target.value); setDateFilter("all"); }}
                    className="rounded-none h-9 text-sm"
                  />
                )}
                {(dayFilter || dateFilter !== "all") && (
                  <button
                    onClick={() => { setDayFilter(""); setDateFilter("all"); setFilterOpen(false); }}
                    className="w-full text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 pt-1"
                  >
                    <X className="h-3 w-3" /> Clear Filters
                  </button>
                )}
              </PopoverContent>
            </Popover>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(
                "w-full sm:w-40 rounded-none transition-all duration-200",
                statusFilter !== "all" ? "border-primary ring-1 ring-primary text-primary" : "border-border"
              )}>
                <Filter className={cn("h-4 w-4 mr-2 opacity-50 transition-colors", statusFilter !== "all" && "text-primary opacity-100")} />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-none shadow-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="downpayment">Downpayment Received</SelectItem>
                <SelectItem value="paid">Fully Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card rounded-none border-none shadow-sm overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-border/50">
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Order Identity</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Client Details</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Method</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Timestamp</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Placed Order/Pickup Date</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Value</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Lifecycle</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-widest py-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders?.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/10 transition-colors border-b-border/30">
                  <TableCell className="py-6">
                    <span className="font-serif text-lg tracking-tight">{order.orderNumber}</span>
                  </TableCell>
                  <TableCell className="py-6">
                    <div>
                      <p className="font-medium text-sm">{order.customerName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{order.customerPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <Badge variant="outline" className={cn(
                      "text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-none",
                      order.orderType === 'pickup' ? "border-amber-500 text-amber-600" : "border-blue-500 text-blue-600"
                    )}>
                      {order.orderType || 'delivery'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6">
                    <span className="text-xs text-muted-foreground">
                      {order.createdAt ? format(new Date(order.createdAt), "MMM d, h:mm a") : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="text-[10px] uppercase tracking-widest flex flex-col gap-2">
                      {order.orderType === 'pickup' ? (
                        <>
                          <div className="font-bold text-amber-600">{order.preferredDeliveryDate}</div>
                          <div className="text-muted-foreground">
                            {(() => {
                              try {
                                const [hours, minutes] = order.preferredDeliveryTime.split(':');
                                const date = new Date();
                                date.setHours(parseInt(hours), parseInt(minutes));
                                return format(date, "h:mm a");
                              } catch (e) {
                                return order.preferredDeliveryTime;
                              }
                            })()}
                          </div>
                        </>
                      ) : order.scheduledDate ? (
                        <>
                          <div className="font-bold text-primary">{format(new Date(order.scheduledDate), "MMM d, yyyy")}</div>
                          <div className="text-muted-foreground">{order.scheduledTime}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic lowercase font-light">Not scheduled yet</span>
                      )}
                      {order.orderType !== 'pickup' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-6 text-[8px] uppercase tracking-widest rounded-none">
                              {order.scheduledDate ? "Edit" : "Set Date"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md rounded-none">
                            <DialogHeader>
                              <DialogTitle className="font-serif">Set Schedule - {order.orderNumber}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground">Date</p>
                                <Input 
                                  id={`date-${order.id}`}
                                  type="date" 
                                  defaultValue={order.scheduledDate || ""} 
                                  className="h-8 text-xs rounded-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground">Time</p>
                                <Input 
                                  id={`time-${order.id}`}
                                  type="time" 
                                  defaultValue={order.scheduledTime || ""} 
                                  className="h-8 text-xs rounded-none"
                                />
                              </div>
                            </div>
                            <Button 
                              className="w-full rounded-none uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-70"
                              id={`save-btn-${order.id}`}
                              onClick={async (e) => {
                                const btn = e.currentTarget;
                                const originalText = btn.innerHTML;
                                btn.disabled = true;
                                btn.innerHTML = `<span class="flex items-center gap-2"><svg class="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</span>`;

                                const dateInput = document.getElementById(`date-${order.id}`) as HTMLInputElement;
                                const timeInput = document.getElementById(`time-${order.id}`) as HTMLInputElement;
                                const date = dateInput?.value || "";
                                const time = timeInput?.value || "";
                                
                                try {
                                  const res = await adminFetch(`/api/admin/orders/${order.id}/delivery`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      preferredDeliveryDate: order.preferredDeliveryDate || "",
                                      preferredDeliveryTime: order.preferredDeliveryTime || "",
                                      scheduledDate: date, 
                                      scheduledTime: time 
                                    })
                                  });
                                  
                                  if (!res.ok) {
                                    const errorData = await res.json().catch(() => ({}));
                                    throw new Error(errorData.message || "Failed to save");
                                  }
                                  
                                  await queryClient.invalidateQueries({ queryKey: [api.admin.orders.list.path] });
                                  toast({ title: "Schedule updated" });
                                  
                                  // Find and click the close button of the dialog
                                  const dialogContent = btn.closest('[role="dialog"]');
                                  const closeButton = dialogContent?.querySelector('button[type="button"]') as HTMLElement;
                                  if (closeButton) {
                                    closeButton.click();
                                  } else {
                                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                                  }
                                } catch (err: any) {
                                  console.error("Update error:", err);
                                  toast({ 
                                    variant: "destructive", 
                                    title: "Update failed", 
                                    description: err.message || "Please try again" 
                                  });
                                  btn.disabled = false;
                                  btn.innerHTML = originalText;
                                }
                              }}
                            >
                              Save Schedule
                            </Button>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <span className="font-medium">₱{Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </TableCell>
                  <TableCell className="py-6">
                    <Select defaultValue={order.status || "pending"} onValueChange={(v) => handleStatusChange(order.id, v)}>
                      <SelectTrigger className={`w-36 h-8 text-[8px] uppercase tracking-[0.2em] font-bold rounded-none border-none ${STATUS_COLORS[order.status || "pending"]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-none shadow-xl">
                        <SelectItem value="pending" className="text-[8px] uppercase tracking-[0.2em]">Pending</SelectItem>
                        <SelectItem value="downpayment" className="text-[8px] uppercase tracking-[0.2em]">Downpayment Received</SelectItem>
                        <SelectItem value="paid" className="text-[8px] uppercase tracking-[0.2em]">Fully Paid</SelectItem>
                        <SelectItem value="processing" className="text-[8px] uppercase tracking-[0.2em]">Processing</SelectItem>
                        <SelectItem value="delivery" className="text-[8px] uppercase tracking-[0.2em]">Delivery</SelectItem>
                        <SelectItem value="completed" className="text-[8px] uppercase tracking-[0.2em]">Completed</SelectItem>
                        <SelectItem value="cancelled" className="text-[8px] uppercase tracking-[0.2em]">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right py-6">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-primary/5 hover:text-primary rounded-none"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-destructive/5 hover:text-destructive rounded-none"
                        onClick={() => setOrderToDelete(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-muted-foreground italic font-light">
                    {orders?.length === 0 ? "The boutique hasn't received any orders yet." : "No orders found matching your criteria."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <AdminPagination
            currentPage={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredOrders?.length ?? 0}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </main>

      <Dialog open={selectedOrderId !== null} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-3xl rounded-none max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
            <DialogTitle className="font-serif text-2xl">Order Summary - {orderDetails?.orderNumber}</DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 rounded-none uppercase text-[10px] tracking-widest">
              <Printer className="h-4 w-4" /> Print Summary
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-primary/10">
            {isLoadingDetails ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orderDetails ? (
              <div id="printable-order" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
                      <Package className="h-3 w-3" /> Fulfillment Method
                    </h4>
                    <Badge variant="outline" className={cn(
                      "text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-none",
                      orderDetails.orderType === 'pickup' ? "border-amber-500 text-amber-600 bg-amber-50" : "border-blue-500 text-blue-600 bg-blue-50"
                    )}>
                      {orderDetails.orderType === 'pickup' ? 'Store Pickup' : 'Delivery Service'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3 font-bold">Customer Information</h4>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{orderDetails.customerName}</p>
                      <p className="text-sm text-muted-foreground">{orderDetails.customerPhone}</p>
                      <p className="text-sm text-muted-foreground">{orderDetails.customerEmail || "No email provided"}</p>
                      {orderDetails.customerFbProfile && (
                        <p className="text-sm text-primary underline truncate block mt-1">
                          {orderDetails.customerFbProfile}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
                      {orderDetails.orderType === 'pickup' ? <Package className="h-3 w-3" /> : <Clock className="h-3 w-3" />} 
                      {orderDetails.orderType === 'pickup' ? 'Pickup Schedule' : 'Delivery Schedule'}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Client Requested</p>
                        <p className="text-sm font-medium">
                          {orderDetails.preferredDeliveryDate} at {(() => {
                            try {
                              const [hours, minutes] = orderDetails.preferredDeliveryTime.split(':');
                              const date = new Date();
                              date.setHours(parseInt(hours), parseInt(minutes));
                              return format(date, "h:mm a");
                            } catch (e) {
                              return orderDetails.preferredDeliveryTime;
                            }
                          })()}
                        </p>
                      </div>
                      
                      {orderDetails.scheduledDate && (
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2">
                            Official {orderDetails.orderType === 'pickup' ? 'Pickup' : 'Delivery'} Schedule
                          </h4>
                          <div className="grid grid-cols-2 gap-4 bg-primary/5 p-3 border border-primary/10">
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase text-primary/60">Date</p>
                              <p className="text-sm font-bold">{format(new Date(orderDetails.scheduledDate), "MMM d, yyyy")}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase text-primary/60">Time</p>
                              <p className="text-sm font-bold">
                                {(() => {
                                  try {
                                    const timeStr = orderDetails.scheduledTime || "";
                                    if (!timeStr) return "—";
                                    const [hours, minutes] = timeStr.split(':');
                                    const date = new Date();
                                    date.setHours(parseInt(hours), parseInt(minutes));
                                    return format(date, "h:mm a");
                                  } catch (e) {
                                    return orderDetails.scheduledTime || "—";
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {orderDetails.orderType !== 'pickup' && (
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
                        <Truck className="h-3 w-3" /> Delivery Address
                      </h4>
                      <p className="text-sm leading-relaxed">
                        {orderDetails.deliveryAddress}<br />
                        {orderDetails.city}{orderDetails.postalCode ? `, ${orderDetails.postalCode}` : ""}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Payment & Status</h4>
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Method</p>
                        <p className="text-sm uppercase">{orderDetails.paymentMethod}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</p>
                        <span className={`px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold ${STATUS_COLORS[orderDetails.status || "pending"]}`}>
                          {orderDetails.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {orderDetails.specialInstructions && (
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Special Instructions</h4>
                      <p className="text-sm italic text-muted-foreground">"{orderDetails.specialInstructions}"</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Order Items</h4>
                  <div className="space-y-4">
                    {orderDetails.items?.map((item: OrderItem) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="h-16 w-16 bg-muted shrink-0">
                          {item.productImage && (
                            <img 
                              src={item.productImage} 
                              alt={item.productName} 
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                            QTY: {item.quantity} • ₱{Number(item.productPrice).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">₱{Number(item.subtotal).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₱{Number(orderDetails.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>₱{Number(orderDetails.deliveryFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-serif text-xl font-bold pt-2">
                      <span>Total</span>
                      <span>₱{Number(orderDetails.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={orderToDelete !== null} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Enter Deletion Password
              </label>
              <Input 
                type="password" 
                value={deletePassword} 
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password to delete"
                className="rounded-none border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOrderToDelete(null)} className="rounded-none">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              className="rounded-none"
            >
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
