import { BrandLogo } from "@/components/brand-logo";
import { usePublicSettings } from "@/hooks/use-products";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SiFacebook, SiInstagram } from "react-icons/si";

type FooterSettings = {
  tagline: string;
  address: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  hours: string;
};

const DEFAULT_FOOTER: FooterSettings = {
  tagline: "",
  address: "",
  phone: "",
  email: "",
  facebook: "",
  instagram: "",
  hours: "",
};

export function getFooterSettings(settings: { key: string; value: string }[]): FooterSettings {
  const raw = settings.find(s => s.key === "footer_settings")?.value;
  if (!raw) return DEFAULT_FOOTER;
  try {
    return { ...DEFAULT_FOOTER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FOOTER;
  }
}

export function StoreFooter() {
  const { data: settings = [] } = usePublicSettings();
  const footer = getFooterSettings(settings);

  const hasAnyInfo = footer.address || footer.phone || footer.email || footer.hours;
  const hasSocial = footer.facebook || footer.instagram;

  return (
    <footer className="bg-foreground text-white mt-12 pt-10 pb-28 md:pb-8 px-6 w-full" data-testid="store-footer">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <BrandLogo className="h-20 w-auto" forceWhite data-testid="img-footer-logo" />
            {footer.tagline && (
              <p className="text-white/60 text-sm leading-relaxed" data-testid="text-footer-tagline">
                {footer.tagline}
              </p>
            )}
            {hasSocial && (
              <div className="flex items-center gap-3 pt-1">
                {footer.facebook && (
                  <a
                    href={footer.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    data-testid="link-footer-facebook"
                  >
                    <SiFacebook className="h-4 w-4" />
                  </a>
                )}
                {footer.instagram && (
                  <a
                    href={footer.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    data-testid="link-footer-instagram"
                  >
                    <SiInstagram className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {hasAnyInfo && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Contact & Hours</p>
              {footer.address && (
                <div className="flex items-start gap-2.5 text-white/70 text-sm" data-testid="text-footer-address">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-white/40" />
                  <span>{footer.address}</span>
                </div>
              )}
              {footer.phone && (
                <a href={`tel:${footer.phone}`} className="flex items-center gap-2.5 text-white/70 text-sm hover:text-white transition-colors" data-testid="link-footer-phone">
                  <Phone className="h-4 w-4 shrink-0 text-white/40" />
                  <span>{footer.phone}</span>
                </a>
              )}
              {footer.email && (
                <a href={`mailto:${footer.email}`} className="flex items-center gap-2.5 text-white/70 text-sm hover:text-white transition-colors" data-testid="link-footer-email">
                  <Mail className="h-4 w-4 shrink-0 text-white/40" />
                  <span>{footer.email}</span>
                </a>
              )}
              {footer.hours && (
                <div className="flex items-start gap-2.5 text-white/70 text-sm" data-testid="text-footer-hours">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0 text-white/40" />
                  <span className="whitespace-pre-line">{footer.hours}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Quick Links</p>
            <div className="space-y-2">
              <a href="/" className="block text-white/70 text-sm hover:text-white transition-colors" data-testid="link-footer-home">Home</a>
              <a href="/track" className="block text-white/70 text-sm hover:text-white transition-colors" data-testid="link-footer-track">Track Order</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 text-center">
          <p className="text-white/30 text-xs" data-testid="text-footer-copyright">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
