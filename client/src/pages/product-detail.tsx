import { useProduct } from "@/hooks/use-products";
import { useProductVariants } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useParams } from "wouter";
import { Loader2, ShoppingBag, ArrowLeft, X, Check, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@shared/schema";

function parseSwatch(colorHex: string) {
  const parts = colorHex.split(",").map(c => c.trim()).filter(Boolean);
  return { mixed: parts.length >= 2, colors: parts };
}

function isLightColor(hex: string): boolean {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: product, isLoading } = useProduct(slug || "");
  const { data: variants = [] } = useProductVariants(product?.id);
  const { addItem } = useCart();
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const hasVariants = variants.length > 0;

  const productImages = product?.images?.length
    ? product.images
    : ["https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop"];

  // When a variant has its own image, show that. Otherwise use the product image gallery.
  const variantHasOwnImage = !!(selectedVariant?.imageUrl);
  const displayImage = variantHasOwnImage
    ? selectedVariant!.imageUrl!
    : (productImages[selectedImageIndex] || productImages[0]);

  // Thumbnails only shown when no variant-specific image is active
  const showThumbnails = !variantHasOwnImage && productImages.length > 1;

  const effectiveStock = selectedVariant
    ? selectedVariant.stock
    : (product?.stock ?? 0);

  const effectivePrice = selectedVariant?.price
    ? Number(selectedVariant.price)
    : (product ? Number(product.price) : 0);

  const isOutOfStock = effectiveStock <= 0;
  const canAddToCart = !isOutOfStock && (!hasVariants || selectedVariant !== null);

  const handleAddToCart = () => {
    if (!product || !canAddToCart) return;
    addItem(product, 1, selectedVariant ?? undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="font-serif text-4xl mb-6 italic">Arrangement Not Found</h1>
        <p className="text-muted-foreground mb-10 max-w-md">The floral masterpiece you are looking for is currently unavailable in our boutique.</p>
        <Link href="/">
          <Button variant="outline" className="rounded-none border-primary text-primary px-8 uppercase tracking-widest text-xs h-12">
            Return to Boutique
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-accent/30">
      <Navbar />
      <main className="container mx-auto px-4 pt-[90px] pb-20">
        <div className="mb-8">
          <Link href="/" className="group inline-flex items-center text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to Collection
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start max-w-6xl mx-auto">
          {/* ── Left column: Image Gallery ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full space-y-3"
          >
            {/* Main image */}
            <div
              className="aspect-square bg-muted overflow-hidden relative cursor-zoom-in group"
              onClick={() => setShowImageModal(true)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={displayImage}
                  src={displayImage}
                  alt={selectedVariant ? `${product.name} - ${selectedVariant.colorName}` : product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </AnimatePresence>

              {/* Badge */}
              {product.badges && product.badges.length > 0 && (
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-md text-foreground px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold shadow-sm">
                    {product.badges[0]}
                  </span>
                </div>
              )}

              {/* Zoom hint */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-black/50 backdrop-blur-sm text-white/80 px-2.5 py-1.5 text-[9px] uppercase tracking-widest flex items-center gap-1.5 rounded-sm">
                  <ZoomIn className="h-3 w-3" /> Zoom
                </span>
              </div>
            </div>

            {/* Thumbnail strip — only when the active variant has no own image */}
            <AnimatePresence>
              {showThumbnails && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-2 overflow-x-auto pb-1"
                >
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      data-testid={`thumbnail-${idx}`}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={cn(
                        "flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-all duration-200 rounded-sm",
                        selectedImageIndex === idx
                          ? "border-primary opacity-100 shadow-sm"
                          : "border-transparent opacity-50 hover:opacity-80 hover:border-primary/30"
                      )}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Color Variants */}
            {hasVariants && (
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between pt-2">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Color</h4>
                  <AnimatePresence mode="wait">
                    {selectedVariant ? (
                      <motion.span
                        key={selectedVariant.colorName}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary"
                      >
                        {selectedVariant.colorName}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="prompt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] text-muted-foreground italic"
                      >
                        Select a color to add to cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-wrap gap-3">
                  {variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const variantOos = variant.stock <= 0;
                    const swatch = parseSwatch(variant.colorHex);
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        data-testid={`color-swatch-${variant.id}`}
                        onClick={() => setSelectedVariant(isSelected ? null : variant)}
                        disabled={variantOos}
                        title={`${variant.colorName}${variantOos ? " (Out of Stock)" : ""}`}
                        className={cn(
                          "relative h-9 w-9 rounded-full overflow-hidden transition-all duration-200 focus:outline-none",
                          isSelected
                            ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-md"
                            : "ring-1 ring-border hover:ring-2 hover:ring-primary/50 hover:scale-105",
                          variantOos && "opacity-40 cursor-not-allowed"
                        )}
                        style={swatch.mixed ? {} : { backgroundColor: variant.colorHex }}
                      >
                        {swatch.mixed && (
                          <>
                            <span className="absolute inset-y-0 left-0 w-1/2" style={{ backgroundColor: swatch.colors[0] }} />
                            <span className="absolute inset-y-0 right-0 w-1/2" style={{ backgroundColor: swatch.colors[1] }} />
                          </>
                        )}
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center z-10">
                            <Check
                              className="h-4 w-4 drop-shadow-md"
                              style={{ color: isLightColor(variant.colorHex.split(",")[0]) ? "#111" : "#fff" }}
                            />
                          </span>
                        )}
                        {variantOos && (
                          <span className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="block w-[60%] h-px bg-foreground/50 rotate-45" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Right column: Product Info ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col h-full justify-between"
          >
            <div className="space-y-6">
              {/* Title block */}
              <div className="border-b border-border pb-6">
                <span className="text-luxury mb-2 block">Signature Arrangement</span>
                <h1 className="font-serif text-4xl md:text-5xl mb-4 leading-tight text-foreground">{product.name}</h1>
                <p className="text-2xl font-light tracking-tight text-foreground">
                  ₱{effectivePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground mb-3">The Narrative</h4>
                <div className="text-muted-foreground leading-relaxed font-light tracking-wide text-base whitespace-pre-wrap">
                  {product.description || "An exquisite blend of nature's finest offerings, handcrafted by our master florists to convey your deepest sentiments with grace and sophistication."}
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between py-3 border-y border-border/50">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Availability</span>
                <span className={cn(
                  "text-[10px] uppercase tracking-[0.2em] font-bold",
                  !isOutOfStock ? "text-primary" : "text-destructive"
                )}>
                  {!isOutOfStock
                    ? (effectiveStock > 10 ? "In Stock" : `Limited — ${effectiveStock} Left`)
                    : "Temporarily Sold Out"}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4 pt-6">
              <Button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                data-testid="button-add-to-bag"
                className="w-full rounded-none bg-primary text-primary-foreground hover:bg-accent py-8 uppercase tracking-[0.3em] text-xs font-bold transition-all duration-500 border-none shadow-xl disabled:opacity-50"
              >
                <ShoppingBag className="mr-3 h-4 w-4" />
                {hasVariants && !selectedVariant
                  ? "Select a Color First"
                  : isOutOfStock
                  ? "Sold Out"
                  : "Add to Shopping Bag"}
              </Button>

              <p className="text-[9px] text-center text-muted-foreground uppercase tracking-[0.2em] italic font-light">
                Complimentary luxury packaging included with every order.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="bg-primary text-primary-foreground/40 py-12 mt-20 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em]">Liceria rose flower shop</p>
        </div>
      </footer>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10 cursor-zoom-out"
            onClick={() => setShowImageModal(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-none h-12 w-12 z-[110]"
              onClick={(e) => { e.stopPropagation(); setShowImageModal(false); }}
            >
              <X className="h-6 w-6" />
            </Button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl max-h-full w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={displayImage}
                alt={product.name}
                className="max-w-full max-h-full object-contain shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
