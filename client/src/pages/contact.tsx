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

function BotanicalDivider() {
  return (
    <div className="flex items-center gap-1.5 my-2">
      <svg width="14" height="10" viewBox="0 0 14 10" className="text-foreground/50">
        <path d="M0 5 Q3 1 7 3 Q3 8 0 5Z" fill="currentColor"/>
        <path d="M14 5 Q11 1 7 3 Q11 8 14 5Z" fill="currentColor"/>
      </svg>
      <div className="h-px w-8 bg-foreground/30" />
      <svg width="8" height="8" viewBox="0 0 8 8" className="text-foreground/50">
        <circle cx="4" cy="4" r="1.5" fill="currentColor"/>
        <path d="M4 0.5 L4.5 2.5 L4 2 L3.5 2.5Z" fill="currentColor"/>
        <path d="M4 7.5 L4.5 5.5 L4 6 L3.5 5.5Z" fill="currentColor"/>
        <path d="M0.5 4 L2.5 3.5 L2 4 L2.5 4.5Z" fill="currentColor"/>
        <path d="M7.5 4 L5.5 3.5 L6 4 L5.5 4.5Z" fill="currentColor"/>
      </svg>
      <div className="h-px w-8 bg-foreground/30" />
      <svg width="14" height="10" viewBox="0 0 14 10" className="text-foreground/50">
        <path d="M0 5 Q3 1 7 3 Q3 8 0 5Z" fill="currentColor"/>
        <path d="M14 5 Q11 1 7 3 Q11 8 14 5Z" fill="currentColor"/>
      </svg>
    </div>
  );
}

