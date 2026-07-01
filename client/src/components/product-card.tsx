import { type Product } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useProductRating } from "@/hooks/use-ratings";
import { useProductVariants } from "@/hooks/use-products";
import { Link, useLocation } from "wouter";
import { Plus, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";

import fallbackProductImage from "@assets/generated_images/red_violet_special_offer.png";

function parseSwatch(colorHex: string) {
  const parts = colorHex.split(",").map(c => c.trim()).filter(Boolean);
  return { mixed: parts.length >= 2, colors: parts };
}

interface ProductCardProps {
  product: Product;
}

const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-rose-500 text-white",
  "On Sale": "bg-emerald-500 text-white",
  "New Arrival": "bg-sky-500 text-white",
  "Limited Edition": "bg-purple-500 text-white",
  "Most Favorite": "bg-rose-500 text-white",
};

function StarRatingWidget({ productId }: { productId: number }) {
  const { rating, myRating, submitRating, isPending, canRate } = useProductRating(productId);
  const [hovered, setHovered] = useState<number | null>(null);
  const [justVoted, setJustVoted] = useState(false);

  const displayRating = rating?.avgRating ?? 0;
  const count = rating?.count ?? 0;
  const activeStars = hovered ?? myRating ?? 0;

  const handleRate = (e: React.MouseEvent, stars: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending || !canRate) return;
    submitRating(stars);
    setJustVoted(true);
    setTimeout(() => setJustVoted(false), 1500);
  };

  if (!canRate) {
    return (
      <div
        className="flex items-center gap-1"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        data-testid={`rating-widget-${productId}`}
        title="Purchase this product to leave a rating"
      >
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3 w-3 md:h-3.5 md:w-3.5 ${
                star <= Math.round(displayRating)
                  ? "fill-[#f6c343] text-[#f6c343]"
                  : "fill-transparent text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
        <span className="text-[9px] md:text-[10px] text-muted-foreground leading-none">
          {count > 0 ? (
            justVoted ? <span className="text-primary font-semibold">Saved!</span>
              : `${displayRating.toFixed(1)} (${count})`
          ) : "No ratings"}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      data-testid={`rating-widget-${productId}`}
    >
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= activeStars;
          const displayFilled = hovered === null && star <= Math.round(displayRating);
          return (
            <button
              key={star}
              type="button"
              data-testid={`star-${star}-product-${productId}`}
              onMouseEnter={() => setHovered(star)}
              onClick={(e) => handleRate(e, star)}
              disabled={isPending}
              className="p-0 border-none bg-transparent cursor-pointer leading-none disabled:opacity-60"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-3 w-3 md:h-3.5 md:w-3.5 transition-colors duration-100 ${
                  (hovered !== null ? filled : displayFilled)
                    ? "fill-[#f6c343] text-[#f6c343]"
                    : "fill-transparent text-muted-foreground/30"
                }`}
              />
            </button>
          );
        })}
      </div>
      <span className="text-[9px] md:text-[10px] text-muted-foreground leading-none">
        {justVoted ? (
          <span className="text-primary font-semibold">Saved!</span>
        ) : count > 0 ? (
          `${displayRating.toFixed(1)} (${count})`
        ) : (
          "Rate"
        )}
      </span>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const { data: variants = [] } = useProductVariants(product.id);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVariantLocked, setIsVariantLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);

  const allImages = useMemo(() => {
    const imgs: { src: string; variantId: number | null }[] = [];
    if (product.images?.[0]) imgs.push({ src: product.images[0], variantId: null });
    variants.forEach(v => { if (v.imageUrl) imgs.push({ src: v.imageUrl, variantId: v.id }); });
    if (imgs.length === 0) imgs.push({ src: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop", variantId: null });
    return imgs;
  }, [product.images, variants]);

  const imageUrls = useMemo(() => allImages.map((image) => image.src), [allImages]);

  useEffect(() => {
    if (imageUrls.length <= 1 || isPaused || isVariantLocked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCarouselIndex(i => (i + 1) % imageUrls.length);
    }, 2500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [imageUrls.length, isPaused, isVariantLocked]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  const displayImage = (isVariantLocked && selectedVariant?.imageUrl)
    ? selectedVariant.imageUrl
    : (imageUrls[carouselIndex] ?? fallbackProductImage);

  const salePrice = Number(product.price);
  const discountPct = Number(product.discountPercentage ?? 0);
  const originalPrice = discountPct > 0 ? salePrice * (1 + discountPct / 100) : null;
  const badge = product.badges && (product.badges as string[]).length > 0 ? (product.badges as string[])[0] : null;
  const badgeStyle = badge ? (BADGE_STYLES[badge] ?? "bg-primary text-white") : "";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (variants.length > 0 && !selectedVariantId) {
      setLocation(`/product/${product.slug}`);
      return;
    }
    addItem(product, 1, selectedVariant ?? undefined);
  };

  const handleSwatchClick = (e: React.MouseEvent, variantId: number) => {
    e.preventDefault();
    e.stopPropagation();
    didSwipeRef.current = false;
    if (selectedVariantId === variantId) {
      setSelectedVariantId(null);
      setIsVariantLocked(false);
      setCarouselIndex(0);
      return;
    }
    setSelectedVariantId(variantId);
    setIsVariantLocked(true);
    const variantImageIndex = allImages.findIndex((image) => image.variantId === variantId);
    setCarouselIndex(variantImageIndex >= 0 ? variantImageIndex : 0);
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    didSwipeRef.current = false;
    setCarouselIndex(index);
    setSelectedVariantId(allImages[index]?.variantId ?? null);
    setIsVariantLocked(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    didSwipeRef.current = false;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null || imageUrls.length <= 1) return;
    const delta = e.changedTouches[0].clientX - touchStartXRef.current;
    const SWIPE_THRESHOLD = 40;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      didSwipeRef.current = true;
      const nextIndex = delta < 0
        ? (carouselIndex + 1) % imageUrls.length
        : (carouselIndex - 1 + imageUrls.length) % imageUrls.length;
      setCarouselIndex(nextIndex);
      setSelectedVariantId(allImages[nextIndex]?.variantId ?? null);
      setIsVariantLocked(false);
    }
    touchStartXRef.current = null;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (didSwipeRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didSwipeRef.current = false;
    }
  };

  return (
    <>
      <Link href={`/product/${product.slug}`}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="group cursor-pointer block h-full"
          data-testid={`card-product-${product.id}`}
          onMouseEnter={() => {
            setIsPaused(true);
            if (!isVariantLocked && allImages.length > 1) {
              setCarouselIndex(1);
            }
          }}
          onMouseLeave={() => {
            setIsPaused(false);
            if (!isVariantLocked) {
              setCarouselIndex(0);
            }
          }}
        >
          <Card className="border border-border/40 bg-white shadow-sm overflow-hidden rounded-2xl h-full flex flex-col group">
            {/* ── Image area ── */}
            <CardContent
              className="p-0 relative aspect-square md:aspect-[4/5] overflow-hidden bg-white rounded-none mb-0 shadow-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={handleCardClick}
            >
              {/* Product image */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={displayImage}
                  src={displayImage}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="h-full w-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                  data-testid={`img-product-${product.id}`}
                  onError={(event) => {
                    event.currentTarget.src = fallbackProductImage;
                  }}
                />
              </AnimatePresence>


              {/* Out of stock overlay */}
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
                  <span className="text-[11px] uppercase tracking-widest font-bold text-foreground bg-white/80 py-2 px-5 rounded-full shadow-sm">
                    Out of Stock
                  </span>
                </div>
              )}

              {/* Carousel dots — centered bottom */}
              {imageUrls.length > 1 && (
                <div
                  className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-1 pointer-events-auto"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  {imageUrls.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => handleDotClick(e, i)}
                      data-testid={`carousel-dot-${i}-product-${product.id}`}
                      className={`rounded-full transition-all duration-300 ${
                        i === carouselIndex
                          ? "w-4 h-1.5 bg-white"
                          : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Discount badge — top right of image */}
              {discountPct > 0 && (
                <div className="absolute top-2 left-2 z-20 pointer-events-none">
                  <span className="inline-flex items-center py-0.5 px-2 text-[9px] font-black rounded-full bg-red-500 text-white shadow-sm">
                    -{discountPct}%
                  </span>
                </div>
              )}

              {/* Bottom row: Add to cart (right only) */}
              <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 z-20 pointer-events-none">
                {/* Add to cart */}
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  size="icon"
                  data-testid={`button-add-cart-${product.id}`}
                  className="pointer-events-auto rounded-full bg-primary text-white hover:bg-primary/85 active:scale-95 transition-all duration-200 shadow-lg border-none h-8 w-8 md:h-10 md:w-10"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </CardContent>

            {/* ── Info area ── */}
            <CardFooter className="flex flex-col items-start px-2 md:px-3 pt-2 pb-3 bg-transparent gap-0.5">
              {/* Badge — fixed height, no overflow */}
              <div className="h-5 flex items-center overflow-hidden w-full pointer-events-none">
                {badge && (
                  <span className={`inline-flex items-center py-0.5 px-2 text-[8px] md:text-[9px] uppercase tracking-widest font-bold rounded-full ${badgeStyle}`}>
                    {badge}
                  </span>
                )}
              </div>
              {/* Product name — fixed 1 line */}
              <h3
                className="h-5 font-sans text-[11px] md:text-xs font-medium leading-tight truncate text-foreground group-hover:text-primary transition-colors duration-300 w-full"
                data-testid={`text-product-name-${product.id}`}
              >
                {product.name}
              </h3>

              {/* Price + original price — fixed height, same row */}
              <div className="h-5 flex items-center gap-1.5 overflow-hidden w-full">
                <p
                  className="font-bold text-[12px] md:text-sm text-primary leading-none shrink-0"
                  data-testid={`text-product-price-mobile-${product.id}`}
                >
                  ₱{(selectedVariant?.price ? Number(selectedVariant.price) : salePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                {originalPrice && (
                  <p
                    className="text-[9px] md:text-[10px] text-muted-foreground line-through leading-none truncate"
                    data-testid={`text-product-original-price-${product.id}`}
                  >
                    ₱{originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              {/* "You save" — fixed height, truncated */}
              <div className="h-5 flex items-center overflow-hidden w-full">
                {discountPct > 0 && originalPrice && (
                  <span className="inline-flex items-center gap-1 py-0.5 px-2 text-[8px] md:text-[9px] font-semibold rounded-full bg-rose-100 text-rose-600 truncate max-w-full">
                    🏷 You save ₱{(originalPrice - salePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              {/* Star rating — fixed height row */}
              <div className="h-5 flex items-center overflow-hidden w-full">
                <StarRatingWidget productId={product.id} />
              </div>

              {/* Color swatches — below image info */}
              {variants.length > 0 && (
                <div
                  className="flex items-center gap-1 flex-wrap pt-0.5"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  {variants.map((v) => {
                    const sw = parseSwatch(v.colorHex);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        data-testid={`swatch-${v.id}-product-${product.id}`}
                        title={v.colorName}
                        onClick={(e) => handleSwatchClick(e, v.id)}
                        className={`relative h-4 w-4 md:h-5 md:w-5 rounded-full overflow-hidden transition-all duration-200 ${
                          selectedVariantId === v.id
                            ? "ring-2 ring-primary ring-offset-1 scale-125 shadow-md"
                            : "ring-1 ring-border hover:ring-2 hover:ring-primary/50 hover:scale-110"
                        }`}
                        style={sw.mixed ? {} : { backgroundColor: v.colorHex }}
                        aria-label={v.colorName}
                      >
                        {sw.mixed && (
                          <>
                            <span className="absolute inset-y-0 left-0 w-1/2" style={{ backgroundColor: sw.colors[0] }} />
                            <span className="absolute inset-y-0 right-0 w-1/2" style={{ backgroundColor: sw.colors[1] }} />
                          </>
                        )}
                      </button>
                    );
                  })}
                  {selectedVariant && (
                    <span className="text-[9px] md:text-[10px] text-muted-foreground leading-none ml-0.5" data-testid={`text-selected-color-${product.id}`}>
                      {selectedVariant.colorName}
                    </span>
                  )}
                </div>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </Link>

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
              className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full h-12 w-12 z-[110]"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
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
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
