import type { Setting } from "@shared/schema";

export type BrandSettings = {
  primaryColor: string;
  logoUrl: string;
  logoWhite: boolean;
};

export const DEFAULT_LOGO_URL = "";

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  primaryColor: "#9f174f",
  logoUrl: DEFAULT_LOGO_URL,
  logoWhite: false,
};

export function getBrandSettings(settings?: Setting[]): BrandSettings {
  const raw = settings?.find((setting) => setting.key === "brand_settings")?.value;
  if (!raw) return DEFAULT_BRAND_SETTINGS;
  try {
    return { ...DEFAULT_BRAND_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRAND_SETTINGS;
  }
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  const value = parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function hexToHsl(hex: string, saturationOffset = 0, lightnessOffset = 0) {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  let lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }
    hue /= 6;
  }

  const finalSaturation = Math.min(100, Math.max(8, saturation * 100 + saturationOffset));
  const finalLightness = Math.min(98, Math.max(8, lightness * 100 + lightnessOffset));
  return `${Math.round(hue * 360)} ${Math.round(finalSaturation)}% ${Math.round(finalLightness)}%`;
}

const BRAND_CACHE_KEY = "brand_settings_cache";

export function saveCachedBrandSettings(settings: BrandSettings) {
  try {
    localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify(settings));
  } catch {}
}

export function loadCachedBrandSettings(): BrandSettings | null {
  try {
    const raw = localStorage.getItem(BRAND_CACHE_KEY);
    if (!raw) return null;
    return { ...DEFAULT_BRAND_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function applyBrandTheme(settings: BrandSettings) {
  const root = document.documentElement;
  const primary = hexToHsl(settings.primaryColor);
  const accent = hexToHsl(settings.primaryColor, -8, 12);
  const highlight = hexToHsl(settings.primaryColor, 10, 12);

  const { r, g, b } = hexToRgb(settings.primaryColor);
  const hue = Math.round(
    (() => {
      const red = r / 255, green = g / 255, blue = b / 255;
      const max = Math.max(red, green, blue), min = Math.min(red, green, blue);
      if (max === min) return 0;
      const delta = max - min;
      let h = 0;
      if (max === red) h = (green - blue) / delta + (green < blue ? 6 : 0);
      else if (max === green) h = (blue - red) / delta + 2;
      else h = (red - green) / delta + 4;
      return (h / 6) * 360;
    })()
  );
  const sat = Math.round(
    (() => {
      const red = r / 255, green = g / 255, blue = b / 255;
      const max = Math.max(red, green, blue), min = Math.min(red, green, blue);
      const lightness = (max + min) / 2;
      if (max === min) return 0;
      const delta = max - min;
      return (lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)) * 100;
    })()
  );

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--brand-highlight", highlight);

  root.style.setProperty("--secondary", `${hue} ${Math.min(sat, 20)}% 94%`);
  root.style.setProperty("--secondary-foreground", primary);

  // Keep muted/border/foreground neutral — not tinted by brand color
  root.style.setProperty("--muted", "0 0% 96%");
  root.style.setProperty("--muted-foreground", "0 0% 44%");
  root.style.setProperty("--border", "0 0% 88%");
  root.style.setProperty("--input", "0 0% 88%");

  root.style.setProperty("--foreground", "0 0% 12%");
  root.style.setProperty("--card-foreground", "0 0% 12%");
  root.style.setProperty("--popover-foreground", "0 0% 12%");

  root.style.setProperty("--background", "0 0% 100%");
  root.style.setProperty("--card", "0 0% 100%");
  root.style.setProperty("--popover", "0 0% 100%");
}