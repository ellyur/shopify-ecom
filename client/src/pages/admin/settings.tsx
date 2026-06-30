import { useAdminSettings, useUpdateSetting } from "@/hooks/use-products";
import { convertToWebP } from "@/lib/imageUtils";
import { DEFAULT_BRAND_SETTINGS, applyBrandTheme, getBrandSettings, saveCachedBrandSettings } from "@/lib/brand";
import { getFooterSettings } from "@/components/store-footer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useEffect, useState, type ChangeEvent } from "react";
import { removeBackground } from "@imgly/background-removal";
import { Loader2, Settings, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminSidebar } from "@/components/admin-sidebar";


export default function AdminSettings() {
  const { data: settings = [], isLoading } = useAdminSettings();
  const updateSetting = useUpdateSetting();
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [brand, setBrand] = useState(DEFAULT_BRAND_SETTINGS);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [footer, setFooter] = useState(getFooterSettings([]));
  const [mobileLayout, setMobileLayout] = useState<"grid" | "scroll">("grid");
  const [categoryLayout, setCategoryLayout] = useState<"top" | "left">("top");

  useEffect(() => {
    const nextBrand = getBrandSettings(settings);
    setBrand(nextBrand);
    applyBrandTheme(nextBrand);
    setFooter(getFooterSettings(settings));
    const ml = settings.find(s => s.key === "mobile_product_layout")?.value;
    if (ml === "scroll" || ml === "grid") setMobileLayout(ml);
    const cl = settings.find(s => s.key === "category_layout")?.value;
    if (cl === "left" || cl === "top") setCategoryLayout(cl);
  }, [settings]);

  const updateBrand = (updates: Partial<typeof brand>) => {
    const nextBrand = { ...brand, ...updates };
    setBrand(nextBrand);
    applyBrandTheme(nextBrand);
  };

  const saveBrand = () => {
    updateSetting.mutate({
      key: "brand_settings",
      value: JSON.stringify(brand),
    }, {
      onSuccess: () => {
        saveCachedBrandSettings(brand);
        toast({ title: "Brand settings saved", description: "Only the latest logo is stored." });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Save failed", description: err.message }),
    });
  };

  const saveFooter = () => {
    updateSetting.mutate({
      key: "footer_settings",
      value: JSON.stringify(footer),
    }, {
      onSuccess: () => toast({ title: "Footer saved" }),
      onError: (err: any) => toast({ variant: "destructive", title: "Save failed", description: err.message }),
    });
  };

  const saveLayoutSettings = () => {
    updateSetting.mutate({ key: "mobile_product_layout", value: mobileLayout });
    updateSetting.mutate({ key: "category_layout", value: categoryLayout }, {
      onSuccess: () => toast({ title: "Layout settings saved" }),
      onError: (err: any) => toast({ variant: "destructive", title: "Save failed", description: err.message }),
    });
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsRemovingBg(true);
    try {
      toast({ title: "Processing logo…", description: "Removing background, please wait." });
      const bgRemovedBlob = await removeBackground(file);
      const processedFile = new File([bgRemovedBlob], file.name, { type: "image/png" });
      const logoUrl = await convertToWebP(processedFile);
      updateBrand({ logoUrl });
      toast({ title: "Logo ready", description: "Background removed and saved." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setIsRemovingBg(false);
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 md:mb-12">
          <div>
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-accent font-bold mb-2 block">Brand Control</span>
            <h1 className="text-3xl md:text-5xl font-serif leading-tight">Theme & Logo Settings</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl">Change the main color and logo used by the store. Logo must be WebP format, compressed under 500KB.</p>
          </div>
        </div>

        <div className="grid xl:grid-cols-[420px_1fr] gap-6">
          <section className="bg-white border border-border/60 p-6 space-y-6 shadow-sm">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Theme Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={brand.primaryColor} onChange={(event) => updateBrand({ primaryColor: event.target.value })} className="h-12 w-16 border border-border bg-white p-1 cursor-pointer" data-testid="input-brand-color-picker" />
                <Input value={brand.primaryColor} onChange={(event) => updateBrand({ primaryColor: event.target.value })} className="rounded-none" data-testid="input-brand-color" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Logo</label>
              <div className="border border-dashed border-border p-5 flex flex-col items-center justify-center gap-4 bg-muted/20">
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt="Logo preview"
                    className="max-h-32 max-w-full object-contain"
                    style={brand.logoWhite ? { filter: "brightness(0) invert(1)", background: "#222", padding: "8px", borderRadius: "4px" } : undefined}
                    data-testid="img-logo-preview"
                  />
                ) : <p className="text-sm text-muted-foreground">No logo uploaded</p>}
                <Button type="button" variant="outline" className="relative rounded-none border-primary/30 text-primary hover:bg-primary/5 text-xs overflow-hidden" disabled={isRemovingBg} data-testid="button-upload-logo">
                  {isRemovingBg ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Removing background…</> : <><Upload className="h-3 w-3 mr-2" /> Upload Logo</>}
                  {!isRemovingBg && <input type="file" accept="image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} data-testid="input-logo-upload" />}
                </Button>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">White Logo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Makes the logo appear white — ideal for dark backgrounds</p>
                </div>
                <Switch
                  checked={brand.logoWhite}
                  onCheckedChange={(checked) => updateBrand({ logoWhite: checked })}
                  data-testid="switch-logo-white"
                />
              </div>
            </div>

            <Button onClick={saveBrand} disabled={updateSetting.isPending} className="w-full rounded-none uppercase tracking-widest text-[10px]" data-testid="button-save-brand-settings">
              {updateSetting.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </section>

          <section className="space-y-6" data-testid="preview-brand-sections">
            <div className="rounded-[2rem] p-8 shadow-xl shadow-primary/15 text-white" style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--primary)) 48%, hsl(var(--brand-highlight)) 100%)" }} data-testid="preview-brand-hero">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-white/70 text-xs mb-3">Preview</p>
                  <h2 className="font-serif text-4xl md:text-5xl leading-tight">Find your perfect bouquet</h2>
                  <p className="text-white/80 mt-4 max-w-xl">This is how your new theme color will feel on the storefront hero area.</p>
                </div>
                {brand.logoUrl && <img src={brand.logoUrl} alt="Logo preview" className="hidden md:block max-h-28 max-w-[180px] object-contain bg-white/10 rounded-2xl p-4" style={brand.logoWhite ? { filter: "brightness(0) invert(1)" } : undefined} data-testid="img-brand-hero-logo" />}
              </div>
            </div>

            <div className="bg-white border border-primary/10 rounded-[2rem] p-6 shadow-xl shadow-primary/10" data-testid="preview-brand-card">
              <p className="text-sm text-primary mb-2">Special Offer Preview</p>
              <h3 className="font-serif text-3xl mb-4">Get Special Offer</h3>
              <Button className="rounded-full bg-primary hover:bg-primary/90 px-8" data-testid="button-brand-preview">Order Now</Button>
            </div>
          </section>
        </div>

        <div className="mt-10">
          <div className="mb-6">
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-accent font-bold mb-2 block">Storefront</span>
            <h2 className="text-2xl md:text-3xl font-serif">Footer Settings</h2>
            <p className="text-sm text-muted-foreground mt-2">Customize the information shown in the store footer.</p>
          </div>

          <div className="bg-white border border-border/60 p-6 space-y-5 shadow-sm max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tagline</label>
              <Input
                value={footer.tagline}
                onChange={e => setFooter(f => ({ ...f, tagline: e.target.value }))}
                placeholder="e.g. Fresh flowers for every occasion"
                className="rounded-none"
                data-testid="input-footer-tagline"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Address / Location</label>
              <Input
                value={footer.address}
                onChange={e => setFooter(f => ({ ...f, address: e.target.value }))}
                placeholder="e.g. 123 Bloom St., Manila, Philippines"
                className="rounded-none"
                data-testid="input-footer-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Phone</label>
                <Input
                  value={footer.phone}
                  onChange={e => setFooter(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+63 912 345 6789"
                  className="rounded-none"
                  data-testid="input-footer-phone"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
                <Input
                  value={footer.email}
                  onChange={e => setFooter(f => ({ ...f, email: e.target.value }))}
                  placeholder="hello@yourstore.com"
                  className="rounded-none"
                  data-testid="input-footer-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Facebook URL</label>
                <Input
                  value={footer.facebook}
                  onChange={e => setFooter(f => ({ ...f, facebook: e.target.value }))}
                  placeholder="https://facebook.com/yourpage"
                  className="rounded-none"
                  data-testid="input-footer-facebook"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Instagram URL</label>
                <Input
                  value={footer.instagram}
                  onChange={e => setFooter(f => ({ ...f, instagram: e.target.value }))}
                  placeholder="https://instagram.com/yourpage"
                  className="rounded-none"
                  data-testid="input-footer-instagram"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Business Hours</label>
              <Textarea
                value={footer.hours}
                onChange={e => setFooter(f => ({ ...f, hours: e.target.value }))}
                placeholder={"Mon – Sat: 8:00 AM – 8:00 PM\nSunday: 9:00 AM – 5:00 PM"}
                className="rounded-none resize-none"
                rows={3}
                data-testid="textarea-footer-hours"
              />
            </div>

            <Button onClick={saveFooter} disabled={updateSetting.isPending} className="w-full rounded-none uppercase tracking-widest text-[10px]" data-testid="button-save-footer-settings">
              {updateSetting.isPending ? "Saving..." : "Save Footer"}
            </Button>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-6">
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-accent font-bold mb-2 block">Mobile Storefront</span>
            <h2 className="text-2xl md:text-3xl font-serif">Layout Settings</h2>
            <p className="text-sm text-muted-foreground mt-2">Control how products and categories appear on mobile devices.</p>
          </div>

          <div className="bg-white border border-border/60 p-6 space-y-7 shadow-sm max-w-2xl">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">Mobile Product Grid</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  data-testid="button-layout-grid"
                  onClick={() => setMobileLayout("grid")}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${mobileLayout === "grid" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <div className="grid grid-cols-2 gap-1 mb-3">
                    {[0,1,2,3].map(i => <div key={i} className="aspect-square rounded bg-muted/60" />)}
                  </div>
                  <p className={`text-xs font-semibold ${mobileLayout === "grid" ? "text-primary" : "text-foreground"}`}>2-Column Grid</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Products shown in a 2×2 grid (current)</p>
                </button>
                <button
                  type="button"
                  data-testid="button-layout-scroll"
                  onClick={() => setMobileLayout("scroll")}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${mobileLayout === "scroll" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <div className="flex gap-1 mb-3 overflow-hidden">
                    {[0,1,2].map(i => <div key={i} className="aspect-square rounded bg-muted/60 shrink-0 w-1/3" />)}
                  </div>
                  <p className={`text-xs font-semibold ${mobileLayout === "scroll" ? "text-primary" : "text-foreground"}`}>Horizontal Scroll</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">One row, swipe sideways to browse</p>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">Category Navigation</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  data-testid="button-category-top"
                  onClick={() => setCategoryLayout("top")}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${categoryLayout === "top" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <div className="space-y-1.5 mb-3">
                    <div className="flex gap-1.5">
                      {[0,1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full bg-muted/60 shrink-0" />)}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[0,1,2,3].map(i => <div key={i} className="aspect-square rounded bg-muted/40" />)}
                    </div>
                  </div>
                  <p className={`text-xs font-semibold ${categoryLayout === "top" ? "text-primary" : "text-foreground"}`}>Top Circles</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Circular icons scrolling horizontally (current)</p>
                </button>
                <button
                  type="button"
                  data-testid="button-category-left"
                  onClick={() => setCategoryLayout("left")}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${categoryLayout === "left" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <div className="flex gap-1.5 mb-3">
                    <div className="flex flex-col gap-1">
                      {[0,1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-muted/60 shrink-0" />)}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-1">
                      {[0,1,2,3].map(i => <div key={i} className="aspect-square rounded bg-muted/40" />)}
                    </div>
                  </div>
                  <p className={`text-xs font-semibold ${categoryLayout === "left" ? "text-primary" : "text-foreground"}`}>Left Sidebar (Kiosk)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Categories pinned on the left side</p>
                </button>
              </div>
            </div>

            <Button onClick={saveLayoutSettings} disabled={updateSetting.isPending} className="w-full rounded-none uppercase tracking-widest text-[10px]" data-testid="button-save-layout-settings">
              {updateSetting.isPending ? "Saving..." : "Save Layout"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}