import { Navbar } from "@/components/navbar";
import { StoreFooter } from "@/components/store-footer";
import { getFooterSettings } from "@/components/store-footer";
import { usePublicSettings } from "@/hooks/use-products";
import { Phone, Mail, MapPin, Clock, Heart } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiPinterest } from "react-icons/si";

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
      <div className="h-px w-6 bg-foreground/30" />
      <svg width="8" height="8" viewBox="0 0 8 8" className="text-foreground/50">
        <circle cx="4" cy="4" r="1.5" fill="currentColor"/>
        <path d="M4 0.5 L4.5 2.5 L4 2 L3.5 2.5Z" fill="currentColor"/>
        <path d="M4 7.5 L4.5 5.5 L4 6 L3.5 5.5Z" fill="currentColor"/>
        <path d="M0.5 4 L2.5 3.5 L2 4 L2.5 4.5Z" fill="currentColor"/>
        <path d="M7.5 4 L5.5 3.5 L6 4 L5.5 4.5Z" fill="currentColor"/>
      </svg>
      <div className="h-px w-6 bg-foreground/30" />
      <svg width="14" height="10" viewBox="0 0 14 10" className="text-foreground/50">
        <path d="M0 5 Q3 1 7 3 Q3 8 0 5Z" fill="currentColor"/>
        <path d="M14 5 Q11 1 7 3 Q11 8 14 5Z" fill="currentColor"/>
      </svg>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center mt-0.5">
        <Icon className="h-4 w-4 text-foreground/70" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-0.5">
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
        const colonIdx = line.indexOf(":");
        return { day: line.slice(0, colonIdx).trim(), time: line.slice(colonIdx + 1).trim() };
      })
    : DEFAULT_HOURS;

  const socials = [
    footer.instagram && { icon: SiInstagram, label: "Instagram", sub: `@${storeName.toLowerCase().replace(/\s/g, "")}`, href: footer.instagram },
    footer.facebook  && { icon: SiFacebook,  label: "Facebook",  sub: `/${storeName.replace(/\s/g, "")}`,               href: footer.facebook  },
  ].filter(Boolean) as { icon: React.ElementType; label: string; sub: string; href: string }[];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative w-full overflow-hidden" style={{ marginTop: 56, minHeight: 340 }}>
        <img
          src={HERO_IMG}
          alt="Contact us"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "65% center" }}
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to right, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 38%, rgba(255,255,255,0.15) 65%, transparent 85%)"
        }} />

        <div className="relative z-10" style={{ minHeight: 340 }}>
          <div className="pt-5 pl-4 pr-2" style={{ width: "46%" }}>
            <h1 className="font-serif font-bold uppercase text-foreground leading-none mb-1"
                style={{ fontSize: "clamp(26px, 8.5vw, 40px)" }}>
              Contact Us
            </h1>
            <p className="font-serif italic text-foreground/80 leading-snug mb-1"
               style={{ fontSize: "clamp(12px, 3.5vw, 17px)" }}>
              We'd love to hear from you.
            </p>
            <BotanicalDivider />
            <p className="text-foreground/75 leading-relaxed"
               style={{ fontSize: "clamp(10px, 2.8vw, 13px)" }}>
              Have a question, special request, or need help with your order?
              Our team is here to assist you. Reach out to us anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ── GET IN TOUCH ── */}
      <section className="px-4 pt-7 pb-5 w-full max-w-2xl mx-auto">
        {/* Centered section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground whitespace-nowrap">
            Get in Touch
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* LEFT — contact info */}
          <div className="space-y-4">
            {footer.phone && (
              <ContactRow icon={Phone} label="Phone">
                <a href={`tel:${footer.phone}`}
                   className="font-semibold text-foreground leading-tight block"
                   style={{ fontSize: "clamp(11px, 3vw, 14px)" }}>
                  {footer.phone}
                </a>
                <p className="text-muted-foreground" style={{ fontSize: "clamp(9px, 2.4vw, 11px)" }}>
                  Mon – Sun, 8:00 AM – 7:00 PM
                </p>
              </ContactRow>
            )}

            {footer.email && (
              <ContactRow icon={Mail} label="Email">
                <a href={`mailto:${footer.email}`}
                   className="font-semibold text-foreground break-all leading-tight block"
                   style={{ fontSize: "clamp(10px, 2.7vw, 13px)" }}>
                  {footer.email}
                </a>
                <p className="text-muted-foreground" style={{ fontSize: "clamp(9px, 2.4vw, 11px)" }}>
                  We'll respond as soon as possible.
                </p>
              </ContactRow>
            )}

            {footer.address && (
              <ContactRow icon={MapPin} label="Address">
                <p className="font-semibold text-foreground leading-snug"
                   style={{ fontSize: "clamp(10px, 2.7vw, 13px)" }}>
                  {footer.address}
                </p>
              </ContactRow>
            )}

            {!footer.phone && !footer.email && !footer.address && (
              <p className="text-muted-foreground text-xs">
                Contact details not configured yet. Visit Admin → Settings → Store Info.
              </p>
            )}

            {/* Business Hours */}
            <ContactRow icon={Clock} label="Business Hours">
              <div className="space-y-0.5">
                {hoursLines.map((h, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="text-foreground" style={{ fontSize: "clamp(9px, 2.5vw, 12px)" }}>
                      {h.day}
                    </span>
                    <span className="text-foreground whitespace-nowrap" style={{ fontSize: "clamp(9px, 2.5vw, 12px)" }}>
                      {h.time}
                    </span>
                  </div>
                ))}
              </div>
            </ContactRow>
          </div>

          {/* RIGHT — store photo + map */}
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-lg" style={{ aspectRatio: "4/3" }}>
              <img src={STORE_IMG} alt="Our store" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 rounded-lg overflow-hidden border border-border/40 bg-stone-50"
                 style={{ minHeight: 100 }}>
              {footer.address ? (
                <iframe
                  title="Store map"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 100, display: "block" }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(footer.address)}&output=embed`}
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full gap-1 text-muted-foreground/40"
                     style={{ minHeight: 100 }}>
                  <MapPin className="h-6 w-6" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOLLOW US ── */}
      {socials.length > 0 && (
        <section className="px-4 py-5 w-full max-w-2xl mx-auto border-t border-border/30">
          <div className="grid grid-cols-2 gap-4 items-start">
            {/* Left text */}
            <div>
              <p className="font-serif font-bold uppercase text-foreground leading-none mb-1"
                 style={{ fontSize: "clamp(18px, 5vw, 26px)" }}>
                Follow Us
              </p>
              <BotanicalDivider />
              <p className="text-muted-foreground leading-relaxed"
                 style={{ fontSize: "clamp(9px, 2.5vw, 12px)" }}>
                Stay inspired with fresh blooms, arrangements, and flower care tips.
              </p>
            </div>

            {/* Right social icons */}
            <div className="flex gap-3 flex-wrap">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary/40 group-hover:text-primary transition-colors">
                    <s.icon className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span className="text-foreground/70" style={{ fontSize: "clamp(8px, 2.2vw, 10px)" }}>
                    {s.label}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: "clamp(7px, 1.9vw, 9px)" }}>
                    {s.sub}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BOTTOM IMAGE ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 220 }}>
        <img
          src={BOTTOM_IMG}
          alt="Thank you"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* dark green overlay */}
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(30,50,30,0.70)" }} />

        <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 py-10"
             style={{ minHeight: 220 }}>
          <div className="w-8 h-8 rounded-full border border-white/60 flex items-center justify-center mb-3">
            <Heart className="h-4 w-4 text-white/80" />
          </div>
          <p className="font-serif italic text-white leading-snug mb-1"
             style={{ fontSize: "clamp(14px, 4vw, 20px)", maxWidth: 260 }}>
            We can't wait to create something beautiful for you.
          </p>
          <p className="font-serif italic text-white/70"
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
