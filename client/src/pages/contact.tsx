import { Navbar } from "@/components/navbar";
import { StoreFooter } from "@/components/store-footer";
import { getFooterSettings } from "@/components/store-footer";
import { usePublicSettings } from "@/hooks/use-products";
import { Phone, Mail, MapPin, Clock, Heart } from "lucide-react";
import { SiFacebook, SiInstagram } from "react-icons/si";

const HERO_IMG   = "https://res.cloudinary.com/caytgopc/image/upload/v1782971584/ChatGPT_Image_Jul_2_2026_01_50_36_PM_1_hbvutp.jpg";
const STORE_IMG  = "https://res.cloudinary.com/caytgopc/image/upload/v1782969845/Storefront_Extracted_ucqjjb.jpg";
const BOTTOM_IMG = "https://res.cloudinary.com/caytgopc/image/upload/v1782971584/ChatGPT_Image_Jul_2_2026_01_52_07_PM_1_lixtsz.jpg";

const DEFAULT_HOURS = [
  { day: "Monday – Friday", time: "8:00 AM – 7:00 PM" },
  { day: "Saturday",        time: "8:00 AM – 6:00 PM" },
  { day: "Sunday",          time: "9:00 AM – 5:00 PM" },
];

function Sprig() {
  return (
    <svg width="56" height="10" viewBox="0 0 56 10" fill="none" className="text-foreground/40 my-2">
      <path d="M2 5 Q6 1 10 5 Q6 9 2 5Z" fill="currentColor" />
      <line x1="12" y1="5" x2="22" y2="5" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="28" cy="5" r="1.8" fill="currentColor" />
      <line x1="34" y1="5" x2="44" y2="5" stroke="currentColor" strokeWidth="0.8" />
      <path d="M54 5 Q50 1 46 5 Q50 9 54 5Z" fill="currentColor" />
    </svg>
  );
}

