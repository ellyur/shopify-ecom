import { useAdminSpecialOffers, useCreateSpecialOffer, useUpdateSpecialOffer, useDeleteSpecialOffer, useAdminProducts, useCategories } from "@/hooks/use-products";
import { convertToWebP } from "@/lib/imageUtils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState, type ChangeEvent } from "react";
import { Gift, Plus, Upload, Trash2, Loader2, Eye, EyeOff, Pencil } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SpecialOffer } from "@shared/schema";

const THEME_STYLES: Record<string, { label: string; card: string; accent: string; decor: string; button: string }> = {
  ruby: { label: "Ruby", card: "bg-white", accent: "text-primary", decor: "bg-primary/5", button: "bg-primary hover:bg-primary/90" },
  blush: { label: "Blush", card: "bg-[#fff5f7]", accent: "text-pink-500", decor: "bg-pink-100", button: "bg-pink-500 hover:bg-pink-600" },
  rose: { label: "Rose", card: "bg-[#fff1f2]", accent: "text-rose-600", decor: "bg-rose-100", button: "bg-rose-600 hover:bg-rose-700" },
  amber: { label: "Amber", card: "bg-[#fff8eb]", accent: "text-amber-600", decor: "bg-amber-100", button: "bg-amber-500 hover:bg-amber-600" },
  plum: { label: "Plum", card: "bg-[#f8f3ff]", accent: "text-purple-600", decor: "bg-purple-100", button: "bg-purple-600 hover:bg-purple-700" },
};

const emptyOffer = {
  label: "Today's Offers",
  title: "Get Special Offer",
  discountPercentage: "20",
  buttonText: "Order Now",
  imageUrl: "",
  theme: "ruby",
  linkType: "sale",
  linkValue: "",
  isActive: true,
  displayOrder: 0,
};