function Row({ icon: Icon, label, children }: {
  icon: React.ElementType; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full border border-border/70 flex items-center justify-center mt-0.5">
        <Icon className="h-4 w-4 text-foreground/60" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-0.5">
          {label}
        </p>
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

      {/* ── HERO — 2-column grid (desktop) / stacked (mobile) ── */}
      <section className="grid lg:grid-cols-2" style={{ marginTop: 56, minHeight: 700 }}>

        {/* LEFT — off-white content panel (shows second on mobile) */}
        <div className="order-2 lg:order-1 flex items-center justify-start
                        px-6 py-16 lg:px-16 xl:px-24 bg-[#F9F6F1]">
          <div style={{ maxWidth: 420 }}>
            <h1
              className="font-serif font-bold uppercase text-foreground leading-none mb-3 whitespace-nowrap"
              style={{ fontSize: "clamp(42px, 4.5vw, 62px)" }}
            >
              Contact Us
            </h1>
            <p
              className="font-serif italic text-foreground/75 mb-3"
              style={{ fontSize: "clamp(16px, 1.8vw, 22px)" }}
            >
              We'd love to hear from you.
            </p>
            <BotanicalDivider />
            <p
              className="text-foreground/70 mt-2"
              style={{ fontSize: "clamp(14px, 1.1vw, 16px)", lineHeight: 1.8 }}
            >
              Have a question, special request, or need help with your order?
              Our team is here to assist you anytime.
            </p>
          </div>
        </div>

        {/* RIGHT — floral image with left-bleeding gradient (shows first on mobile) */}
        <div className="order-1 lg:order-2 relative" style={{ minHeight: 360 }}>
          <img
            src={HERO_IMG}
            alt="Contact us"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "70% center" }}
          />
          {/* gradient bleeds left so the panel boundary looks seamless */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F9F6F1] via-[#F9F6F1]/25 to-transparent" />
        </div>

      </section>

      {/* ── GET IN TOUCH ── */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-24 pt-8 pb-6 w-full max-w-6xl mx-auto">
        {/* centered header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground whitespace-nowrap">
            Get in Touch
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* 55 / 45 split */}
        <div className="grid gap-5 md:gap-8" style={{ gridTemplateColumns: "55% 1fr" }}>

          {/* LEFT — contact rows */}
          <div className="space-y-5">
            {footer.phone && (
              <Row icon={Phone} label="Phone">
                <p className="font-bold text-foreground leading-tight"
                   style={{ fontSize: "clamp(13px, 1.5vw, 16px)", wordBreak: "break-word" }}>
                  {footer.phone}
                </p>
                <p className="text-muted-foreground mt-0.5"
                   style={{ fontSize: "clamp(10px, 1.1vw, 13px)" }}>
                  Mon – Sun, 8:00 AM – 7:00 PM
                </p>
              </Row>
            )}

            {footer.email && (
              <Row icon={Mail} label="Email">
                <p className="font-bold text-foreground leading-tight"
                   style={{ fontSize: "clamp(12px, 1.4vw, 16px)", wordBreak: "break-all" }}>
                  {footer.email}
                </p>
                <p className="text-muted-foreground mt-0.5"
                   style={{ fontSize: "clamp(10px, 1.1vw, 13px)" }}>
                  We'll respond as soon as possible.
                </p>
              </Row>
            )}

            {footer.address && (
              <Row icon={MapPin} label="Address">
                <p className="text-foreground leading-snug"
                   style={{ fontSize: "clamp(12px, 1.4vw, 15px)" }}>
                  {footer.address}
                </p>
              </Row>
            )}

            {!footer.phone && !footer.email && !footer.address && (
              <p className="text-muted-foreground text-sm">
                Contact details not configured yet. Visit Admin → Settings → Store Info.
              </p>
            )}

            <Row icon={Clock} label="Business Hours">
              <div className="space-y-1 mt-0.5">
                {hoursLines.map((h, i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <span className="text-foreground" style={{ fontSize: "clamp(11px, 1.3vw, 14px)" }}>
                      {h.day}
                    </span>
                    <span className="text-foreground whitespace-nowrap"
                          style={{ fontSize: "clamp(11px, 1.3vw, 14px)" }}>
                      {h.time}
                    </span>
                  </div>
                ))}
              </div>
            </Row>
          </div>

          {/* RIGHT — store photo + map */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <img src={STORE_IMG} alt="Our store" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-border/30 bg-stone-50"
                 style={{ minHeight: 140 }}>
              {footer.address ? (
                <iframe
                  title="Store map" width="100%" height="100%"
                  style={{ border: 0, minHeight: 140, display: "block" }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(footer.address)}&output=embed`}
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center text-muted-foreground/30"
                     style={{ minHeight: 140 }}>
                  <MapPin className="h-7 w-7" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOLLOW US ── */}
      {socials.length > 0 && (
        <section className="px-4 sm:px-8 md:px-16 lg:px-24 py-6 w-full max-w-6xl mx-auto border-t border-border/30">
          <div className="flex items-start justify-between gap-6">
            <div className="shrink-0">
              <p className="font-serif font-bold uppercase text-foreground leading-none"
                 style={{ fontSize: "clamp(20px, 2.8vw, 32px)" }}>
                Follow Us
              </p>
              <BotanicalDivider />
              <p className="text-muted-foreground leading-relaxed"
                 style={{ fontSize: "clamp(11px, 1.2vw, 14px)", maxWidth: 260 }}>
                Stay inspired with fresh blooms, arrangements, and flower care tips.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap items-center">
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                   className="flex flex-col items-center gap-1.5 group">
                  <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center
                                  group-hover:border-primary/50 transition-colors">
                    <s.icon className="h-5 w-5 text-foreground/70" />
                  </div>
                  <span className="text-muted-foreground text-xs">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BOTTOM IMAGE ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 260 }}>
        <img src={BOTTOM_IMG} alt="Closing" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(28,46,28,0.72)" }} />
        <div className="relative z-10 flex flex-col justify-center h-full py-12"
             style={{ minHeight: 260, paddingLeft: "clamp(16px, 4vw, 80px)" }}>
          <div className="w-10 h-10 rounded-full border border-white/50 flex items-center justify-center mb-4">
            <Heart className="h-5 w-5 text-white/80" />
          </div>
          <p className="font-serif italic text-white leading-snug mb-2"
             style={{ fontSize: "clamp(16px, 2.6vw, 28px)", maxWidth: 440 }}>
            We can't wait to create something beautiful for you.
          </p>
          <p className="font-serif italic text-white/65"
             style={{ fontSize: "clamp(12px, 1.5vw, 18px)" }}>
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