function Row({ icon: Icon, label, children }: {
  icon: React.ElementType; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="shrink-0 w-8 h-8 rounded-full border border-border/70 flex items-center justify-center mt-0.5">
        <Icon className="h-3.5 w-3.5 text-foreground/60" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function Contact() {
  const { data: settings = [] } = usePublicSettings();
  const footer    = getFooterSettings(settings);
  const storeName = settings.find(s => s.key === "store_name")?.value || "Our Boutique";

  const hoursLines = footer.hours
    ? footer.hours.split("\n").filter(Boolean).map(line => {
        const i = line.indexOf(":");
        return { day: line.slice(0, i).trim(), time: line.slice(i + 1).trim() };
      })
    : DEFAULT_HOURS;

  const socials = [
    footer.instagram && { icon: SiInstagram, label: "Instagram", href: footer.instagram },
    footer.facebook  && { icon: SiFacebook,  label: "Facebook",  href: footer.facebook  },
  ].filter(Boolean) as { icon: React.ElementType; label: string; href: string }[];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative w-full" style={{ marginTop: 56, minHeight: 360, overflow: "hidden" }}>
        <img
          src={HERO_IMG}
          alt="Contact us"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "70% center" }}
        />
        {/* gradient: left 50% fully opaque cream, fades to transparent */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.90) 30%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0.0) 62%)"
        }} />

        {/* text block — strictly half width */}
        <div className="absolute inset-0 flex flex-col justify-start" style={{ minHeight: 360 }}>
          <div className="pt-5 pl-4" style={{ width: "50%", maxWidth: "50%" }}>
            <h1 className="font-serif font-bold uppercase text-foreground leading-[0.95] mb-1.5"
                style={{ fontSize: "clamp(24px, 8vw, 42px)" }}>
              Contact Us
            </h1>
            <p className="font-serif italic text-foreground/80"
               style={{ fontSize: "clamp(11px, 3.2vw, 16px)" }}>
              We'd love to hear from you.
            </p>
            <Sprig />
            <p className="text-foreground/70 leading-snug"
               style={{ fontSize: "clamp(9px, 2.5vw, 12px)" }}>
              Have a question, special request, or need help with your order?
              Our team is here to assist you anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ── GET IN TOUCH ── */}
      <section className="px-4 pt-6 pb-4 w-full max-w-lg mx-auto">
        {/* centered header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-foreground whitespace-nowrap">
            Get in Touch
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* 57/43 split — more room for contact info */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "57% 1fr" }}>

          {/* LEFT — stacked contact rows */}
          <div className="space-y-3.5">
            {footer.phone && (
              <Row icon={Phone} label="Phone">
                <p className="font-bold text-foreground leading-tight"
                   style={{ fontSize: "clamp(10px, 2.8vw, 13px)", wordBreak: "break-word" }}>
                  {footer.phone}
                </p>
                <p className="text-muted-foreground" style={{ fontSize: "clamp(8px, 2.2vw, 10px)" }}>
                  Mon – Sun, 8:00 AM – 7:00 PM
                </p>
              </Row>
            )}

            {footer.email && (
              <Row icon={Mail} label="Email">
                <p className="font-bold text-foreground leading-tight"
                   style={{ fontSize: "clamp(9px, 2.5vw, 12px)", wordBreak: "break-all" }}>
                  {footer.email}
                </p>
                <p className="text-muted-foreground" style={{ fontSize: "clamp(8px, 2.2vw, 10px)" }}>
                  We'll respond as soon as possible.
                </p>
              </Row>
            )}

            {footer.address && (
              <Row icon={MapPin} label="Address">
                <p className="text-foreground leading-snug"
                   style={{ fontSize: "clamp(9px, 2.5vw, 12px)" }}>
                  {footer.address}
                </p>
              </Row>
            )}

            <Row icon={Clock} label="Business Hours">
              <div className="space-y-0.5">
                {hoursLines.map((h, i) => (
                  <div key={i} className="flex gap-1 justify-between">
                    <span className="text-foreground shrink-0" style={{ fontSize: "clamp(8px, 2.2vw, 11px)" }}>
                      {h.day}
                    </span>
                    <span className="text-foreground whitespace-nowrap" style={{ fontSize: "clamp(8px, 2.2vw, 11px)" }}>
                      {h.time}
                    </span>
                  </div>
                ))}
              </div>
            </Row>
          </div>

          {/* RIGHT — store photo + map */}
          <div className="flex flex-col gap-2">
            <div className="rounded-md overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <img src={STORE_IMG} alt="Our store" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 rounded-md overflow-hidden border border-border/30 bg-stone-50"
                 style={{ minHeight: 90 }}>
              {footer.address ? (
                <iframe
                  title="Store map"
                  width="100%" height="100%"
                  style={{ border: 0, minHeight: 90, display: "block" }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(footer.address)}&output=embed`}
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center text-muted-foreground/30"
                     style={{ minHeight: 90 }}>
                  <MapPin className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOLLOW US ── */}
      {socials.length > 0 && (
        <section className="px-4 py-5 w-full max-w-lg mx-auto border-t border-border/30">
          <div className="flex items-start justify-between gap-4">
            <div className="shrink-0">
              <p className="font-serif font-bold uppercase text-foreground leading-none"
                 style={{ fontSize: "clamp(16px, 5vw, 24px)" }}>
                Follow Us
              </p>
              <Sprig />
              <p className="text-muted-foreground leading-relaxed"
                 style={{ fontSize: "clamp(8px, 2.3vw, 11px)", maxWidth: 140 }}>
                Stay inspired with fresh blooms and flower care tips.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-end">
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                   className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center
                                  group-hover:border-primary/50 transition-colors">
                    <s.icon className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span className="text-muted-foreground" style={{ fontSize: "clamp(7px, 2vw, 9px)" }}>
                    {s.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BOTTOM IMAGE ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 200 }}>
        <img src={BOTTOM_IMG} alt="Closing" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(28,46,28,0.72)" }} />
        <div className="relative z-10 flex flex-col justify-center h-full px-6 py-10" style={{ minHeight: 200 }}>
          <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center mb-3">
            <Heart className="h-4 w-4 text-white/80" />
          </div>
          <p className="font-serif italic text-white leading-snug mb-1"
             style={{ fontSize: "clamp(14px, 4vw, 20px)", maxWidth: 240 }}>
            We can't wait to create something beautiful for you.
          </p>
          <p className="font-serif italic text-white/65"
             style={{ fontSize: "clamp(10px, 2.8vw, 13px)" }}>
            Thank you for choosing {storeName}.
          </p>
        </div>
      </section>

      <div className="-mt-12">
        <StoreFooter />
      </div>
    </div>
  );
}