function OfferCardEditor({ offer, onChange, onUpload, saving }: { offer: typeof emptyOffer; onChange: (updates: Partial<typeof emptyOffer>) => void; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; saving: boolean }) {
  const theme = THEME_STYLES[offer.theme] ?? THEME_STYLES.ruby;

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-primary/5 shadow-xl shadow-primary/10 ${theme.card}`} data-testid="card-offer-editor-preview">
      <div className="grid md:grid-cols-[1fr_260px] min-h-[250px]">
        <div className={`absolute -right-14 -top-16 h-64 w-64 rounded-full ${theme.decor}`} />
        <div className="relative p-6 md:p-8 flex flex-col justify-center">
          <Input value={offer.label} onChange={(e) => onChange({ label: e.target.value })} className={`border-none bg-transparent px-0 h-8 text-xs font-medium focus-visible:ring-0 ${theme.accent}`} data-testid="input-offer-label" />
          <Input value={offer.title} onChange={(e) => onChange({ title: e.target.value })} className="border-none bg-transparent px-0 h-auto text-3xl md:text-4xl font-serif focus-visible:ring-0" data-testid="input-offer-title" />
          <div className="flex items-end gap-2 my-4">
            <span className="text-sm text-muted-foreground">Up to</span>
            <Input type="number" min="0" max="100" value={offer.discountPercentage} onChange={(e) => onChange({ discountPercentage: e.target.value })} className="w-20 border-none bg-transparent px-0 h-12 text-5xl font-black focus-visible:ring-0" data-testid="input-offer-discount" />
            <span className={`text-xl font-bold ${theme.accent}`}>% Off</span>
          </div>
          <Input value={offer.buttonText} onChange={(e) => onChange({ buttonText: e.target.value })} className={`w-40 rounded-full text-center text-white border-none ${theme.button}`} data-testid="input-offer-button-text" />
        </div>
        <label className="relative min-h-[220px] md:min-h-full overflow-hidden md:rounded-l-[72px] cursor-pointer group bg-muted/40" data-testid="label-offer-image-upload">
          {offer.imageUrl ? (
            <img src={offer.imageUrl} alt={offer.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" data-testid="img-offer-preview" />
          ) : (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-muted-foreground">
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-xs uppercase tracking-widest font-bold">Click to upload</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 bg-white text-foreground rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-opacity">Change image</span>
          </div>
          <input type="file" accept="image/webp" className="sr-only" onChange={onUpload} data-testid="input-offer-image" />
        </label>
      </div>
      {saving && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
    </div>
  );
}

export default function AdminSpecialOffers() {
  const { data: offers = [], isLoading } = useAdminSpecialOffers();
  const { data: products = [] } = useAdminProducts();
  const { data: categories = [] } = useCategories();
  const createOffer = useCreateSpecialOffer();
  const updateOffer = useUpdateSpecialOffer();
  const deleteOffer = useDeleteSpecialOffer();
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | "new">("new");
  const selectedOffer = offers.find((offer) => offer.id === editingId);
  const [draft, setDraft] = useState(emptyOffer);

  const startEdit = (offer: SpecialOffer) => {
    setEditingId(offer.id);
    setDraft({
      label: offer.label,
      title: offer.title,
      discountPercentage: (offer.discountPercentage ?? "0").toString(),
      buttonText: offer.buttonText,
      imageUrl: offer.imageUrl || "",
      theme: offer.theme || "ruby",
      linkType: offer.linkType || "sale",
      linkValue: offer.linkValue || "",
      isActive: offer.isActive ?? true,
      displayOrder: offer.displayOrder ?? 0,
    });
  };

  const startNew = () => {
    setEditingId("new");
    setDraft({ ...emptyOffer, displayOrder: offers.length + 1 });
  };

  const saveOffer = () => {
    const payload = {
      ...draft,
      discountPercentage: draft.discountPercentage || "0",
      displayOrder: Number(draft.displayOrder) || 0,
      linkValue: draft.linkValue || null,
      imageUrl: draft.imageUrl || null,
    };

    if (!payload.title.trim()) {
      toast({ variant: "destructive", title: "Title is required" });
      return;
    }

    if (editingId === "new") {
      createOffer.mutate(payload, {
        onSuccess: (offer) => {
          toast({ title: "Special offer created" });
          startEdit(offer);
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Save failed", description: err.message }),
      });
    } else {
      updateOffer.mutate({ id: editingId, ...payload }, {
        onSuccess: (offer) => {
          toast({ title: "Special offer updated" });
          startEdit(offer);
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Save failed", description: err.message }),
      });
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imageUrl = await convertToWebP(file);
      setDraft((current) => ({ ...current, imageUrl }));
      toast({ title: "Image ready", description: "WebP image compressed and ready." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    }
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
          <div>
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-accent font-bold mb-2 block">Homepage Promo Editor</span>
            <h1 className="text-3xl md:text-5xl font-serif leading-tight">Special Offers</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl">Click directly on the offer card text or image to edit what customers see.</p>
          </div>
          <Button onClick={startNew} className="rounded-none gap-2 uppercase tracking-widest text-[10px]" data-testid="button-add-special-offer">
            <Plus className="h-4 w-4" /> Add Special Offer
          </Button>
        </div>

        <div className="grid xl:grid-cols-[1fr_340px] gap-6">
          <section className="space-y-6">
            <OfferCardEditor offer={draft} onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))} onUpload={handleUpload} saving={createOffer.isPending || updateOffer.isPending} />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={saveOffer} disabled={createOffer.isPending || updateOffer.isPending} className="rounded-none uppercase tracking-widest text-[10px]" data-testid="button-save-special-offer">
                Save Offer
              </Button>
              {editingId !== "new" && (
                <Button variant="outline" onClick={() => updateOffer.mutate({ id: editingId, isActive: !draft.isActive }, { onSuccess: (offer) => { toast({ title: offer.isActive ? "Offer published" : "Offer hidden" }); startEdit(offer); } })} className="rounded-none uppercase tracking-widest text-[10px]" data-testid="button-toggle-special-offer">
                  {draft.isActive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {draft.isActive ? "Hide Offer" : "Publish Offer"}
                </Button>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-white border border-border/60 p-5 space-y-4 shadow-sm">
              <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-primary">Settings</h2>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Theme Style</label>
                <Select value={draft.theme} onValueChange={(theme) => setDraft((current) => ({ ...current, theme }))}>
                  <SelectTrigger className="rounded-none" data-testid="select-offer-theme"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(THEME_STYLES).map(([value, theme]) => <SelectItem key={value} value={value}>{theme.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Button Destination</label>
                <Select value={draft.linkType} onValueChange={(linkType) => setDraft((current) => ({ ...current, linkType, linkValue: "" }))}>
                  <SelectTrigger className="rounded-none" data-testid="select-offer-link-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">All sale products</SelectItem>
                    <SelectItem value="product">Specific product</SelectItem>
                    <SelectItem value="category">Specific category</SelectItem>
                    <SelectItem value="custom">Custom link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.linkType === "product" && (
                <Select value={draft.linkValue} onValueChange={(linkValue) => setDraft((current) => ({ ...current, linkValue }))}>
                  <SelectTrigger className="rounded-none" data-testid="select-offer-product"><SelectValue placeholder="Choose product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((product) => <SelectItem key={product.id} value={product.slug}>{product.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {draft.linkType === "category" && (
                <Select value={draft.linkValue} onValueChange={(linkValue) => setDraft((current) => ({ ...current, linkValue }))}>
                  <SelectTrigger className="rounded-none" data-testid="select-offer-category"><SelectValue placeholder="Choose category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {draft.linkType === "custom" && (
                <Input value={draft.linkValue} onChange={(e) => setDraft((current) => ({ ...current, linkValue: e.target.value }))} placeholder="/product/example or https://..." className="rounded-none" data-testid="input-offer-custom-link" />
              )}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Display Order</label>
                <Input type="number" value={draft.displayOrder} onChange={(e) => setDraft((current) => ({ ...current, displayOrder: Number(e.target.value) }))} className="rounded-none" data-testid="input-offer-display-order" />
              </div>
            </div>

            <div className="bg-white border border-border/60 p-5 space-y-3 shadow-sm">
              <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-primary">Saved Offers</h2>
              {offers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No saved offers yet.</p>
              ) : offers.map((offer) => {
                const isEditing = editingId === offer.id;
                return (
                  <div key={offer.id} className={`border rounded-sm p-3 flex items-center gap-3 transition-colors ${isEditing ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-muted/30"}`} data-testid={`card-saved-offer-${offer.id}`}>
                    {offer.imageUrl ? <img src={offer.imageUrl} alt={offer.title} className="h-12 w-12 object-cover rounded-lg shrink-0" /> : <div className="h-12 w-12 rounded-lg bg-muted shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{offer.title}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{offer.isActive ? "Active" : "Hidden"} · {offer.discountPercentage}%</p>
                      {isEditing && <p className="text-[10px] text-primary font-semibold uppercase tracking-widest mt-0.5">Editing...</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${isEditing ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                        onClick={() => startEdit(offer)}
                        data-testid={`button-edit-offer-${offer.id}`}
                        title="Edit offer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => { if (confirm("Delete this special offer?")) deleteOffer.mutate(offer.id, { onSuccess: () => { toast({ title: "Offer deleted" }); startNew(); } }); }}
                        data-testid={`button-delete-offer-${offer.id}`}
                        title="Delete offer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}