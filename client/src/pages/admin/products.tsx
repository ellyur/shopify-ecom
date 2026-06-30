import { useAdminProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, useCreateCategory, useUpdateCategory, useDeleteCategory, useAdminProductVariants, useCreateVariant, useUpdateVariant, useDeleteVariant, useAdminSettings, useUpdateSetting } from "@/hooks/use-products";
import { adminFetch } from "@/lib/adminFetch";
import { convertToWebP, recompressDataUrl, dataUrlSizeBytes } from "@/lib/imageUtils";
import { useState, useEffect, type ChangeEvent, type DragEvent } from "react";
import { Plus, Pencil, Trash2, Loader2, Filter, Upload, X, Palette, AlertCircle, Zap, CheckCircle, Search, Tag, FolderOpen, GripVertical } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminPagination } from "@/components/admin-pagination";
import type { ProductVariant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProductSchema, type Product } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_BADGES = [
  "Best Seller",
  "On Sale"
];

const productFormSchema = insertProductSchema.omit({ slug: true } as any).extend({
  discountPercentage: z.union([z.string(), z.number()]).optional().transform(v => 
    v !== undefined && v !== null && v !== "" ? String(v) : "0"
  ),
});

type StorefrontCoverSection = {
  id: string;
  title: string;
  images: string[];
};

