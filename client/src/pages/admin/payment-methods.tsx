import { useAdminPaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from "@/hooks/use-products";
import { convertToWebP } from "@/lib/imageUtils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState, type ChangeEvent } from "react";
import { Loader2, CreditCard, Plus, Pencil, Trash2, Upload, X, Eye, EyeOff } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaymentMethod } from "@shared/schema";

const EMPTY_FORM = {
  label: "",
  type: "online" as "online" | "cod",
  logoUrl: "",
  qrUrl: "",
  instructions: "",
  isActive: true,
  displayOrder: 0,
};

export default function AdminPaymentMethods() {
  const { data: methods = [], isLoading } = useAdminPaymentMethods();
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const { logoutMutation } = useAuth();
  const { toast } = useToast();

  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoUploading, setLogoUploading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (m: PaymentMethod) => {
    setEditing(m);
    setForm({
      label: m.label,
      type: (m.type as "online" | "cod"),
      logoUrl: m.logoUrl || "",
      qrUrl: m.qrUrl || "",
      instructions: m.instructions || "",
      isActive: m.isActive ?? true,
      displayOrder: m.displayOrder ?? 0,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, field: "logoUrl" | "qrUrl") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const setter = field === "logoUrl" ? setLogoUploading : setQrUploading;
    setter(true);
    try {
      const dataUrl = await convertToWebP(file);
      setForm(f => ({ ...f, [field]: dataUrl }));
      toast({ title: "Image ready", description: "Converted and compressed to WebP." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setter(false);
    }
  };

  const handleSubmit = () => {
    if (!form.label.trim()) {
      toast({ variant: "destructive", title: "Label is required" });
      return;
    }
    const payload = {
      label: form.label.trim(),
      type: form.type,
      logoUrl: form.logoUrl || null,
      qrUrl: form.qrUrl || null,
      instructions: form.instructions || null,
      isActive: form.isActive,
      displayOrder: Number(form.displayOrder) || 0,
    };

    if (editing) {
      updateMethod.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => { toast({ title: "Payment method updated" }); cancelForm(); },
        onError: (err: any) => toast({ variant: "destructive", title: "Update failed", description: err.message }),
      });
    } else {
      createMethod.mutate(payload as any, {
        onSuccess: () => { toast({ title: "Payment method created" }); cancelForm(); },
        onError: (err: any) => toast({ variant: "destructive", title: "Create failed", description: err.message }),
      });
    }
  };

  const handleToggleActive = (m: PaymentMethod) => {
    updateMethod.mutate({ id: m.id, isActive: !m.isActive }, {
      onSuccess: () => toast({ title: `${m.label} ${!m.isActive ? "enabled" : "disabled"}` }),
      onError: () => toast({ variant: "destructive", title: "Failed to toggle" }),
    });
  };

  const handleDelete = (m: PaymentMethod) => {
    if (!confirm(`Delete "${m.label}"? This cannot be undone.`)) return;
    deleteMethod.mutate(m.id, {
      onSuccess: () => toast({ title: "Deleted" }),
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };


  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <AdminSidebar logoutMutation={logoutMutation} />

      {/* Main content */}
      <main className="md:ml-72 flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-serif">Payment Methods</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage which payment methods appear at checkout</p>
            </div>
            {!showForm && (
              <Button onClick={startCreate} className="gap-2" data-testid="button-add-payment-method">
                <Plus className="h-4 w-4" /> Add Method
              </Button>
            )}
          </div>

          {/* Inline Form */}
          {showForm && (
            <div className="mb-8 border border-border/70 rounded-xl p-6 bg-secondary/30 space-y-5">
              <h2 className="text-base font-semibold">{editing ? "Edit Payment Method" : "New Payment Method"}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Label *</label>
                  <Input
                    placeholder="e.g. GCash, Maya, BPI"
                    value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    data-testid="input-payment-label"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Type</label>
                  <Select value={form.type} onValueChange={(v: "online" | "cod") => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger data-testid="select-payment-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online / Digital</SelectItem>
                      <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Logo Image (WebP, max 500KB)</label>
                <div className="flex items-center gap-4">
                  {form.logoUrl && (
                    <div className="relative h-14 w-24 rounded-lg border border-border/50 bg-white overflow-hidden flex items-center justify-center p-1">
                      <img src={form.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" data-testid="img-payment-logo-preview" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, logoUrl: "" }))}
                        className="absolute top-0.5 right-0.5 bg-white/80 rounded-full p-0.5 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer border border-border/50 rounded-lg h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted/30 transition-colors" data-testid="button-upload-logo">
                    {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {logoUploading ? "Processing..." : "Upload Logo"}
                    <input type="file" accept="image/webp" className="hidden" onChange={e => handleImageUpload(e, "logoUrl")} data-testid="input-logo-upload" />
                  </label>
                </div>
              </div>

              {/* QR Code Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">QR Code Image (WebP, max 500KB) — optional</label>
                <div className="flex items-center gap-4">
                  {form.qrUrl && (
                    <div className="relative h-20 w-20 rounded-lg border border-border/50 bg-white overflow-hidden flex items-center justify-center p-1">
                      <img src={form.qrUrl} alt="QR Code" className="max-h-full max-w-full object-contain" data-testid="img-payment-qr-preview" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, qrUrl: "" }))}
                        className="absolute top-0.5 right-0.5 bg-white/80 rounded-full p-0.5 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer border border-border/50 rounded-lg h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted/30 transition-colors" data-testid="button-upload-qr">
                    {qrUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {qrUploading ? "Processing..." : "Upload QR Code"}
                    <input type="file" accept="image/webp" className="hidden" onChange={e => handleImageUpload(e, "qrUrl")} data-testid="input-qr-upload" />
                  </label>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Instructions / Account Info (optional)</label>
                <Textarea
                  placeholder="e.g. Account Name: Juan Dela Cruz&#10;Account Number: 09XX XXX XXXX"
                  value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  rows={3}
                  data-testid="input-payment-instructions"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Display Order</label>
                  <Input
                    type="number"
                    value={form.displayOrder}
                    onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                    data-testid="input-payment-order"
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Active</label>
                  <div className="flex items-center gap-2 h-9">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                      data-testid="switch-payment-active"
                    />
                    <span className="text-sm text-muted-foreground">{form.isActive ? "Visible at checkout" : "Hidden"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSubmit} disabled={createMethod.isPending || updateMethod.isPending} data-testid="button-save-payment-method">
                  {(createMethod.isPending || updateMethod.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editing ? "Save Changes" : "Create Method"}
                </Button>
                <Button variant="outline" onClick={cancelForm} data-testid="button-cancel-payment-form">Cancel</Button>
              </div>
            </div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : methods.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-xl">
              <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No payment methods yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Click "Add Method" to create your first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((m) => (
                <div key={m.id} className="flex items-center gap-4 border border-border/60 rounded-xl p-4 bg-white shadow-sm" data-testid={`card-payment-method-${m.id}`}>
                  {/* Logo */}
                  <div className="w-16 h-12 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
                    {m.logoUrl ? (
                      <img src={m.logoUrl} alt={m.label} className="max-h-full max-w-full object-contain p-1" data-testid={`img-method-logo-${m.id}`} />
                    ) : (
                      <CreditCard className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm" data-testid={`text-method-label-${m.id}`}>{m.label}</p>
                      <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${m.type === "cod" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>
                        {m.type === "cod" ? "COD" : "Online"}
                      </span>
                      {!m.isActive && (
                        <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Hidden</span>
                      )}
                    </div>
                    {m.instructions && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{m.instructions}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {m.qrUrl ? (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><Eye className="h-3 w-3" /> QR uploaded</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><EyeOff className="h-3 w-3" /> No QR</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={m.isActive ?? true}
                      onCheckedChange={() => handleToggleActive(m)}
                      data-testid={`switch-method-active-${m.id}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => startEdit(m)} data-testid={`button-edit-method-${m.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m)} className="text-destructive hover:text-destructive" data-testid={`button-delete-method-${m.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
