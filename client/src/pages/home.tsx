import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useInfiniteProducts, useProductsCount, useCategories, useSpecialOffers, usePublicSettings, useAllProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/product-card";
import { Search, Loader2, SlidersHorizontal, MapPin, ShoppingBag, Home as HomeIcon, Truck, PackageCheck, X, ChevronDown, Flower2, ChevronRight, Menu, ShieldCheck, Headphones } from "lucide-react";
import heroImage from "@assets/hero_background.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useEffect, useRef } from "react";
import offerImage from "@assets/generated_images/red_violet_special_offer.png";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/hooks/use-cart";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "@/components/brand-logo";
import { StoreFooter } from "@/components/store-footer";

const AVAILABLE_BADGES = ["Best Seller", "On Sale", "New Arrival", "Limited Edition", "Most Favorite"];

const OFFER_THEME_STYLES: Record<string, { labelColor: string; accentColor: string; decorBg: string }> = {
  ruby: { labelColor: "text-muted-foreground", accentColor: "text-primary", decorBg: "bg-primary/5" },
  blush: { labelColor: "text-pink-400", accentColor: "text-pink-500", decorBg: "bg-pink-50" },
  rose: { labelColor: "text-rose-400", accentColor: "text-rose-600", decorBg: "bg-rose-50" },
  amber: { labelColor: "text-amber-500", accentColor: "text-amber-500", decorBg: "bg-amber-50" },
  plum: { labelColor: "text-purple-400", accentColor: "text-purple-600", decorBg: "bg-purple-50" },
};

type StorefrontCoverSection = {
  id: string;
  title: string;
  images: string[];
};

