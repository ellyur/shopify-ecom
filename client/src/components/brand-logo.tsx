import { Flower2 } from "lucide-react";
import { usePublicSettings } from "@/hooks/use-products";
import { getBrandSettings, loadCachedBrandSettings, DEFAULT_BRAND_SETTINGS } from "@/lib/brand";

export function BrandLogo({ className = "h-16 w-auto", showFallbackText = false, onDark = false, forceWhite }: { className?: string; showFallbackText?: boolean; onDark?: boolean; forceWhite?: boolean }) {
  const { data: settings, isLoading } = usePublicSettings();

  const brand = settings
    ? getBrandSettings(settings)
    : (loadCachedBrandSettings() ?? DEFAULT_BRAND_SETTINGS);

  const applyWhite = forceWhite ?? brand.logoWhite;

  if (isLoading && !loadCachedBrandSettings()) {
    return (
      <div className="flex items-center gap-2" data-testid="logo-brand-loading">
        <Flower2 className={`h-6 w-6 ${onDark ? "text-white" : "text-primary"}`} />
        {showFallbackText && <span className={`font-serif text-2xl font-bold tracking-tight ${onDark ? "text-white" : "text-foreground"}`}>Liceria</span>}
      </div>
    );
  }

  if (brand.logoUrl) {
    return (
      <img
        src={brand.logoUrl}
        alt="Logo"
        className={`${className} object-contain`}
        style={applyWhite ? { filter: "brightness(0) invert(1)" } : undefined}
        data-testid="img-brand-logo"
      />
    );
  }

  return (
    <div className="flex items-center gap-2" data-testid="logo-brand-fallback">
      <Flower2 className={`h-6 w-6 ${onDark ? "text-white" : "text-primary"}`} />
      {showFallbackText && <span className={`font-serif text-2xl font-bold tracking-tight ${onDark ? "text-white" : "text-foreground"}`}>Liceria</span>}
    </div>
  );
}