function VariantManagementDialog({ productId, productName, onClose }: { productId: number; productName: string; onClose: () => void }) {
  const { toast } = useToast();
  const { data: variants = [], isLoading } = useAdminProductVariants(productId);
  const createVariant = useCreateVariant(productId);
  const updateVariant = useUpdateVariant(productId);
  const deleteVariant = useDeleteVariant(productId);

  const emptyForm = { colorName: "", colorHex: "#e63946", colorHex2: "#ffffff", imageUrl: "", stock: "0", price: "" };
  const [form, setForm] = useState(emptyForm);
  const [isMixed, setIsMixed] = useState(false);
  const [editing, setEditing] = useState<ProductVariant | null>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await convertToWebP(file);
      setForm(f => ({ ...f, imageUrl: dataUrl }));
      toast({ title: "Image ready", description: "Converted and compressed to WebP." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    }
  };

  const startEdit = (v: ProductVariant) => {
    setEditing(v);
    const parts = v.colorHex.split(",").map(c => c.trim());
    const mixed = parts.length >= 2;
    setIsMixed(mixed);
    setForm({ colorName: v.colorName, colorHex: parts[0] || "#e63946", colorHex2: parts[1] || "#ffffff", imageUrl: v.imageUrl || "", stock: v.stock.toString(), price: v.price?.toString() || "" });
  };

  const resetForm = () => { setEditing(null); setIsMixed(false); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.colorName.trim()) { toast({ variant: "destructive", title: "Color name is required" }); return; }
    const finalHex = isMixed ? `${form.colorHex},${form.colorHex2}` : form.colorHex;
    const payload = { colorName: form.colorName.trim(), colorHex: finalHex, imageUrl: form.imageUrl || null, stock: parseInt(form.stock) || 0, price: form.price || null };
    if (editing) {
      updateVariant.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => { toast({ title: "Color updated" }); resetForm(); },
        onError: () => toast({ variant: "destructive", title: "Failed to update" }),
      });
    } else {
      createVariant.mutate(payload, {
        onSuccess: () => { toast({ title: "Color added" }); resetForm(); },
        onError: () => toast({ variant: "destructive", title: "Failed to add color" }),
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto rounded-none border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Color Variants — {productName}</DialogTitle>
        </DialogHeader>

        {/* Add / Edit Form */}
        <div className="border border-border/50 p-4 space-y-4 bg-muted/10">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary">{editing ? "Edit Color" : "Add New Color"}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Color Name *</label>
              <Input className="rounded-none" placeholder="e.g. Red, Pink" value={form.colorName} onChange={e => setForm(f => ({ ...f, colorName: e.target.value }))} data-testid="input-variant-color-name" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Color Swatch</label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">
                  <input type="checkbox" checked={isMixed} onChange={e => setIsMixed(e.target.checked)} className="rounded" data-testid="checkbox-variant-mixed" />
                  Mixed
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={form.colorHex} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))} className="h-10 w-14 border border-border rounded-none cursor-pointer p-0.5" data-testid="input-variant-color-hex" />
                <Input className="rounded-none flex-1" value={form.colorHex} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))} placeholder="#e63946" />
                {isMixed && (
                  <>
                    <span className="text-muted-foreground text-xs">+</span>
                    <input type="color" value={form.colorHex2} onChange={e => setForm(f => ({ ...f, colorHex2: e.target.value }))} className="h-10 w-14 border border-border rounded-none cursor-pointer p-0.5" data-testid="input-variant-color-hex2" />
                    <Input className="rounded-none flex-1" value={form.colorHex2} onChange={e => setForm(f => ({ ...f, colorHex2: e.target.value }))} placeholder="#ffffff" />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Stock</label>
              <Input type="number" className="rounded-none" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} data-testid="input-variant-stock" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Price Override (₱, optional)</label>
              <Input type="number" step="0.01" className="rounded-none" placeholder="Leave blank to use product price" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} data-testid="input-variant-price" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Color Image</label>
            <div className="flex gap-3 items-start">
              <div className="h-16 w-16 border border-dashed border-border/60 bg-muted/20 overflow-hidden flex-shrink-0">
                {form.imageUrl ? <img src={form.imageUrl} className="h-full w-full object-cover" alt="" /> : <div className="h-full flex items-center justify-center"><Upload className="h-5 w-5 text-muted-foreground/40" /></div>}
              </div>
              <div className="flex-1 space-y-2">
                <Input className="rounded-none" placeholder="https://... or upload an image" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} data-testid="input-variant-image-url" />
                <Button type="button" variant="outline" size="sm" className="relative rounded-none border-primary/30 text-primary hover:bg-primary/5 text-xs overflow-hidden">
                  <Upload className="h-3 w-3 mr-2" /> Upload Image
                  <input type="file" accept="image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSubmit} disabled={createVariant.isPending || updateVariant.isPending} className="rounded-none text-xs uppercase tracking-widest" data-testid="button-save-variant">
              {editing ? "Save Changes" : "Add Color"}
            </Button>
            {editing && <Button variant="outline" onClick={resetForm} className="rounded-none text-xs">Cancel</Button>}
          </div>
        </div>

        {/* Variants List */}
        <div className="space-y-2 mt-2">
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : variants.length === 0 ? (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm italic">No colors added yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30 border border-border/30">
              {variants.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 hover:bg-muted/10 transition-colors" data-testid={`variant-row-${v.id}`}>
                  <div className="relative h-8 w-8 rounded-full border border-border/50 flex-shrink-0 overflow-hidden" style={(() => { const p = v.colorHex.split(",").map(c => c.trim()); return p.length >= 2 ? {} : { backgroundColor: v.colorHex }; })()}>
                    {(() => { const p = v.colorHex.split(",").map(c => c.trim()); return p.length >= 2 ? (<><span className="absolute inset-y-0 left-0 w-1/2" style={{ backgroundColor: p[0] }} /><span className="absolute inset-y-0 right-0 w-1/2" style={{ backgroundColor: p[1] }} /></>) : null; })()}
                  </div>
                  {v.imageUrl && <img src={v.imageUrl} className="h-10 w-10 object-cover border border-border/30" alt={v.colorName} />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{v.colorName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {v.stock <= 0 ? <span className="text-destructive">Out of Stock</span> : `${v.stock} in stock`}
                      {v.price && ` · ₱${Number(v.price).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5 hover:text-primary rounded-none" onClick={() => startEdit(v)} data-testid={`button-edit-variant-${v.id}`}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/5 hover:text-destructive rounded-none" onClick={() => { if (confirm("Remove this color?")) deleteVariant.mutate(v.id); }} data-testid={`button-delete-variant-${v.id}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminProducts() {
  const { data: products, isLoading } = useAdminProducts();
  const { data: categories } = useCategories();
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isOptimizeDialogOpen, setIsOptimizeDialogOpen] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState<{ done: number; total: number; running: boolean; log: string[] }>({ done: 0, total: 0, running: false, log: [] });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [variantProductId, setVariantProductId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  type PendingVariant = { colorName: string; colorHex: string; imageUrl?: string };
  const emptyPrimaryColor = { name: "", hex: "#e63946" };
  const emptyColorForm = { colorName: "", colorHex: "#e63946", colorHex2: "#ffffff", imageUrl: "" };
  const [primaryColor, setPrimaryColor] = useState(emptyPrimaryColor);
  const [pendingVariants, setPendingVariants] = useState<PendingVariant[]>([]);
  const [colorForm, setColorForm] = useState(emptyColorForm);
  const [isInlineMixed, setIsInlineMixed] = useState(false);

  const { data: inlineVariants = [] } = useAdminProductVariants(editingProduct?.id);
  const inlineCreateVariant = useCreateVariant(editingProduct?.id ?? 0);
  const inlineDeleteVariant = useDeleteVariant(editingProduct?.id ?? 0);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [categoryListPage, setCategoryListPage] = useState(1);
  const CATS_PER_PAGE = 5;

  const { data: adminSettings } = useAdminSettings();
  const updateSetting = useUpdateSetting();
  const allCategoryImageUrl = adminSettings?.find(s => s.key === "all_category_image_url")?.value || "";

  const BADGE_SECTIONS = ["Best Seller", "On Sale"];
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [coverSections, setCoverSections] = useState<StorefrontCoverSection[]>([]);
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false);
  const [coverTitle, setCoverTitle] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [isEditCoverDialogOpen, setIsEditCoverDialogOpen] = useState(false);
  const [editingCoverId, setEditingCoverId] = useState<string | null>(null);
  const [editCoverImages, setEditCoverImages] = useState<string[]>([]);

  useEffect(() => {
    const storedRaw = adminSettings?.find(s => s.key === "section_order")?.value;
    let stored: string[] = [];
    if (storedRaw) {
      try { stored = JSON.parse(storedRaw); } catch {}
    }
    const catKeys = (categories ?? []).map(c => `category:${c.id}`);
    const coverRaw = adminSettings?.find(s => s.key === "cover_sections")?.value;
    let covers: StorefrontCoverSection[] = [];
    if (coverRaw) {
      try {
        const parsed = JSON.parse(coverRaw) as StorefrontCoverSection[];
        if (Array.isArray(parsed)) {
          covers = parsed.filter(c => c.id && Array.isArray(c.images) && c.images.length > 0);
        }
      } catch {}
    }
    setCoverSections(covers);
    const coverKeys = covers.map(c => `cover:${c.id}`);
    const merged = [
      ...stored.filter(k => k.startsWith("badge:") || catKeys.includes(k) || coverKeys.includes(k)),
      ...catKeys.filter(k => !stored.includes(k)),
    ];
    setSectionOrder(merged);
  }, [adminSettings, categories]);

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setSectionOrder(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    setDraggedSectionIndex(toIndex);
  };

  const handleSectionDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedSectionIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleSectionDragOver = (event: DragEvent<HTMLDivElement>, overIndex: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggedSectionIndex === null || draggedSectionIndex === overIndex) return;
    moveSection(draggedSectionIndex, overIndex);
  };

  const handleSectionDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggedSectionIndex(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionIndex(null);
  };

  const resetCoverForm = () => {
    setCoverTitle("");
    setCoverImageUrl("");
    setCoverImages([]);
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    try {
      const uploaded = await Promise.all(files.map(file => convertToWebP(file)));
      setCoverImages(prev => [...prev, ...uploaded]);
      toast({ title: "Cover photo ready", description: `${uploaded.length} image${uploaded.length !== 1 ? "s" : ""} added.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    }
  };

  const addCoverImageUrl = () => {
    const trimmed = coverImageUrl.trim();
    if (!trimmed) return;
    setCoverImages(prev => [...prev, trimmed]);
    setCoverImageUrl("");
  };

  const saveStorefrontSectionSettings = async (nextCovers = coverSections, nextOrder = sectionOrder) => {
    await updateSetting.mutateAsync({ key: "cover_sections", value: JSON.stringify(nextCovers) });
    await updateSetting.mutateAsync({ key: "section_order", value: JSON.stringify(nextOrder) });
    toast({ title: "Saved", description: "Storefront sections updated." });
  };

  const createCoverSection = async () => {
    if (coverImages.length === 0) {
      toast({ variant: "destructive", title: "Add at least one cover photo" });
      return;
    }
    const cover: StorefrontCoverSection = {
      id: `${Date.now()}`,
      title: coverTitle.trim() || "Cover Photo",
      images: coverImages,
    };
    const nextCovers = [...coverSections, cover];
    const nextOrder = [`cover:${cover.id}`, ...sectionOrder];
    setCoverSections(nextCovers);
    setSectionOrder(nextOrder);
    await saveStorefrontSectionSettings(nextCovers, nextOrder);
    resetCoverForm();
    setIsCoverDialogOpen(false);
  };

  const removeCoverSection = async (id: string) => {
    const nextCovers = coverSections.filter(c => c.id !== id);
    const nextOrder = sectionOrder.filter(k => k !== `cover:${id}`);
    setCoverSections(nextCovers);
    setSectionOrder(nextOrder);
    await saveStorefrontSectionSettings(nextCovers, nextOrder);
  };

  const openEditCover = (cover: StorefrontCoverSection) => {
    setEditingCoverId(cover.id);
    setEditCoverImages([...cover.images]);
    setIsEditCoverDialogOpen(true);
  };

  const handleEditCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    try {
      const uploaded = await Promise.all(files.map(file => convertToWebP(file)));
      setEditCoverImages(prev => [...prev, ...uploaded]);
      toast({ title: "Photo added", description: `${uploaded.length} image${uploaded.length !== 1 ? "s" : ""} added.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    }
  };

  const saveEditCoverSection = async () => {
    if (!editingCoverId) return;
    if (editCoverImages.length === 0) {
      toast({ variant: "destructive", title: "At least one photo required" });
      return;
    }
    const nextCovers = coverSections.map(c =>
      c.id === editingCoverId ? { ...c, images: editCoverImages } : c
    );
    setCoverSections(nextCovers);
    await saveStorefrontSectionSettings(nextCovers, sectionOrder);
    setIsEditCoverDialogOpen(false);
    setEditingCoverId(null);
    setEditCoverImages([]);
  };

  const [allCategoryImageInput, setAllCategoryImageInput] = useState("");
  useEffect(() => {
    setAllCategoryImageInput(allCategoryImageUrl);
  }, [allCategoryImageUrl]);

  const categoryForm = useForm({
    defaultValues: {
      name: "",
      slug: "",
      imageUrl: "",
    },
  });

  const onCategorySubmit = (data: any) => {
    const formattedData = {
      ...data,
      slug: data.slug || data.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
      imageUrl: data.imageUrl || null,
    };

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...formattedData }, {
        onSuccess: () => {
          toast({ title: "Category updated successfully" });
          setEditingCategory(null);
          categoryForm.reset({ name: "", slug: "", imageUrl: "" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Update failed", description: err.message });
        }
      });
    } else {
      createCategory.mutate(formattedData, {
        onSuccess: () => {
          toast({ title: "Category created successfully" });
          setIsCategoryDialogOpen(false);
          categoryForm.reset({ name: "", slug: "", imageUrl: "" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Failed to create category", description: err.message });
        }
      });
    }
  };

  const filteredProducts = products?.filter(p => {
    const matchesCategory = categoryFilter === "all" || p.categoryId.toString() === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil((filteredProducts?.length ?? 0) / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts?.slice((safePage - 1) * pageSize, safePage * pageSize);

  const form = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      categoryId: categories?.[0]?.id ?? 2,
      price: "0",
      discountPercentage: "0",
      stock: 0,
      description: "",
      images: [] as string[],
      badges: [] as string[],
      sku: "",
      isActive: true,
    },
  });

  const getEmptyForm = () => ({
    name: "",
    categoryId: categories?.[0]?.id ?? 2,
    price: "0",
    discountPercentage: "0",
    stock: 0,
    description: "",
    images: [] as string[],
    badges: [] as string[],
    sku: "",
    isActive: true,
  });

  const onSubmit = (data: any) => {
    const formattedData = {
      ...data,
      price: data.price.toString(),
      discountPercentage: (data.discountPercentage ?? "0").toString(),
      stock: parseInt(data.stock.toString()),
      categoryId: parseInt(data.categoryId.toString()),
    };

    if (editingProduct) {
      updateProduct.mutate({
        id: editingProduct.id,
        ...formattedData,
        sku: data.sku || editingProduct.sku || "",
      }, {
        onSuccess: () => {
          toast({ title: "Product updated successfully" });
          setIsDialogOpen(false);
          setEditingProduct(null);
          form.reset(getEmptyForm());
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Update failed", description: err.message });
        }
      });
    } else {
      createProduct.mutate({
        ...formattedData,
        sku: data.sku || `SKU-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      }, {
        onSuccess: async (newProduct: any) => {
          const stock = parseInt(newProduct.stock?.toString() || "0") || 0;
          const allVariants: { colorName: string; colorHex: string; imageUrl?: string }[] = [];
          if (primaryColor.name.trim()) allVariants.push({ colorName: primaryColor.name.trim(), colorHex: primaryColor.hex });
          allVariants.push(...pendingVariants);
          for (const v of allVariants) {
            await adminFetch(`/api/admin/products/${newProduct.id}/variants`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ colorName: v.colorName, colorHex: v.colorHex, imageUrl: v.imageUrl || null, stock, price: null }),
            });
          }
          toast({ title: "Product created successfully" });
          setPrimaryColor(emptyPrimaryColor);
          setPendingVariants([]);
          setColorForm(emptyColorForm);
          setIsInlineMixed(false);
          setIsDialogOpen(false);
          setEditingProduct(null);
          form.reset(getEmptyForm());
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Creation failed", description: err.message });
        }
      });
    }
  };

  const handleWebpUpload = async (event: ChangeEvent<HTMLInputElement>, onChange: (value: string[]) => void, currentImages: string[] = []) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;
    try {
      const converted = await Promise.all(Array.from(files).map(f => convertToWebP(f)));
      onChange([...currentImages, ...converted]);
      toast({ title: `${converted.length} image${converted.length > 1 ? "s" : ""} added`, description: "Converted and compressed to WebP." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price.toString(),
      discountPercentage: (product.discountPercentage ?? "0").toString(),
      stock: product.stock,
      description: product.description || "",
      images: (product.images as string[]) || [],
      badges: (product.badges as string[]) || [],
      sku: product.sku || "",
      isActive: product.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    form.reset(getEmptyForm());
    setPrimaryColor(emptyPrimaryColor);
    setPendingVariants([]);
    setColorForm(emptyColorForm);
    setIsInlineMixed(false);
    setIsDialogOpen(true);
  };

  const handleInlineColorImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await convertToWebP(file);
      setColorForm(f => ({ ...f, imageUrl: dataUrl }));
      toast({ title: "Image ready", description: "Converted and compressed to WebP." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    }
  };

  const runImageOptimization = async () => {
    const allProds = products ?? [];
    type Job = { productId: number; productName: string; imageIndex: number; dataUrl: string };
    const jobs: Job[] = [];
    for (const p of allProds) {
      (p.images ?? []).forEach((img, i) => {
        if (img.startsWith("data:") && dataUrlSizeBytes(img) > 500 * 1024) {
          jobs.push({ productId: p.id, productName: p.name, imageIndex: i, dataUrl: img });
        }
      });
    }
    if (jobs.length === 0) {
      toast({ title: "All good!", description: "No images are over 500KB." });
      return;
    }
    setOptimizeProgress({ done: 0, total: jobs.length, running: true, log: [] });
    const grouped: Record<number, { productId: number; productName: string; updates: { index: number; newUrl: string }[] }> = {};
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      try {
        const newUrl = await recompressDataUrl(job.dataUrl);
        if (!grouped[job.productId]) grouped[job.productId] = { productId: job.productId, productName: job.productName, updates: [] };
        grouped[job.productId].updates.push({ index: job.imageIndex, newUrl });
        setOptimizeProgress(p => ({ ...p, done: i + 1, log: [...p.log, `✓ ${job.productName} (image ${job.imageIndex + 1})`] }));
      } catch {
        setOptimizeProgress(p => ({ ...p, done: i + 1, log: [...p.log, `✗ ${job.productName} (image ${job.imageIndex + 1}) — skipped`] }));
      }
    }
    for (const g of Object.values(grouped)) {
      const product = allProds.find(p => p.id === g.productId);
      if (!product) continue;
      const newImages = [...(product.images ?? [])];
      g.updates.forEach(u => { newImages[u.index] = u.newUrl; });
      await adminFetch(`/api/admin/products/${g.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: newImages }),
      });
    }
    setOptimizeProgress(p => ({ ...p, running: false }));
    toast({ title: "Optimization complete!", description: `${jobs.length} image(s) re-compressed.` });
  };

  const handleAddInlineColor = () => {
    if (!colorForm.colorName.trim()) {
      toast({ variant: "destructive", title: "Color name is required" });
      return;
    }
    const productStock = parseInt(form.getValues("stock")?.toString() || "0") || 0;
    const finalHex = isInlineMixed ? `${colorForm.colorHex},${colorForm.colorHex2}` : colorForm.colorHex;
    const payload = {
      colorName: colorForm.colorName.trim(),
      colorHex: finalHex,
      imageUrl: colorForm.imageUrl || null,
      stock: productStock,
      price: null,
    };
    if (editingProduct) {
      inlineCreateVariant.mutate(payload, {
        onSuccess: () => { toast({ title: "Color added" }); setColorForm(emptyColorForm); setIsInlineMixed(false); },
        onError: () => toast({ variant: "destructive", title: "Failed to add color" }),
      });
    } else {
      setPendingVariants(prev => [...prev, { colorName: colorForm.colorName.trim(), colorHex: finalHex, imageUrl: colorForm.imageUrl || undefined }]);
      setColorForm(emptyColorForm);
      setIsInlineMixed(false);
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

      {/* Main Content */}
      <main className="md:ml-72 flex-1 p-4 md:p-12 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">Inventory</h1>
            <p className="text-muted-foreground text-sm">Manage your luxury floral collection</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">

            {/* Optimize Images Dialog */}
            <Dialog open={isOptimizeDialogOpen} onOpenChange={(o) => { if (!optimizeProgress.running) setIsOptimizeDialogOpen(o); }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto rounded-none border-primary/50 text-primary/80 hover:bg-primary/5 gap-2" data-testid="button-optimize-images">
                  <Zap className="h-4 w-4" /> Optimize Images
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-none">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Bulk Image Optimizer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p className="text-muted-foreground text-xs">
                    Scans all product images stored in the database and re-compresses any that are over 500KB. This runs entirely in your browser — no data leaves the page until the update is saved.
                  </p>

                  {!optimizeProgress.running && optimizeProgress.total === 0 && (
                    <Button className="w-full rounded-none" onClick={runImageOptimization} data-testid="button-run-optimize">
                      <Zap className="h-4 w-4 mr-2" /> Scan & Optimize Now
                    </Button>
                  )}

                  {(optimizeProgress.running || optimizeProgress.total > 0) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{optimizeProgress.running ? "Processing…" : "Done"}</span>
                        <span>{optimizeProgress.done} / {optimizeProgress.total}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 transition-all duration-300"
                          style={{ width: `${optimizeProgress.total > 0 ? (optimizeProgress.done / optimizeProgress.total) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="border border-border/40 p-3 max-h-48 overflow-y-auto space-y-1 bg-muted/20">
                        {optimizeProgress.log.map((line, i) => (
                          <p key={i} className="text-[11px] font-mono text-muted-foreground">{line}</p>
                        ))}
                        {optimizeProgress.running && <p className="text-[11px] font-mono text-primary animate-pulse">Working…</p>}
                      </div>
                      {!optimizeProgress.running && (
                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                          <CheckCircle className="h-4 w-4" /> Optimization complete
                        </div>
                      )}
                      {!optimizeProgress.running && (
                        <Button variant="outline" size="sm" className="w-full rounded-none" onClick={() => setOptimizeProgress({ done: 0, total: 0, running: false, log: [] })}>
                          Run Again
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto rounded-none border-primary text-primary hover:bg-primary/5">
                  Manage Categories
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto rounded-none">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Manage Categories</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="border border-border/50 p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">"All" Category Image</p>
                    <div className="flex gap-2 items-center">
                      {allCategoryImageInput && (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-border/50 shrink-0">
                          <img src={allCategoryImageInput} alt="All category preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <Input
                        placeholder="https://..."
                        className="rounded-none flex-1"
                        value={allCategoryImageInput}
                        onChange={e => setAllCategoryImageInput(e.target.value)}
                        data-testid="input-all-category-image-url"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-none w-full"
                      disabled={updateSetting.isPending}
                      onClick={() => {
                        updateSetting.mutate({ key: "all_category_image_url", value: allCategoryImageInput }, {
                          onSuccess: () => toast({ title: "Saved", description: "\"All\" category image updated." }),
                        });
                      }}
                    >
                      Save "All" Category Image
                    </Button>
                  </div>

                  {/* Section Display Order */}
                  <div className="border border-border/50 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Storefront Section Order</p>
                      <div className="flex gap-2">
                        <Dialog open={isCoverDialogOpen} onOpenChange={setIsCoverDialogOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm" className="h-6 px-3 rounded-none text-[10px]" data-testid="button-open-cover-section">
                              Add Cover
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-none">
                            <DialogHeader>
                              <DialogTitle className="font-serif text-2xl">Add Cover Photo Section</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Title</label>
                                <Input
                                  value={coverTitle}
                                  onChange={e => setCoverTitle(e.target.value)}
                                  placeholder="e.g. Mother's Day Collection"
                                  className="rounded-none"
                                  data-testid="input-cover-title"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Photos</label>
                                <div className="flex gap-2">
                                  <Input
                                    value={coverImageUrl}
                                    onChange={e => setCoverImageUrl(e.target.value)}
                                    placeholder="Paste image URL"
                                    className="rounded-none"
                                    data-testid="input-cover-image-url"
                                  />
                                  <Button type="button" variant="outline" className="rounded-none" onClick={addCoverImageUrl} data-testid="button-add-cover-url">
                                    Add
                                  </Button>
                                </div>
                                <Button type="button" variant="outline" className="relative rounded-none w-full overflow-hidden" data-testid="button-upload-cover-images">
                                  <Upload className="h-4 w-4 mr-2" /> Upload WebP Photos
                                  <input type="file" accept="image/webp" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleCoverUpload} />
                                </Button>
                              </div>
                              {coverImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                  {coverImages.map((image, index) => (
                                    <div key={`${image}-${index}`} className="relative aspect-video border border-border/50 overflow-hidden">
                                      <img src={image} alt={`Cover ${index + 1}`} className="h-full w-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => setCoverImages(prev => prev.filter((_, i) => i !== index))}
                                        className="absolute top-1 right-1 h-6 w-6 bg-white/90 text-destructive flex items-center justify-center"
                                        data-testid={`button-remove-cover-image-${index}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button type="button" className="rounded-none flex-1" disabled={updateSetting.isPending} onClick={createCoverSection} data-testid="button-create-cover-section">
                                  Add Cover Section
                                </Button>
                                <Button type="button" variant="outline" className="rounded-none" onClick={() => { resetCoverForm(); setIsCoverDialogOpen(false); }}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 px-3 rounded-none text-[10px]"
                          disabled={updateSetting.isPending}
                          onClick={() => saveStorefrontSectionSettings()}
                          data-testid="button-save-section-order"
                        >
                          Save Order
                        </Button>
                      </div>
                      <Dialog open={isEditCoverDialogOpen} onOpenChange={setIsEditCoverDialogOpen}>
                        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-none">
                          <DialogHeader>
                            <DialogTitle className="font-serif text-2xl">Manage Cover Photos</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-xs text-muted-foreground">Upload multiple photos to make this cover section a carousel that auto-rotates.</p>
                            <Button type="button" variant="outline" className="relative rounded-none w-full overflow-hidden" data-testid="button-edit-upload-cover-images">
                              <Upload className="h-4 w-4 mr-2" /> Upload WebP Photos
                              <input type="file" accept="image/webp" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleEditCoverUpload} />
                            </Button>
                            {editCoverImages.length > 0 && (
                              <div className="grid grid-cols-3 gap-2">
                                {editCoverImages.map((image, index) => (
                                  <div key={`${image}-${index}`} className="relative aspect-video border border-border/50 overflow-hidden">
                                    <img src={image} alt={`Cover ${index + 1}`} className="h-full w-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setEditCoverImages(prev => prev.filter((_, i) => i !== index))}
                                      className="absolute top-1 right-1 h-6 w-6 bg-white/90 text-destructive flex items-center justify-center"
                                      data-testid={`button-remove-edit-cover-image-${index}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    {index === 0 && (
                                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1">First</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button type="button" className="rounded-none flex-1" disabled={updateSetting.isPending} onClick={saveEditCoverSection} data-testid="button-save-edit-cover-section">
                                Save Changes
                              </Button>
                              <Button type="button" variant="outline" className="rounded-none" onClick={() => setIsEditCoverDialogOpen(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Drag a row up or down, then click Save Order.</p>
                    <div className="space-y-1">
                      {sectionOrder.map((key, idx) => {
                        const isBadge = key.startsWith("badge:");
                        const isCover = key.startsWith("cover:");
                        const coverId = isCover ? key.replace("cover:", "") : "";
                        const cover = coverSections.find(c => c.id === coverId);
                        const label = isBadge
                          ? key.replace("badge:", "")
                          : isCover
                          ? (cover?.title ?? "Cover Photo")
                          : (categories?.find(c => c.id === Number(key.replace("category:", "")))?.name ?? key);
                        return (
                          <div
                            key={key}
                            draggable
                            onDragStart={(event) => handleSectionDragStart(event, idx)}
                            onDragOver={(event) => handleSectionDragOver(event, idx)}
                            onDrop={handleSectionDrop}
                            onDragEnd={handleSectionDragEnd}
                            className={`flex items-center gap-2 px-2 py-2 border bg-muted/5 hover:bg-muted/10 cursor-grab active:cursor-grabbing transition-colors ${
                              draggedSectionIndex === idx ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border/30"
                            }`}
                            data-testid={`draggable-section-${idx}`}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                            {isBadge
                              ? <Tag className="h-3 w-3 text-primary/60 shrink-0" />
                              : isCover
                              ? <Upload className="h-3 w-3 text-primary/60 shrink-0" />
                              : <FolderOpen className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                            }
                            <span className="text-sm flex-1 font-medium">{label}</span>
                            <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 ${isBadge || isCover ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {isBadge ? "badge" : isCover ? (cover && cover.images.length > 1 ? "carousel" : "cover") : "category"}
                            </span>
                            {isCover && cover && (
                              <button
                                type="button"
                                onClick={() => openEditCover(cover)}
                                className="h-5 w-5 flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors"
                                data-testid={`button-edit-cover-${coverId}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                            {(isBadge || isCover) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCover) {
                                    removeCoverSection(coverId);
                                  } else {
                                    setSectionOrder(prev => prev.filter(k => k !== key));
                                  }
                                }}
                                className="h-5 w-5 flex items-center justify-center text-destructive/50 hover:text-destructive transition-colors"
                                data-testid={`button-remove-section-${idx}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {BADGE_SECTIONS.filter(b => !sectionOrder.includes(`badge:${b}`)).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground self-center">Add section:</span>
                        {BADGE_SECTIONS.filter(b => !sectionOrder.includes(`badge:${b}`)).map(badge => (
                          <Button
                            key={badge}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 rounded-none text-[10px] border-primary/40 text-primary"
                            onClick={() => setSectionOrder(prev => [`badge:${badge}`, ...prev])}
                            data-testid={`button-add-badge-${badge.toLowerCase().replace(/ /g, "-")}`}
                          >
                            <Tag className="h-2.5 w-2.5 mr-1" /> {badge}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-3">
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Category Name *</FormLabel>
                            <FormControl><Input placeholder="e.g. Roses" className="rounded-none" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={categoryForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Category Image URL (optional)</FormLabel>
                            <div className="flex gap-2 items-center">
                              {field.value && (
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-border/50 shrink-0">
                                  <img src={field.value} alt="preview" className="h-full w-full object-cover" />
                                </div>
                              )}
                              <FormControl><Input placeholder="https://..." className="rounded-none" {...field} data-testid="input-category-image-url" /></FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        {editingCategory && (
                          <Button type="button" variant="outline" className="flex-1 rounded-none" onClick={() => {
                            setEditingCategory(null);
                            categoryForm.reset({ name: "", slug: "", imageUrl: "" });
                          }}>
                            Cancel
                          </Button>
                        )}
                        <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending} className="flex-1 rounded-none">
                          {editingCategory ? "Update Category" : "Add Category"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                  
                  {(() => {
                    const totalCats = categories?.length ?? 0;
                    const totalCatPages = Math.max(1, Math.ceil(totalCats / CATS_PER_PAGE));
                    const safeCatPage = Math.min(categoryListPage, totalCatPages);
                    const pagedCats = categories?.slice((safeCatPage - 1) * CATS_PER_PAGE, safeCatPage * CATS_PER_PAGE) ?? [];
                    return (
                      <div className="space-y-2">
                        <div className="border border-border/50 divide-y divide-border/50">
                          {pagedCats.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center p-3 hover:bg-muted/5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-border/40 shrink-0 bg-primary/5 flex items-center justify-center">
                                  {cat.imageUrl
                                    ? <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                                    : <span className="text-[9px] font-bold text-primary/50">{cat.name.charAt(0).toUpperCase()}</span>
                                  }
                                </div>
                                <span className="text-sm font-medium">{cat.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                  setEditingCategory(cat);
                                  categoryForm.reset({ name: cat.name, slug: cat.slug, imageUrl: cat.imageUrl || "" });
                                }} data-testid={`button-edit-category-${cat.id}`}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategory.mutate(cat.id)} data-testid={`button-delete-category-${cat.id}`}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {pagedCats.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground italic">No categories yet.</div>
                          )}
                        </div>
                        {totalCatPages > 1 && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              Page {safeCatPage} of {totalCatPages} · {totalCats} total
                            </span>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 rounded-none text-xs"
                                disabled={safeCatPage <= 1}
                                onClick={() => setCategoryListPage(p => Math.max(1, p - 1))}
                                data-testid="button-categories-prev"
                              >
                                Prev
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 rounded-none text-xs"
                                disabled={safeCatPage >= totalCatPages}
                                onClick={() => setCategoryListPage(p => Math.min(totalCatPages, p + 1))}
                                data-testid="button-categories-next"
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </DialogContent>
            </Dialog>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-10 rounded-none text-sm"
                data-testid="input-products-search"
              />
            </div>

            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-48 rounded-none border-border/50">
                <Filter className="h-4 w-4 mr-2 opacity-50" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              className="w-full sm:w-auto rounded-none bg-primary text-white hover:bg-primary/90 px-6"
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingProduct(null);
                form.reset();
                setPrimaryColor(emptyPrimaryColor);
                setPendingVariants([]);
                setColorForm(emptyColorForm);
                setIsInlineMixed(false);
              }
            }}>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-none border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                      const fields = Object.keys(errors).join(", ");
                      toast({ variant: "destructive", title: "Please fix the form", description: `Check fields: ${fields}` });
                    })} className="space-y-6 pt-4">
                    <div className="space-y-4">
                      <h3 className="text-xs uppercase tracking-widest font-bold text-primary border-b pb-2">1. Product Images</h3>
                      <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Add multiple images — first image is the main display image
                            </FormLabel>
                            <div className="space-y-4">
                              {/* Existing images grid */}
                              {field.value && field.value.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                  {field.value.map((img: string, idx: number) => (
                                    <div key={idx} className="relative group aspect-square border border-dashed border-primary/25 overflow-hidden bg-muted/30">
                                      <img
                                        src={img}
                                        alt={`Product image ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                      />
                                      {idx === 0 && (
                                        <span className="absolute top-1 left-1 bg-primary text-white text-[9px] uppercase tracking-widest px-1.5 py-0.5 leading-none">
                                          Main
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => field.onChange(field.value.filter((_: string, i: number) => i !== idx))}
                                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add image controls */}
                              <div className="flex flex-col sm:flex-row gap-2 items-start">
                                <div className="flex-1">
                                  <Input
                                    className="rounded-none"
                                    placeholder="Paste image URL and press Add"
                                    id="admin-image-url-input"
                                    data-testid="input-product-image-url"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="rounded-none border-primary/30 text-primary hover:bg-primary/5 whitespace-nowrap"
                                  onClick={() => {
                                    const input = document.getElementById("admin-image-url-input") as HTMLInputElement;
                                    const url = input?.value?.trim();
                                    if (url) {
                                      field.onChange([...(field.value || []), url]);
                                      input.value = "";
                                    }
                                  }}
                                >
                                  Add URL
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="relative rounded-none border-primary/30 text-primary hover:bg-primary/5 overflow-hidden whitespace-nowrap"
                                  data-testid="button-upload-webp-image"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Images
                                  <input
                                    type="file"
                                    accept="image/webp"
                                    multiple
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(event) => handleWebpUpload(event, field.onChange, field.value || [])}
                                    data-testid="input-upload-image"
                                  />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground" data-testid="text-product-image-rules">
                                WebP format only, max 500KB per image. Hover over an image and click ✕ to remove it.
                              </p>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs uppercase tracking-widest font-bold text-primary border-b pb-2">2. Basic Information</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Flower Name *</FormLabel>
                              <FormControl><Input className="rounded-none" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Primary Color */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Color Name <span className="text-muted-foreground/60">(optional)</span></label>
                          <Input
                            className="rounded-none"
                            placeholder="e.g. Red, Pink, Mix"
                            value={primaryColor.name}
                            onChange={e => setPrimaryColor(c => ({ ...c, name: e.target.value }))}
                            data-testid="input-primary-color-name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Color Swatch</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={primaryColor.hex}
                              onChange={e => setPrimaryColor(c => ({ ...c, hex: e.target.value }))}
                              className="h-10 w-12 border border-border rounded-none cursor-pointer p-0.5 flex-shrink-0"
                              data-testid="input-primary-color-hex"
                            />
                            <Input
                              className="rounded-none flex-1"
                              value={primaryColor.hex}
                              onChange={e => setPrimaryColor(c => ({ ...c, hex: e.target.value }))}
                              placeholder="#e63946"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Category *</FormLabel>
                              <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="rounded-none">
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-none">
                                  {categories?.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Stock Quantity *</FormLabel>
                              <FormControl><Input type="number" className="rounded-none" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Sale Price (₱) *</FormLabel>
                              <FormControl><Input type="number" step="0.01" className="rounded-none" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="discountPercentage"
                          render={({ field }) => {
                            const price = Number(form.watch("price") || 0);
                            const disc = Number(field.value || 0);
                            const original = disc > 0 ? price * (1 + disc / 100) : null;
                            return (
                              <FormItem>
                                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Discount (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="99"
                                    step="1"
                                    className="rounded-none"
                                    placeholder="0"
                                    {...field}
                                  />
                                </FormControl>
                                {original !== null && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Original price shown to customers: <span className="font-semibold text-foreground">₱{original.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs uppercase tracking-widest font-bold text-primary border-b pb-2">3. Description</h3>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Product Description</FormLabel>
                            <FormControl>
                              <Textarea className="rounded-none min-h-[100px]" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs uppercase tracking-widest font-bold text-primary border-b pb-2">4. Product Badges (Optional)</h3>
                      <FormField
                        control={form.control}
                        name="badges"
                        render={({ field }) => (
                          <FormItem>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {AVAILABLE_BADGES.map((badge) => (
                                <div key={badge} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={badge}
                                    checked={field.value?.includes(badge)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      const next = checked 
                                        ? [...current, badge] 
                                        : current.filter(b => b !== badge);
                                      field.onChange(next);
                                    }}
                                  />
                                  <label 
                                    htmlFor={badge}
                                    className="text-[10px] uppercase tracking-widest font-medium cursor-pointer"
                                  >
                                    {badge}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 5. Additional Color Variants */}
                    <div className="space-y-4">
                      <h3 className="text-xs uppercase tracking-widest font-bold text-primary border-b pb-2">5. Additional Color Variants <span className="text-muted-foreground font-normal normal-case tracking-normal">(Optional)</span></h3>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Add more color options — e.g. Pink, White, Mix. Each inherits the same stock and price as the product. Just enter the name and pick a color.
                      </p>

                      {/* Color list */}
                      {(editingProduct ? inlineVariants : pendingVariants).length > 0 && (
                        <div className="divide-y divide-border/30 border border-border/30">
                          {editingProduct
                            ? inlineVariants.map(v => (
                                <div key={v.id} className="flex items-center gap-3 p-2.5">
                                  <div className="relative h-5 w-5 rounded-full border border-border/50 flex-shrink-0 overflow-hidden" style={(() => { const p = v.colorHex.split(",").map((c: string) => c.trim()); return p.length >= 2 ? {} : { backgroundColor: v.colorHex }; })()}>
                                    {(() => { const p = v.colorHex.split(",").map((c: string) => c.trim()); return p.length >= 2 ? (<><span className="absolute inset-y-0 left-0 w-1/2" style={{ backgroundColor: p[0] }} /><span className="absolute inset-y-0 right-0 w-1/2" style={{ backgroundColor: p[1] }} /></>) : null; })()}
                                  </div>
                                  <span className="flex-1 text-sm font-medium">{v.colorName}</span>
                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/5 hover:text-destructive rounded-none" onClick={() => { if (confirm("Remove this color?")) inlineDeleteVariant.mutate(v.id); }}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))
                            : pendingVariants.map((v, i) => (
                                <div key={i} className="flex items-center gap-3 p-2.5">
                                  <div className="relative h-5 w-5 rounded-full border border-border/50 flex-shrink-0 overflow-hidden" style={(() => { const p = v.colorHex.split(",").map(c => c.trim()); return p.length >= 2 ? {} : { backgroundColor: v.colorHex }; })()}>
                                    {(() => { const p = v.colorHex.split(",").map(c => c.trim()); return p.length >= 2 ? (<><span className="absolute inset-y-0 left-0 w-1/2" style={{ backgroundColor: p[0] }} /><span className="absolute inset-y-0 right-0 w-1/2" style={{ backgroundColor: p[1] }} /></>) : null; })()}
                                  </div>
                                  <span className="flex-1 text-sm font-medium">{v.colorName}</span>
                                  {v.imageUrl && <img src={v.imageUrl} alt={v.colorName} className="h-7 w-7 object-cover border border-border/50 flex-shrink-0" />}
                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/5 hover:text-destructive rounded-none" onClick={() => setPendingVariants(prev => prev.filter((_, idx) => idx !== i))}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))
                          }
                        </div>
                      )}

                      {/* Add color row */}
                      <div className="space-y-2">
                        <div className="flex items-end gap-3">
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Color Name</label>
                            <Input
                              className="rounded-none"
                              placeholder="e.g. Pink, White, Mix"
                              value={colorForm.colorName}
                              onChange={e => setColorForm(f => ({ ...f, colorName: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddInlineColor(); } }}
                              data-testid="input-inline-color-name"
                            />
                          </div>
                          <div className="space-y-1 flex-shrink-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Swatch</label>
                              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-muted-foreground">
                                <input type="checkbox" checked={isInlineMixed} onChange={e => setIsInlineMixed(e.target.checked)} className="rounded" data-testid="checkbox-inline-mixed" />
                                Mixed
                              </label>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="color"
                                value={colorForm.colorHex}
                                onChange={e => setColorForm(f => ({ ...f, colorHex: e.target.value }))}
                                className="h-10 w-12 border border-border rounded-none cursor-pointer p-0.5"
                                data-testid="input-inline-color-hex"
                              />
                              {isInlineMixed && (
                                <>
                                  <span className="text-muted-foreground text-xs">+</span>
                                  <input
                                    type="color"
                                    value={colorForm.colorHex2}
                                    onChange={e => setColorForm(f => ({ ...f, colorHex2: e.target.value }))}
                                    className="h-10 w-12 border border-border rounded-none cursor-pointer p-0.5"
                                    data-testid="input-inline-color-hex2"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-none border-primary/40 text-primary hover:bg-primary/5 text-xs uppercase tracking-widest h-10 flex-shrink-0"
                            onClick={handleAddInlineColor}
                            disabled={inlineCreateVariant.isPending}
                            data-testid="button-add-inline-color"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Color Image (Optional)</label>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer border border-border/50 h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted/30 transition-colors" data-testid="button-inline-color-image-upload">
                              <Upload className="h-3 w-3" />
                              {colorForm.imageUrl ? "Change Image" : "Upload Image"}
                              <input type="file" accept="image/webp" className="hidden" onChange={handleInlineColorImageUpload} data-testid="input-inline-color-image" />
                            </label>
                            {colorForm.imageUrl && (
                              <div className="flex items-center gap-1.5">
                                <img src={colorForm.imageUrl} alt="preview" className="h-9 w-9 object-cover border border-border/50" />
                                <button type="button" onClick={() => setColorForm(f => ({ ...f, imageUrl: "" }))} className="text-muted-foreground hover:text-destructive" data-testid="button-inline-color-image-remove">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button type="submit" className="w-full rounded-none h-12 uppercase tracking-[0.2em] text-xs font-bold" disabled={createProduct.isPending || updateProduct.isPending}>
                        {editingProduct ? "Save Changes" : "Publish Product"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card rounded-none border-none shadow-sm overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-border/50">
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Product</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Collection</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Valuation</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Availability</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest py-6">Status</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-widest py-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts?.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/10 transition-colors border-b-border/30">
                  <TableCell className="py-6">
                    <div className="flex items-center gap-4">
                      {product.images?.[0] && (
                        <div className="h-10 w-10 bg-muted overflow-hidden">
                          <img src={product.images[0]} className="h-full w-full object-cover" alt="" />
                        </div>
                      )}
                      <div>
                        <p className="font-serif text-lg">{product.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.sku || 'No SKU'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      {categories?.find(c => c.id === product.categoryId)?.name}
                    </span>
                  </TableCell>
                  <TableCell className="py-6 font-medium">₱{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="py-6">
                    <span className={product.stock <= 5 ? "text-destructive font-bold text-xs" : "text-xs"}>
                      {product.stock} units
                    </span>
                  </TableCell>
                  <TableCell className="py-6">
                    <span className={`px-3 py-1 text-[8px] uppercase tracking-[0.2em] font-bold ${product.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {product.isActive ? "Active" : "Archived"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="hover:bg-primary/5 hover:text-primary rounded-none" title="Manage Colors" onClick={() => setVariantProductId(product.id)} data-testid={`button-manage-colors-${product.id}`}>
                        <Palette className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-primary/5 hover:text-primary rounded-none" onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-destructive/5 hover:text-destructive rounded-none" onClick={() => {
                        if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
                          deleteProduct.mutate(product.id);
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts && filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic font-light">
                    No products matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <AdminPagination
            currentPage={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredProducts?.length ?? 0}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </main>

      {/* Variant Management Dialog */}
      {variantProductId !== null && (() => {
        const prod = products?.find(p => p.id === variantProductId);
        return prod ? (
          <VariantManagementDialog
            productId={variantProductId}
            productName={prod.name}
            onClose={() => setVariantProductId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}
