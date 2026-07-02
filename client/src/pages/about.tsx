import { Navbar } from "@/components/navbar";
import { StoreFooter } from "@/components/store-footer";
import { getFooterSettings } from "@/components/store-footer";
import { usePublicSettings } from "@/hooks/use-products";
import { Heart, MapPin, Clock, Leaf } from "lucide-react";

const HERO_IMG   = "https://res.cloudinary.com/caytgopc/image/upload/v1782969822/ChatGPT_Image_Jul_2_2026_01_21_13_PM_h6wr9y.jpg";
const STORE_IMG  = "https://res.cloudinary.com/caytgopc/image/upload/v1782969845/Storefront_Extracted_ucqjjb.jpg";
const THANKS_IMG = "https://res.cloudinary.com/caytgopc/image/upload/v1782969832/ChatGPT_Image_Jul_2_2026_01_22_28_PM_pcj4xw.jpg";

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

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

export default function About() {
  const { data: settings = [] } = usePublicSettings();
  const footer   = getFooterSettings(settings);
  const storeName = settings.find(s => s.key === "store_name")?.value || "Our Boutique";

  const hoursLines = footer.hours
    ? footer.hours.split("\n").filter(Boolean).map(line => {
        const colonIdx = line.indexOf(":");
        return {
          day:  line.slice(0, colonIdx).trim(),
          time: line.slice(colonIdx + 1).trim(),
        };
      })
    : DEFAULT_HOURS;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ marginTop: "56px", minHeight: 380 }}
      >
        <img
          src={HERO_IMG}
          alt="About us"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "65% center" }}
        />
        {/* left-to-right fade so text is legible */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to right, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 38%, rgba(255,255,255,0.2) 60%, transparent 80%)"
        }} />

        {/* text block — top-left, 46% wide (capped on desktop) */}
        <div className="relative z-10 h-full" style={{ minHeight: 380 }}>
          <div className="pt-5 pl-4 pr-2" style={{ width: "min(46%, 260px)" }}>
            <h1 className="font-serif font-bold uppercase text-foreground leading-none mb-1"
                style={{ fontSize: "clamp(26px, 8.5vw, 40px)" }}>
              About Us
            </h1>
            <p className="font-serif italic text-foreground/80 leading-snug mb-1"
               style={{ fontSize: "clamp(12px, 3.5vw, 17px)" }}>
              Our story in every bloom.
            </p>
            <BotanicalDivider />
            <p className="text-foreground/75 leading-relaxed mb-2"
               style={{ fontSize: "clamp(10px, 2.8vw, 13px)" }}>
              At {storeName}, flowers are more than just gifts — they are emotions, memories,
              and moments made beautiful.
            </p>
            <p className="text-foreground/75 leading-relaxed"
               style={{ fontSize: "clamp(10px, 2.8vw, 13px)" }}>
              We handcraft each bouquet with love, using the freshest blooms to help you
              express what words cannot.
            </p>
          </div>
        </div>
      </section>

      {/* ── OUR LOCATION ── */}
      <section className="px-4 pt-6 pb-4 w-full max-w-2xl mx-auto">
        <SectionHeader label="Our Location" />

        {/* always 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* store photo — portrait */}
          <div className="overflow-hidden rounded-lg" style={{ aspectRatio: "3/4" }}>
            <img
              src={STORE_IMG}
              alt="Our store"
              className="w-full h-full object-cover"
            />
          </div>

          {/* address + map */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-4 w-4 text-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-foreground leading-tight"
                   style={{ fontSize: "clamp(10px, 2.8vw, 13px)" }}>
                  {storeName}
                </p>
                {footer.address ? (
                  <p className="text-muted-foreground leading-snug whitespace-pre-line mt-0.5"
                     style={{ fontSize: "clamp(9px, 2.5vw, 12px)" }}>
                    {footer.address}
                  </p>
                ) : (
                  <p className="text-muted-foreground leading-snug mt-0.5"
                     style={{ fontSize: "clamp(9px, 2.5vw, 12px)" }}>
                    123 Bloom Street{"\n"}Greenfield District{"\n"}Philippines 1100
                  </p>
                )}
              </div>
            </div>

            {/* map */}
            <div className="flex-1 rounded-lg overflow-hidden border border-border/40 bg-stone-50"
                 style={{ minHeight: 110 }}>
              {footer.address ? (
                <iframe
                  title="Store map"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 110, display: "block" }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(footer.address)}&output=embed`}
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground/40"
                     style={{ minHeight: 110 }}>
                  <MapPin className="h-6 w-6" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR HOURS ── */}
      <section className="px-4 py-4 w-full max-w-2xl mx-auto">
        <SectionHeader label="Our Hours" />
        <div className="space-y-2.5">
          {hoursLines.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex justify-between w-full">
                <span className="text-foreground" style={{ fontSize: "clamp(11px, 3vw, 14px)" }}>
                  {h.day}
                </span>
                <span className="text-foreground" style={{ fontSize: "clamp(11px, 3vw, 14px)" }}>
                  {h.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THANK YOU ── */}
      <section
        className="relative w-full overflow-hidden mt-2"
        style={{ minHeight: 280 }}
      >
        <img
          src={THANKS_IMG}
          alt="Thank you"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "70% center" }}
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to right, rgba(245,240,235,0.95) 0%, rgba(245,240,235,0.80) 38%, rgba(245,240,235,0.3) 60%, transparent 80%)"
        }} />

        <div className="relative z-10" style={{ minHeight: 280 }}>
          <div className="pt-7 pl-4 pr-2" style={{ width: "48%" }}>
            <h2 className="font-serif font-bold uppercase text-foreground leading-none mb-1"
                style={{ fontSize: "clamp(26px, 8.5vw, 42px)" }}>
              Thank You
            </h2>
            <BotanicalDivider />
            <p className="text-foreground/75 leading-relaxed"
               style={{ fontSize: "clamp(10px, 2.8vw, 13px)" }}>
              Every bouquet we create is a reflection of our passion and gratitude.
              Thank you for letting us be part of your special moments.
            </p>
          </div>
        </div>
      </section>

      {/* ── BADGE STRIP ── */}
      <section style={{ backgroundColor: "#2d4a2d" }} className="py-4 px-4">
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5">
            <img
              src="https://res.cloudinary.com/caytgopc/image/upload/v1782970690/flower_byhj4m.png"
              alt="Fresh & Handcrafted"
              className="h-4 w-4 object-contain"
              style={{ filter: "brightness(0) invert(1) opacity(0.7)" }}
            />
            <span className="text-white font-semibold uppercase tracking-widest"
                  style={{ fontSize: "clamp(8px, 2.2vw, 11px)" }}>
              Fresh &amp; Handcrafted
            </span>
          </div>
          <div className="h-5 w-px bg-white/25" />
          <div className="flex items-center gap-1.5">
            <Leaf className="h-4 w-4 text-white/70" />
            <span className="text-white font-semibold uppercase tracking-widest"
                  style={{ fontSize: "clamp(8px, 2.2vw, 11px)" }}>
              Locally Sourced
            </span>
          </div>
          <div className="h-5 w-px bg-white/25" />
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-white/70" />
            <span className="text-white font-semibold uppercase tracking-widest"
                  style={{ fontSize: "clamp(8px, 2.2vw, 11px)" }}>
              Made with Love
            </span>
          </div>
        </div>
      </section>

      <div className="-mt-12">
        <StoreFooter />
      </div>
    </div>
  );
}