function CoverSectionBanner({ cover }: { cover: StorefrontCoverSection }) {
  const [activeImage, setActiveImage] = useState(0);
  const hasCarousel = cover.images.length > 1;

  useEffect(() => {
    if (!hasCarousel) return;
    const interval = setInterval(() => {
      setActiveImage(current => (current + 1) % cover.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [hasCarousel, cover.images.length]);

  if (cover.images.length === 0) return null;

  return (
    <div className="flex justify-center">
    <div className="relative w-full md:w-[70%] overflow-hidden rounded-xl" data-testid={`cover-section-${cover.id}`}>
      <AnimatePresence mode="wait">
        <motion.img
          key={`${cover.id}-${activeImage}`}
          src={cover.images[activeImage]}
          alt={cover.title}
          className="w-full h-auto block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          data-testid={`img-cover-section-${cover.id}`}
        />
      </AnimatePresence>
      {hasCarousel && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {cover.images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveImage(index)}
              className={`h-1.5 rounded-full transition-all ${index === activeImage ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              data-testid={`button-cover-dot-${cover.id}-${index}`}
            />
          ))}
        </div>
      )}
    </div>
    </div>
  );
}

function ScrollRow({ children, noNegativeMargin }: { children: React.ReactNode; noNegativeMargin?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  const checkEnd = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  const edgeClass = noNegativeMargin ? "px-4 md:px-0" : "-mx-4 px-4 md:mx-0 md:px-0";

  return (
    <div className="relative md:contents">
      <div
        ref={scrollRef}
        onScroll={checkEnd}
        className={`flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-7 md:overflow-visible ${edgeClass}`}
      >
        {children}
      </div>
      {!atEnd && (
        <button
          type="button"
          onClick={scrollRight}
          className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-10 h-9 w-9 rounded-full bg-white shadow-md border border-border/40 flex items-center justify-center text-foreground/70 hover:text-foreground hover:shadow-lg transition-all active:scale-95"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

const FLOWER_BOUQUET_ICON = "https://res.cloudinary.com/wq5jxe2r/image/upload/v1782894903/flower-bouquet_kynp1c.png";
const BOUQUET_ICON = "https://res.cloudinary.com/wq5jxe2r/image/upload/v1782895040/bouquet_p0hcgt.png";

const CATEGORY_ICON_MAP: Record<string, string> = {
  "all": FLOWER_BOUQUET_ICON,
  "funeral": "https://res.cloudinary.com/wq5jxe2r/image/upload/v1782894997/wreath_xcpgn3.png",
  "stuff toy": "https://res.cloudinary.com/wq5jxe2r/image/upload/v1782894903/plush-toy_vidnhe.png",
  "plush": "https://res.cloudinary.com/wq5jxe2r/image/upload/v1782894903/plush-toy_vidnhe.png",
  "fresh": BOUQUET_ICON,
  "premium": BOUQUET_ICON,
  "bouquet": FLOWER_BOUQUET_ICON,
  "flower": FLOWER_BOUQUET_ICON,
  "rose": FLOWER_BOUQUET_ICON,
  "tulip": FLOWER_BOUQUET_ICON,
  "carnation": FLOWER_BOUQUET_ICON,
  "lily": FLOWER_BOUQUET_ICON,
  "sunflower": FLOWER_BOUQUET_ICON,
  "orchid": FLOWER_BOUQUET_ICON,
  "floral": FLOWER_BOUQUET_ICON,
};

function getCategoryIcon(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return url;
  }
  return null;
}

export default function Home() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: specialOffers, isLoading: offersLoading } = useSpecialOffers();
  const { data: publicSettings } = usePublicSettings();
  const allCategoryImageUrl = publicSettings?.find(s => s.key === "all_category_image_url")?.value || "";
  const mobileLayout = publicSettings?.find(s => s.key === "mobile_product_layout")?.value ?? "grid";
  const categoryLayout = publicSettings?.find(s => s.key === "category_layout")?.value ?? "top";
  const { items: cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const [, setLocation] = useLocation();
  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [desktopScrolled, setDesktopScrolled] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHasScrolled(y > 80);
      setDesktopScrolled(y > window.innerHeight * 0.65);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAllView = activeCategoryId === "all";
  const apiCategory = activeCategoryId !== "all" ? String(activeCategoryId) : undefined;
  const apiFilters = { category: apiCategory, search: searchQuery || undefined };

  const {
    data: infiniteData,
    isLoading: productsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteProducts(apiFilters);

  const { data: countData } = useProductsCount(apiFilters);
  const totalCount = countData?.total ?? 0;

  const allProducts = useMemo(() => infiniteData?.pages.flat() ?? [], [infiniteData]);

  const { data: allGroupedProducts, isLoading: allGroupedLoading } = useAllProducts(
    { search: searchQuery || undefined },
    true
  );
  const loadedCount = allProducts.length;

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroNavOpen, setHeroNavOpen] = useState(false);
  const slideHovered = useRef(false);
  const offerSlides = useMemo(() => {
    return (specialOffers ?? []).map((offer) => ({
      ...offer,
      imageUrl: offer.imageUrl || offerImage,
      discountPercentage: (offer.discountPercentage ?? "0").toString(),
      theme: offer.theme || "ruby",
      linkType: offer.linkType || "sale",
      linkValue: offer.linkValue || "",
      styles: OFFER_THEME_STYLES[offer.theme || "ruby"] ?? OFFER_THEME_STYLES.ruby,
    }));
  }, [specialOffers]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!slideHovered.current) {
        setActiveSlide(s => (s + 1) % Math.max(offerSlides.length, 1));
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [offerSlides.length]);

  useEffect(() => {
    if (activeSlide >= offerSlides.length) setActiveSlide(0);
  }, [activeSlide, offerSlides.length]);

  const activeFilterCount = (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + selectedBadges.length;

  const categoryImageMap = useMemo<Record<number, string>>(() => {
    if (!allProducts) return {};
    const map: Record<number, string> = {};
    for (const p of allProducts) {
      if (p.categoryId && !map[p.categoryId]) {
        const imgs = p.images as string[] | null;
        if (imgs && imgs.length > 0) {
          map[p.categoryId] = imgs[0];
        }
      }
    }
    return map;
  }, [allProducts]);

  const parsedSectionOrder = useMemo<string[]>(() => {
    const categorySectionKeys = (categories ?? []).map(c => `category:${c.id}`);
    const raw = publicSettings?.find(s => s.key === "section_order")?.value;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedCategoryKeys = new Set(parsed.filter(key => key.startsWith("category:")));
          const missingCategoryKeys = categorySectionKeys.filter(key => !parsedCategoryKeys.has(key));
          return [...parsed, ...missingCategoryKeys];
        }
      } catch {}
    }
    return categorySectionKeys;
  }, [publicSettings, categories]);

  const coverSections = useMemo<StorefrontCoverSection[]>(() => {
    const raw = publicSettings?.find(s => s.key === "cover_sections")?.value;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as StorefrontCoverSection[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(cover => cover.id && Array.isArray(cover.images) && cover.images.length > 0);
    } catch {
      return [];
    }
  }, [publicSettings]);

  const groupedSections = useMemo(() => {
    if (!allGroupedProducts) return [];
    const fullyFiltered = allGroupedProducts.filter(p => {
      if (minPrice !== "" && !isNaN(parseFloat(minPrice)) && Number(p.price) < parseFloat(minPrice)) return false;
      if (maxPrice !== "" && !isNaN(parseFloat(maxPrice)) && Number(p.price) > parseFloat(maxPrice)) return false;
      if (selectedBadges.length > 0) {
        const badges = (p.badges as string[]) || [];
        if (!selectedBadges.some(b => badges.includes(b))) return false;
      }
      return true;
    });
    return parsedSectionOrder.map(sectionKey => {
      if (sectionKey.startsWith("cover:")) {
        const coverId = sectionKey.replace("cover:", "");
        const cover = coverSections.find(c => c.id === coverId);
        if (!cover) return null;
        return { key: sectionKey, type: "cover" as const, cover };
      } else if (sectionKey.startsWith("badge:")) {
        const badge = sectionKey.replace("badge:", "");
        const prods = fullyFiltered.filter(p => ((p.badges as string[]) || []).includes(badge));
        return { key: sectionKey, type: "products" as const, label: badge, products: prods, isBadge: true };
      } else {
        const catId = Number(sectionKey.replace("category:", ""));
        const cat = categories?.find(c => c.id === catId);
        if (!cat) return null;
        const prods = fullyFiltered.filter(p => p.categoryId === catId);
        return { key: sectionKey, type: "products" as const, label: cat.name, products: prods, isBadge: false };
      }
    }).filter((s): s is NonNullable<typeof s> => s !== null && (s.type === "cover" || s.products.length > 0));
  }, [allGroupedProducts, parsedSectionOrder, categories, minPrice, maxPrice, selectedBadges, coverSections]);

  const bestSellerProducts = useMemo(() => {
    if (!allGroupedProducts) return [];
    return allGroupedProducts
      .filter(p => ((p.badges as string[]) || []).includes("Best Seller"))
      .slice(0, 10);
  }, [allGroupedProducts]);

  const toggleBadge = (badge: string) => {
    setSelectedBadges(prev => prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]);
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedBadges([]);
    setShowFilter(false);
  };

  const handleOfferAction = (slide: typeof offerSlides[number]) => {
    if (slide.linkType === "product" && slide.linkValue) {
      setLocation(`/product/${slide.linkValue}`);
      return;
    }

    if (slide.linkType === "category" && slide.linkValue) {
      const categoryId = Number(slide.linkValue);
      if (!Number.isNaN(categoryId)) {
        setActiveCategoryId(categoryId);
        document.getElementById("recommended-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (slide.linkType === "custom" && slide.linkValue) {
      if (slide.linkValue.startsWith("http")) {
        window.location.href = slide.linkValue;
      } else {
        setLocation(slide.linkValue.startsWith("/") ? slide.linkValue : `/${slide.linkValue}`);
      }
      return;
    }

    setSelectedBadges(["On Sale"]);
    document.getElementById("recommended-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    if (minPrice !== "") {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) filtered = filtered.filter(p => Number(p.price) >= min);
    }

    if (maxPrice !== "") {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) filtered = filtered.filter(p => Number(p.price) <= max);
    }

    if (selectedBadges.length > 0) {
      filtered = filtered.filter(p => {
        const badges = (p.badges as string[]) || [];
        return selectedBadges.some(b => badges.includes(b));
      });
    }

    return filtered;
  }, [allProducts, activeCategoryId, searchQuery, minPrice, maxPrice, selectedBadges]);

  const activeFiltersStrip = activeFilterCount > 0 ? (
    <div className="flex flex-wrap gap-2 mt-3">
      {minPrice !== "" && (
        <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full" data-testid="chip-filter-min-price">
          Min ₱{minPrice}
          <button onClick={() => setMinPrice("")} className="hover:text-primary/60" data-testid="button-remove-filter-min-price"><X className="h-3 w-3" /></button>
        </span>
      )}
      {maxPrice !== "" && (
        <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full" data-testid="chip-filter-max-price">
          Max ₱{maxPrice}
          <button onClick={() => setMaxPrice("")} className="hover:text-primary/60" data-testid="button-remove-filter-max-price"><X className="h-3 w-3" /></button>
        </span>
      )}
      {selectedBadges.map(badge => (
        <span key={badge} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full" data-testid={`chip-filter-badge-${badge.toLowerCase().replace(/ /g, "-")}`}>
          {badge}
          <button onClick={() => toggleBadge(badge)} className="hover:text-primary/60" data-testid={`button-remove-filter-badge-${badge.toLowerCase().replace(/ /g, "-")}`}><X className="h-3 w-3" /></button>
        </span>
      ))}
      <button onClick={clearFilters} className="text-xs text-muted-foreground underline underline-offset-2 px-1 py-1.5 hover:text-foreground transition-colors" data-testid="button-clear-all-chips">
        Clear all
      </button>
    </div>
  ) : null;

  const filterContents = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-primary font-medium flex items-center gap-1" data-testid="button-clear-all-filters">
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Price Range (₱)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="rounded-xl h-9 text-sm"
            data-testid="input-filter-min-price"
          />
          <span className="text-muted-foreground text-sm shrink-0">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="rounded-xl h-9 text-sm"
            data-testid="input-filter-max-price"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Badge / Tag</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_BADGES.map(badge => (
            <button
              key={badge}
              onClick={() => toggleBadge(badge)}
              data-testid={`badge-filter-${badge.toLowerCase().replace(/ /g, "-")}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                selectedBadges.includes(badge)
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-foreground border-border hover:border-primary/40"
              }`}
            >
              {badge}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full rounded-xl h-9 text-xs uppercase tracking-widest"
        onClick={() => setShowFilter(false)}
        data-testid="button-apply-filters"
      >
        Show Results {activeFilterCount > 0 && `(${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""})`}
      </Button>
    </div>
  );

  const filterPanel = (
    <AnimatePresence>
      {showFilter && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-2xl shadow-xl border border-border/60 p-5 mt-3"
        >
          {filterContents}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const mobileFilterSheet = (
    <AnimatePresence>
      {showFilter && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowFilter(false)}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            style={{ bottom: "64px" }}
          >
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
            {filterContents}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const categoryCircles = categoriesLoading ? (
    <div className="flex overflow-x-auto hide-scrollbar gap-3 py-1 px-4 pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shrink-0 flex flex-col items-center gap-1.5">
          <Skeleton className="w-[78px] h-[78px] rounded-2xl" />
          <Skeleton className="h-2 w-12 rounded-md" />
        </div>
      ))}
    </div>
  ) : (
    <div className="relative">
      <div
        ref={categoryScrollRef}
        onScroll={() => setShowScrollHint(false)}
        className="flex overflow-x-auto hide-scrollbar gap-2.5 py-1 px-4 pb-3 snap-x snap-mandatory scroll-pl-4"
      >
      {/* "All" card */}
      <button
        data-testid="category-chip-all"
        onClick={() => setActiveCategoryId("all")}
        className="snap-start shrink-0 flex flex-col items-center gap-1 group w-[78px]"
      >
        <div className={`w-[78px] h-[78px] rounded-2xl overflow-hidden transition-all duration-200 shadow-sm ${
          activeCategoryId === "all"
            ? "ring-2 ring-primary ring-offset-1"
            : "ring-1 ring-border/60"
        }`}>
          {(allCategoryImageUrl || CATEGORY_ICON_MAP["all"]) ? (
            <img src={allCategoryImageUrl || CATEGORY_ICON_MAP["all"]} alt="All" className="h-full w-full object-cover" />
          ) : (
            <div className={`h-full w-full flex items-center justify-center ${activeCategoryId === "all" ? "bg-primary" : "bg-primary/10"}`}>
              <Flower2 className={`h-8 w-8 ${activeCategoryId === "all" ? "text-white" : "text-primary/70"}`} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 mt-0.5">
          <img src={FLOWER_BOUQUET_ICON} alt="" className="h-2.5 w-2.5 shrink-0 object-contain" />
          <span className={`text-[10px] font-medium leading-none truncate ${activeCategoryId === "all" ? "text-primary font-semibold" : "text-muted-foreground"}`}>All</span>
        </div>
      </button>

      {categories?.map((category) => {
        const imgSrc = category.imageUrl || categoryImageMap[category.id] || null;
        const isActive = activeCategoryId === category.id;
        return (
          <button
            key={category.id}
            data-testid={`category-chip-${category.id}`}
            onClick={() => setActiveCategoryId(category.id)}
            className="snap-start shrink-0 flex flex-col items-center gap-1 group w-[78px]"
          >
            <div className={`w-[78px] h-[78px] rounded-2xl overflow-hidden transition-all duration-200 shadow-sm ${
              isActive
                ? "ring-2 ring-primary ring-offset-1"
                : "ring-1 ring-border/60 group-hover:ring-primary/30"
            }`}>
              {imgSrc ? (
                <img src={imgSrc} alt={category.name} className="h-full w-full object-cover" />
              ) : (
                <div className={`h-full w-full flex items-center justify-center ${isActive ? "bg-primary" : "bg-primary/10"}`}>
                  <span className={`text-xl font-bold ${isActive ? "text-white" : "text-primary/60"}`}>{category.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5 mt-0.5 max-w-[78px]">
              <img src={getCategoryIcon(category.name) || FLOWER_BOUQUET_ICON} alt="" className="h-2.5 w-2.5 shrink-0 object-contain" />
              <span className={`text-[10px] font-medium leading-none truncate ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>{category.name}</span>
            </div>
          </button>
        );
      })}
      </div>
      <AnimatePresence>
        {showScrollHint && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center"
          >
            <div className="w-14 h-full bg-gradient-to-l from-white/95 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const groupedView = isAllView ? (
    allGroupedLoading ? (
      <div className="space-y-10 md:space-y-14">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-36 rounded-md" />
              <div className="flex-1 h-px bg-border/30" />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-8 gap-3 md:gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex flex-col gap-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-3 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : groupedSections.length > 0 ? (
      <div className="space-y-10 md:space-y-14">
        {groupedSections.map(section => (
          section.type === "cover" ? (
            <CoverSectionBanner key={section.key} cover={section.cover} />
          ) : (
            <div key={section.key}>
              <div className="flex items-center gap-3 mb-4 md:mb-5">
                {section.isBadge ? (
                  <span className="shrink-0 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {section.label}
                  </span>
                ) : (
                  <h3 className="text-base font-semibold font-sans text-foreground shrink-0">{section.label}</h3>
                )}
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest shrink-0">
                  {section.products.length} item{section.products.length !== 1 ? "s" : ""}
                </span>
              </div>
              {mobileLayout === "scroll" ? (
                <ScrollRow noNegativeMargin={categoryLayout === "left"}>
                  {section.products.map(product => (
                    <div key={`${section.key}-${product.id}`} className="snap-start shrink-0 w-[118px] md:w-full">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </ScrollRow>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-8 gap-3 md:gap-3">
                  {section.products.map(product => (
                    <ProductCard key={`${section.key}-${product.id}`} product={product} />
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    ) : (
      <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-3xl border border-dashed border-border">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Search className="h-6 w-6 text-primary/60" />
        </div>
        <h4 className="font-serif text-xl mb-2">No arrangements found</h4>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">Try adjusting your filters or browse all collections.</p>
        <Button variant="outline" className="rounded-full" onClick={() => { setSearchQuery(""); clearFilters(); }} data-testid="button-clear-filters-grouped">
          Clear Filters
        </Button>
      </div>
    )
  ) : null;

  const productGrid = categoriesLoading || productsLoading ? (
    <div className="grid grid-cols-3 md:grid-cols-8 gap-3 md:gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square md:aspect-[4/5] w-full rounded-xl md:rounded-2xl" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      ))}
    </div>
  ) : filteredProducts.length > 0 ? (
    <>
      {mobileLayout === "scroll" ? (
        <ScrollRow noNegativeMargin={categoryLayout === "left"}>
          {filteredProducts.map((product) => (
            <div key={product.id} className="snap-start shrink-0 w-[118px] md:w-full">
              <ProductCard product={product} />
            </div>
          ))}
        </ScrollRow>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-8 gap-3 md:gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="py-4 flex flex-col items-center gap-3">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more...
          </div>
        )}
        {hasNextPage && !isFetchingNextPage && (
          <Button
            variant="outline"
            className="rounded-full px-8 border-primary/30 text-primary hover:bg-primary/5 text-xs font-semibold"
            onClick={() => fetchNextPage()}
            data-testid="button-load-more-products"
          >
            View More ({totalCount - loadedCount} remaining)
          </Button>
        )}
        {!hasNextPage && loadedCount > 0 && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            All {totalCount} arrangement{totalCount !== 1 ? "s" : ""} shown
          </p>
        )}
      </div>
    </>
  ) : (
    <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-3xl border border-dashed border-border">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Search className="h-6 w-6 text-primary/60" />
      </div>
      <h4 className="font-serif text-xl mb-2">No arrangements found</h4>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        We couldn't find any blooms matching your search. Try a different term or browse our collections.
      </p>
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => {
          setSearchQuery("");
          setActiveCategoryId("all");
          clearFilters();
        }}
        data-testid="button-clear-filters"
      >
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      {/* ── Announcement Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#3d4f3d] text-white text-center py-2 text-[11px] tracking-[0.15em] uppercase font-medium select-none">
        Enjoy hassle-free flower shopping
      </div>

      {/* ── Hero Navbar ── */}
      <nav className="fixed left-0 right-0 z-40 transition-all duration-300 top-[34px] bg-white border-b border-border/30 shadow-sm py-2">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="relative flex items-center justify-between h-12">
            {/* Hamburger */}
            <Sheet open={heroNavOpen} onOpenChange={setHeroNavOpen}>
              <SheetTrigger asChild>
                <button aria-label="Open menu" className="p-2 rounded-md transition-colors text-foreground hover:bg-muted/60">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 border-r-0 bg-white">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-border/50 bg-primary/5">
                    <BrandLogo className="h-10 w-auto" showFallbackText />
                  </div>
                  <div className="flex-1 p-6 space-y-6">
                    <Link href="/" className="block text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setHeroNavOpen(false)}>Boutique</Link>
                    <Link href="/track" className="block text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setHeroNavOpen(false)}>Track Order</Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Center logo */}
            <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <BrandLogo className="h-10 md:h-12 w-auto" showFallbackText />
            </Link>

            {/* Right: cart */}
            <div className="flex items-center gap-0.5">
              <CartDrawer
                trigger={
                  <button aria-label="Open cart" className="relative p-2 rounded-md transition-colors text-foreground hover:bg-muted/60">
                    <ShoppingBag className="h-5 w-5" />
                    <AnimatePresence>
                      {cartCount > 0 && (
                        <motion.span
                          key={cartCount}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
                        >
                          {cartCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative w-full h-[52dvh] md:h-[calc(100dvh-98px)] overflow-hidden mt-[98px] md:mt-[98px]">
        {/* Background image */}
        {/* Mobile image */}
        <img
          src={heroImage}
          alt="Fresh floral arrangements"
          className="absolute inset-0 w-full h-full object-cover [object-position:20%_top] md:hidden"
        />
        {/* Desktop image */}
        <img
          src="https://res.cloudinary.com/tjrvesfo/image/upload/v1782924269/3955d9a4-369b-4785-80b9-0b0215e6dbe1_1_mxuldn.jpg"
          alt="Fresh floral arrangements"
          className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
        />

        {/* ── MOBILE overlays (unchanged) ── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent md:hidden" />
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/50 to-transparent md:hidden" />

        {/* Mobile text + CTAs */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-6 text-left pb-10 md:hidden">
          <p className="font-serif text-white/85 text-[9px] tracking-[0.3em] uppercase font-normal mb-2">
            Fresh Flowers. Handcrafted.
          </p>
          <h1 className="font-serif text-white font-light uppercase leading-[1.12] mb-4 tracking-[0.04em] text-[1.25rem]">
            Beautiful.<br />Natural.<br />Timeless.
          </h1>
          <div className="flex flex-col gap-1.5 w-full max-w-[11rem]">
            <button
              onClick={() => { setSelectedBadges(["Best Seller"]); document.getElementById("recommended-products")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className="bg-[#4a5e3a] text-white text-[8px] tracking-[0.22em] uppercase py-[7px] font-semibold hover:bg-[#3d4f30] transition-colors"
            >Shop Best Sellers</button>
            <button
              onClick={() => document.getElementById("recommended-products")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="border border-white/80 text-white text-[8px] tracking-[0.22em] uppercase py-[7px] font-semibold bg-transparent hover:bg-white/10 transition-colors"
            >Shop All Bouquets</button>
          </div>
        </div>

        {/* ── DESKTOP: Left-Aligned Cinematic ── */}
        {/* Left-to-right gradient so text is legible */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        {/* Subtle top vignette */}
        <div className="hidden md:block absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/30 to-transparent" />

        <div className="hidden md:flex absolute inset-0 items-center px-16 xl:px-24">
          {/* Thin vertical decorative line */}
          <div className="w-px h-40 bg-white/40 mr-8 shrink-0" />

          <div className="flex flex-col">
            {/* Eyebrow */}
            <p className="font-serif text-white/70 text-[11px] xl:text-[13px] tracking-[0.35em] uppercase mb-5">
              Fresh Flowers. Handcrafted.
            </p>

            {/* Main headline — one word per line, very large */}
            <h1 className="font-serif text-white font-light uppercase leading-[0.95] tracking-[0.03em] mb-8">
              <span className="block text-[5.5rem] xl:text-[7rem]">Beautiful.</span>
              <span className="block text-[5.5rem] xl:text-[7rem]">Natural.</span>
              <span className="block text-[5.5rem] xl:text-[7rem]">Timeless.</span>
            </h1>

            {/* CTAs — horizontal row on desktop */}
            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedBadges(["Best Seller"]); document.getElementById("recommended-products")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className="bg-white text-[#2d2d2d] text-[10px] xl:text-xs tracking-[0.2em] uppercase px-8 py-3.5 font-semibold hover:bg-white/90 transition-colors"
              >Shop Best Sellers</button>
              <button
                onClick={() => document.getElementById("recommended-products")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="border border-white/70 text-white text-[10px] xl:text-xs tracking-[0.2em] uppercase px-8 py-3.5 font-semibold bg-transparent hover:bg-white/10 transition-colors"
              >Shop All Bouquets</button>
            </div>
          </div>
        </div>
      </section>

      <div className="md:hidden min-h-[100dvh] w-full max-w-[430px] mx-auto bg-background pb-24 [overflow-x:clip]">
        <main className="px-4">
          {/* Compact search bar */}
          <section className="pt-5 pb-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-mobile-panel"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search bouquets..."
                  className="h-10 rounded-xl border-border/60 bg-white pl-10 pr-4 text-xs shadow-sm"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className={`h-10 w-10 rounded-xl relative border-border/60 ${showFilter ? "bg-primary text-white border-primary" : ""}`}
                onClick={() => setShowFilter(v => !v)}
                data-testid="button-mobile-filter-panel"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">{activeFilterCount}</span>
                )}
              </Button>
            </div>
            <div className="mt-2">{filterPanel}</div>
            {activeFiltersStrip && <div className="mt-1">{activeFiltersStrip}</div>}
          </section>

          {categoryLayout === "left" ? (
            <div className="flex gap-0 -mx-4 mb-12" id="recommended-products">
              {/* Left category sidebar */}
              <div className="w-[68px] shrink-0 flex flex-col gap-0.5 pt-2 pl-2 pr-1 overflow-y-auto sticky top-0 max-h-[calc(100dvh-200px)] border-r border-border/40">
                <button
                  data-testid="category-chip-left-all"
                  onClick={() => setActiveCategoryId("all")}
                  className={`flex flex-col items-center gap-1 py-2 px-0.5 rounded-xl transition-colors ${activeCategoryId === "all" ? "bg-primary/10" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${activeCategoryId === "all" ? "ring-2 ring-primary ring-offset-1 shadow-sm shadow-primary/20" : "ring-1 ring-border"}`}>
                    {(allCategoryImageUrl || FLOWER_BOUQUET_ICON) ? (
                      <img src={allCategoryImageUrl || FLOWER_BOUQUET_ICON} alt="All" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${activeCategoryId === "all" ? "bg-primary" : "bg-primary/10"}`}>
                        <Flower2 className={`h-4 w-4 ${activeCategoryId === "all" ? "text-white" : "text-primary/60"}`} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[8px] font-medium leading-tight text-center ${activeCategoryId === "all" ? "text-primary font-semibold" : "text-muted-foreground"}`}>All</span>
                </button>
                {categories?.map((category) => {
                  const imgSrc = category.imageUrl || categoryImageMap[category.id] || null;
                  const isActive = activeCategoryId === category.id;
                  return (
                    <button
                      key={category.id}
                      data-testid={`category-chip-left-${category.id}`}
                      onClick={() => setActiveCategoryId(category.id)}
                      className={`flex flex-col items-center gap-1 py-2 px-0.5 rounded-xl transition-colors ${isActive ? "bg-primary/10" : ""}`}
                    >
                      <div className={`w-10 h-10 rounded-full overflow-hidden ${isActive ? "ring-2 ring-primary ring-offset-1 shadow-sm shadow-primary/20" : "ring-1 ring-border"}`}>
                        {imgSrc ? (
                          <img src={imgSrc} alt={category.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${isActive ? "bg-primary" : "bg-primary/10"}`}>
                            <span className={`text-sm font-bold ${isActive ? "text-white" : "text-primary/60"}`}>{category.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[8px] font-medium leading-tight text-center w-14 truncate ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>{category.name}</span>
                    </button>
                  );
                })}
              </div>
              {/* Right products area */}
              <div className="flex-1 min-w-0 pl-3 pr-4 pt-2">
                {!isAllView && totalCount > 0 && (
                  <p className="text-[10px] text-muted-foreground mb-3" data-testid="text-product-count-mobile">
                    Showing {loadedCount} of {totalCount}
                  </p>
                )}
                {isAllView ? groupedView : productGrid}
              </div>
            </div>
          ) : (
            <>
              {/* Shop by Category */}
              <section className="mb-5 -mx-4">
                <div className="flex items-center justify-between mb-3 px-4">
                  <h2 className="text-[15px] font-semibold">Shop by Category</h2>
                  <button className="text-[11px] font-semibold text-primary" onClick={() => document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth", block: "start" })}>See All</button>
                </div>
                {categoryCircles}
              </section>

              {/* Best Sellers */}
              <section className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[15px] font-semibold">Best Sellers</h2>
                  <button className="text-[11px] font-semibold text-primary" onClick={() => { setSelectedBadges(["Best Seller"]); document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>See All</button>
                </div>
                {allGroupedLoading ? (
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="shrink-0 w-[118px] flex flex-col gap-2">
                        <Skeleton className="w-full aspect-square rounded-xl" />
                        <Skeleton className="h-3 w-3/4 rounded-md" />
                        <Skeleton className="h-3 w-1/2 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : bestSellerProducts.length > 0 ? (
                  <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
                    {bestSellerProducts.map(product => (
                      <div key={product.id} className="snap-start shrink-0 w-[118px]">
                        <ProductCard product={product} />
                      </div>
                    ))}
                    <div className="shrink-0 w-4" />
                  </div>
                ) : null}
              </section>

              {/* Features strip */}
              <section className="mb-5 -mx-4">
                <div className="grid grid-cols-4 bg-muted/30 border-y border-border/40 py-4 px-1">
                  {([
                    { imgSrc: BOUQUET_ICON, label: "Fresh &\nPremium" },
                    { icon: Truck, label: "Same-Day\nDelivery" },
                    { icon: ShieldCheck, label: "Secure\nPayment" },
                    { icon: Headphones, label: "Customer\nCare" },
                  ] as const).map((item) => (
                    <div key={item.label} className="flex flex-col items-center text-center px-0.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1.5 overflow-hidden">
                        {'imgSrc' in item
                          ? <img src={item.imgSrc} alt={item.label} className="h-full w-full object-cover" />
                          : <item.icon className="h-3.5 w-3.5 text-primary" />
                        }
                      </div>
                      <p className="text-[8.5px] font-semibold leading-tight text-foreground whitespace-pre-line">{item.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Special Offers */}
              {(offersLoading || offerSlides.length > 0) && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <h2 className="text-[15px] font-semibold" data-testid="text-mobile-special-offers">Special Offers</h2>
                  <button className="text-[11px] font-semibold text-primary" data-testid="button-see-all-offers" onClick={() => document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth", block: "start" })}>See All</button>
                </div>
                {offersLoading ? (
                  <div className="rounded-2xl overflow-hidden shadow-md border border-primary/5 min-h-[112px] grid grid-cols-[1fr_118px]">
                    <div className="p-4 flex flex-col gap-2 justify-center">
                      <Skeleton className="h-2.5 w-24 rounded-md" />
                      <Skeleton className="h-4 w-40 rounded-md" />
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-7 w-20 rounded-full mt-1" />
                    </div>
                    <Skeleton className="rounded-l-[48px] h-full w-full" />
                  </div>
                ) : (
                <>
                <div
                  className="relative overflow-hidden rounded-2xl bg-white shadow-md border border-primary/5 min-h-[112px]"
                  onMouseEnter={() => { slideHovered.current = true; }}
                  onMouseLeave={() => { slideHovered.current = false; }}
                  data-testid="carousel-mobile-offers"
                >
                  <AnimatePresence mode="wait">
                    {offerSlides.map((slide, i) => i === activeSlide && (
                      <motion.div
                        key={slide.id}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="grid grid-cols-[1fr_118px] items-stretch"
                      >
                        <div className={`absolute -right-4 -top-6 h-36 w-36 rounded-full ${slide.styles.decorBg}`} />
                        <div className="p-4 pr-1 relative">
                          <p className={`text-[9px] mb-1 font-medium ${slide.styles.labelColor}`} data-testid="text-mobile-todays-offer">{slide.label}</p>
                          <h3 className="text-base font-bold leading-tight mb-1 font-sans" data-testid="text-mobile-offer-title">{slide.title}</h3>
                          <div className="flex items-end gap-1 mb-2">
                            <span className="text-xs text-muted-foreground">Up to</span>
                            <span className="text-2xl font-black leading-none text-foreground">{Number(slide.discountPercentage).toLocaleString()}</span>
                            <span className={`text-sm font-bold leading-none ${slide.styles.accentColor}`}>% Off</span>
                          </div>
                          <Button size="sm" onClick={() => handleOfferAction(slide)} className="h-7 rounded-full bg-primary hover:bg-primary/90 px-4 text-[10px] font-bold" data-testid="button-mobile-order-now">
                            {slide.buttonText}
                          </Button>
                        </div>
                        <div className="relative overflow-hidden rounded-l-[48px]">
                          <img src={slide.imageUrl} alt={slide.label} className="h-full w-full object-cover" data-testid="img-mobile-special-offer" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="mt-3 flex justify-center gap-1.5">
                  {offerSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${i === activeSlide ? "w-5 bg-primary" : "w-2 bg-muted"}`}
                      data-testid={`button-slide-dot-${i}`}
                    />
                  ))}
                </div>
                </>
                )}
              </section>
              )}

              {/* All products */}
              <section className="mb-12" id="all-products">{isAllView ? groupedView : productGrid}</section>
            </>
          )}
        </main>

        {mobileFilterSheet}

        <AnimatePresence>
          {activeFilterCount > 0 && !showFilter && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-[64px] left-1/2 -translate-x-1/2 z-30 w-full max-w-[430px] px-4 pb-2 pointer-events-none"
            >
              <div className="bg-white/95 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 overflow-x-auto hide-scrollbar pointer-events-auto">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
                {minPrice !== "" && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0">
                    Min ₱{minPrice}
                    <button onClick={() => setMinPrice("")}><X className="h-2.5 w-2.5" /></button>
                  </span>
                )}
                {maxPrice !== "" && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0">
                    Max ₱{maxPrice}
                    <button onClick={() => setMaxPrice("")}><X className="h-2.5 w-2.5" /></button>
                  </span>
                )}
                {selectedBadges.map(badge => (
                  <span key={badge} className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0">
                    {badge}
                    <button onClick={() => toggleBadge(badge)}><X className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
                <button onClick={clearFilters} className="text-[10px] text-muted-foreground underline shrink-0 ml-1">Clear</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 z-40 bg-white border-t border-x border-border/70 px-4 pt-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] w-full max-w-[430px] transition-transform duration-300",
          hasScrolled ? "translate-y-0" : "translate-y-full"
        )}>
          <div className="grid grid-cols-3 gap-1 text-[9px] text-muted-foreground">
            <Link href="/" className="flex flex-col items-center gap-1 text-primary font-semibold" data-testid="link-bottom-home">
              <HomeIcon className="h-5 w-5 fill-primary/10" />
              <span>Home</span>
            </Link>
            <Link href="/track" className="flex flex-col items-center gap-1" data-testid="link-bottom-track">
              <PackageCheck className="h-5 w-5" />
              <span>Track</span>
            </Link>
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`flex flex-col items-center gap-1 relative ${showFilter ? "text-primary font-semibold" : ""}`}
              data-testid="button-bottom-filter"
            >
              <div className="relative">
                <SlidersHorizontal className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-primary text-white text-[7px] flex items-center justify-center font-bold">{activeFilterCount}</span>
                )}
              </div>
              <span>Filter</span>
            </button>
          </div>
        </nav>
      </div>
      <div className="hidden md:block min-h-screen pb-16">

        <main className="w-full px-6 xl:px-10 pt-6">
          {/* Search bar for desktop (appears after hero) */}
          <section className="mb-8">
            <div className="flex gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search bouquets..."
                  className="h-12 rounded-xl border-border/60 bg-white text-foreground pl-12 pr-4 shadow-sm"
                  data-testid="input-search-desktop"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className={`h-12 w-12 rounded-xl relative border-border/60 ${showFilter ? "bg-primary text-white border-primary" : ""}`}
                onClick={() => setShowFilter(v => !v)}
                data-testid="button-desktop-filter-top"
              >
                <SlidersHorizontal className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">{activeFilterCount}</span>
                )}
              </Button>
            </div>
            {filterPanel}
            {activeFiltersStrip}
          </section>

          {offerSlides.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" data-testid="text-desktop-special-offers">Special Offers</h2>
              <button className="text-sm font-semibold text-primary" data-testid="button-desktop-see-all-offers" onClick={() => document.getElementById("recommended-products")?.scrollIntoView({ behavior: "smooth", block: "start" })}>See All</button>
            </div>
            <div
              className="relative overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-primary/10 border border-primary/5"
              onMouseEnter={() => { slideHovered.current = true; }}
              onMouseLeave={() => { slideHovered.current = false; }}
              data-testid="carousel-desktop-offers"
            >
              <AnimatePresence mode="wait">
                {offerSlides.map((slide, i) => i === activeSlide && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="grid lg:grid-cols-[1fr_420px] items-stretch min-h-[280px]"
                  >
                    <div className={`absolute -right-16 -top-20 h-72 w-72 rounded-full ${slide.styles.decorBg}`} />
                    <div className="p-10 flex flex-col justify-center relative">
                      <p className={`text-sm mb-2 font-medium ${slide.styles.labelColor}`} data-testid="text-desktop-todays-offer">{slide.label}</p>
                      <h3 className="font-serif text-5xl mb-4" data-testid="text-desktop-offer-title">{slide.title}</h3>
                      <div className="flex items-end gap-2 mb-6">
                        <span className="text-lg text-muted-foreground">Up to</span>
                        <span className="text-5xl font-black leading-none text-foreground">{Number(slide.discountPercentage).toLocaleString()}</span>
                        <span className={`text-2xl font-bold leading-none ${slide.styles.accentColor}`}>% Off</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button onClick={() => handleOfferAction(slide)} className="w-fit rounded-full bg-primary hover:bg-primary/90 px-10" data-testid="button-desktop-order-now">
                          {slide.buttonText}
                        </Button>
                        <div className="flex gap-1.5">
                          {offerSlides.map((_, di) => (
                            <button
                              key={di}
                              onClick={() => setActiveSlide(di)}
                              className={`h-2 rounded-full transition-all duration-300 ${di === activeSlide ? "w-5 bg-primary" : "w-2 bg-muted"}`}
                              data-testid={`button-desktop-slide-dot-${di}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-l-[80px] min-h-[280px]">
                      <img src={slide.imageUrl} alt={slide.label} className="h-full w-full object-cover" data-testid="img-desktop-special-offer" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
          )}

          <section id="recommended-products" className="mb-8">
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-serif text-4xl" data-testid="text-desktop-recommended">Recommended For You</h2>
              {!isAllView && totalCount > 0 && (
                <p className="text-sm text-muted-foreground pb-1" data-testid="text-product-count-desktop">
                  Showing {loadedCount} of {totalCount} arrangement{totalCount !== 1 ? "s" : ""}
                </p>
              )}
              {isAllView && allGroupedProducts && allGroupedProducts.length > 0 && (
                <p className="text-sm text-muted-foreground pb-1" data-testid="text-product-count-all-desktop">
                  {allGroupedProducts.length} arrangement{allGroupedProducts.length !== 1 ? "s" : ""} · {groupedSections.length} section{groupedSections.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {categoryLayout !== "left" && <div className="mb-6">{categoryCircles}</div>}
          </section>

          {categoryLayout === "left" ? (
            <div className="flex gap-0">
              {/* Desktop left sidebar */}
              <div className="w-[100px] xl:w-[120px] shrink-0 flex flex-col gap-1 pr-3 border-r border-border/40 sticky top-8 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
                <button
                  data-testid="category-chip-desktop-left-all"
                  onClick={() => setActiveCategoryId("all")}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-colors ${activeCategoryId === "all" ? "bg-primary/10" : "hover:bg-muted/50"}`}
                >
                  <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center ${activeCategoryId === "all" ? "ring-2 ring-primary ring-offset-1 shadow-sm shadow-primary/20" : "ring-1 ring-border"}`}>
                    {(allCategoryImageUrl || FLOWER_BOUQUET_ICON) ? (
                      <img src={allCategoryImageUrl || FLOWER_BOUQUET_ICON} alt="All" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${activeCategoryId === "all" ? "bg-primary" : "bg-primary/10"}`}>
                        <Flower2 className={`h-5 w-5 ${activeCategoryId === "all" ? "text-white" : "text-primary/60"}`} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight text-center ${activeCategoryId === "all" ? "text-primary font-semibold" : "text-muted-foreground"}`}>All</span>
                </button>
                {categories?.map((category) => {
                  const imgSrc = category.imageUrl || categoryImageMap[category.id] || null;
                  const isActive = activeCategoryId === category.id;
                  return (
                    <button
                      key={category.id}
                      data-testid={`category-chip-desktop-left-${category.id}`}
                      onClick={() => setActiveCategoryId(category.id)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-colors ${isActive ? "bg-primary/10" : "hover:bg-muted/50"}`}
                    >
                      <div className={`w-12 h-12 rounded-full overflow-hidden ${isActive ? "ring-2 ring-primary ring-offset-1 shadow-sm shadow-primary/20" : "ring-1 ring-border"}`}>
                        {imgSrc ? (
                          <img src={imgSrc} alt={category.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${isActive ? "bg-primary" : "bg-primary/10"}`}>
                            <span className={`text-base font-bold ${isActive ? "text-white" : "text-primary/60"}`}>{category.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium leading-tight text-center w-full truncate px-1 ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>{category.name}</span>
                    </button>
                  );
                })}
              </div>
              {/* Right products */}
              <div className="flex-1 min-w-0 pl-6">
                {isAllView ? groupedView : productGrid}
              </div>
            </div>
          ) : (
            <section>{isAllView ? groupedView : productGrid}</section>
          )}
        </main>
      </div>
      <StoreFooter />
    </div>
  );
}
