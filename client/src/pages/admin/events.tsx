import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminFetch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAdminProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Loader2, Calendar, ChevronRight, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import type { EventWithProducts } from "@shared/schema";

type EventFormData = {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
};

function EventFormDialog({
  event,
  onSave,
  isPending,
  trigger,
}: {
  event?: EventWithProducts;
  onSave: (data: EventFormData, close: () => void) => void;
  isPending: boolean;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});
  const [form, setForm] = useState<EventFormData>({
    name: event?.name ?? "",
    startDate: event?.startDate ?? "",
    endDate: event?.endDate ?? "",
    description: event?.description ?? "",
    isActive: event?.isActive ?? true,
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setErrors({});
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) newErrors.name = "Event name is required";
    if (!form.startDate) newErrors.startDate = "Start date is required";
    if (!form.endDate) newErrors.endDate = "End date is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSave(form, () => setOpen(false));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{event ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground block mb-1">Event Name</label>
            <Input
              placeholder="e.g. Mother's Day"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: undefined })); }}
              data-testid="input-event-name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground block mb-1">Start Date</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={e => { setForm(f => ({ ...f, startDate: e.target.value })); setErrors(er => ({ ...er, startDate: undefined })); }}
                data-testid="input-event-start"
                className={errors.startDate ? "border-destructive" : ""}
              />
              {errors.startDate && <p className="text-xs text-destructive mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground block mb-1">End Date</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={e => { setForm(f => ({ ...f, endDate: e.target.value })); setErrors(er => ({ ...er, endDate: undefined })); }}
                data-testid="input-event-end"
                className={errors.endDate ? "border-destructive" : ""}
              />
              {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground block mb-1">Description (optional)</label>
            <Input
              placeholder="Brief description shown to customers"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              data-testid="input-event-description"
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium">Active</span>
            <Switch
              checked={form.isActive}
              onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              data-testid="switch-event-active"
            />
          </div>
          <Button onClick={handleSave} disabled={isPending} className="w-full" data-testid="button-save-event">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductPricingPanel({ event }: { event: EventWithProducts }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: allProducts = [] } = useAdminProducts();
  const [newProductId, setNewProductId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState("");

  const upsertMutation = useMutation({
    mutationFn: async ({ productId, eventPrice }: { productId: number; eventPrice: string }) => {
      const res = await adminFetch(`/api/admin/events/${event.id}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, eventPrice }),
      });
      if (!res.ok) throw new Error("Failed to set price");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setNewProductId(null);
      setNewPrice("");
      toast({ title: "Product price set" });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to set price" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await adminFetch(`/api/admin/events/${event.id}/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({ title: "Product removed from event" });
    },
  });

  const existingProductIds = new Set(event.products.map(p => p.productId));
  const availableProducts = allProducts.filter(p => !existingProductIds.has(p.id));

  const handleAddProduct = () => {
    if (!newProductId || !newPrice) return;
    upsertMutation.mutate({ productId: newProductId, eventPrice: newPrice });
  };

  const getProductName = (productId: number) => allProducts.find(p => p.id === productId)?.name ?? `Product #${productId}`;
  const getRegularPrice = (productId: number) => allProducts.find(p => p.id === productId)?.price ?? "0";

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Product Prices for this Event</p>

      {event.products.length > 0 ? (
        <div className="space-y-2">
          {event.products.map(ep => (
            <div key={ep.productId} className="flex items-center justify-between p-3 bg-white border border-border rounded-lg text-sm" data-testid={`event-product-${ep.productId}`}>
              <div>
                <p className="font-medium">{getProductName(ep.productId)}</p>
                <p className="text-xs text-muted-foreground">
                  Regular: ₱{Number(getRegularPrice(ep.productId)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <span className="mx-1">→</span>
                  <span className="text-primary font-semibold">Event: ₱{Number(ep.eventPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-7 w-7"
                onClick={() => deleteMutation.mutate(ep.productId)}
                data-testid={`button-remove-event-product-${ep.productId}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No product prices set yet. All products will use their regular price.</p>
      )}

      {availableProducts.length > 0 && (
        <div className="flex gap-2 items-end pt-1">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">Add Product</label>
            <select
              value={newProductId ?? ""}
              onChange={e => setNewProductId(Number(e.target.value) || null)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="select-event-product"
            >
              <option value="">Select product...</option>
              {availableProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} (₱{Number(p.price).toLocaleString()})</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="text-xs text-muted-foreground block mb-1">Event Price</label>
            <Input
              type="number"
              placeholder="₱0.00"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              data-testid="input-event-product-price"
            />
          </div>
          <Button
            onClick={handleAddProduct}
            disabled={!newProductId || !newPrice || upsertMutation.isPending}
            size="sm"
            className="mb-0.5"
            data-testid="button-add-event-product"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminEvents() {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: events = [], isLoading } = useQuery<EventWithProducts[]>({
    queryKey: ["/api/admin/events"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const res = await adminFetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({ title: "Event created" });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to create event" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EventFormData }) => {
      const res = await adminFetch(`/api/admin/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({ title: "Event updated" });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to update event" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({ title: "Event deleted" });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to delete event" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await adminFetch(`/api/admin/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] }),
  });

  const formatDate = (d: string) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[Number(m)-1]} ${Number(day)}, ${y}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <AdminSidebar logoutMutation={logoutMutation} />

        <main className="md:ml-72 flex-1 min-h-screen p-6 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl">Event Pricing</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Set special prices for holidays and events</p>
              </div>
            </div>
            <EventFormDialog
              onSave={(data, close) => createMutation.mutate(data, { onSuccess: close })}
              isPending={createMutation.isPending}
              trigger={
                <Button data-testid="button-create-event">
                  <Plus className="h-4 w-4 mr-2" /> New Event
                </Button>
              }
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No events yet</p>
              <p className="text-sm mt-1">Create your first event to set special pricing for holidays.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => {
                const isExpanded = expandedId === event.id;
                return (
                  <div
                    key={event.id}
                    className="bg-white border border-border rounded-xl overflow-hidden shadow-sm"
                    data-testid={`event-card-${event.id}`}
                  >
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : event.id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{event.name}</p>
                              <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${event.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                                {event.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(event.startDate)} — {formatDate(event.endDate)}
                              {event.products.length > 0 && (
                                <span className="ml-2 text-primary font-medium">· {event.products.length} product{event.products.length > 1 ? "s" : ""} with event price</span>
                              )}
                            </p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.description}</p>
                            )}
                          </div>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <Switch
                          checked={event.isActive ?? false}
                          onCheckedChange={v => toggleActiveMutation.mutate({ id: event.id, isActive: v })}
                          data-testid={`switch-event-active-${event.id}`}
                        />
                        <EventFormDialog
                          event={event}
                          onSave={(data, close) => updateMutation.mutate({ id: event.id, data }, { onSuccess: close })}
                          isPending={updateMutation.isPending}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-edit-event-${event.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(event.id)}
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border px-5 pb-5 bg-secondary/30">
                        <ProductPricingPanel event={event} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

    </div>
  );
}
