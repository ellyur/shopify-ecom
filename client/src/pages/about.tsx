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

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

export default function About() {
  const { data: settings = [] } = usePublicSettings();
  const footer    = getFooterSettings(settings);
  const storeName = settings.find(s => s.key === "store_name")?.value || "Our Boutique";

  const hoursLines = footer.hours
    ? footer.hours.split("\n").filter(Boolean).map(line => {
        const idx = line.indexOf(":");
        return { day: line.slice(0, idx).trim(), time: line.slice(idx + 1).trim() };
      })
    : DEFAULT_HOURS;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative w-full overflow-hidden" style={{ marginTop: 56, minHeight: 420 }}>
        <img
          src={HERO_IMG}
          alt="About us"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "65% center" }}
        />
        {/* gradient covers left 55% heavily, fades right */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to right, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.92) 28%, rgba(255,255,255,0.60) 46%, rgba(255,255,255,0.0) 62%)"
        }} />

        {/* Text block — absolutely positioned, hard-clipped to 44% of viewport */}
        <div className="absolute top-0 left-0 bottom-0 overflow-hidden" style={{ width: "44%" }}>
          <div className="pt-6 pr-6" style={{ paddingLeft: "clamp(16px, 4vw, 80px)" }}>
            <h1
              className="font-serif font-bold uppercase text-foreground leading-none mb-2"
              style={{ fontSize: "clamp(28px, 5.5vw, 56px)" }}
            >
              About Us
            </h1>
            <p
              className="font-serif italic text-foreground/80 leading-snug mb-1"
              style={{ fontSize: "clamp(13px, 2.4vw, 22px)" }}
            >
              Our story in every bloom.
            </p>
            <BotanicalDivider />
            <p className="text-foreground/75 leading-relaxed mb-2"
               style={{ fontSize: "clamp(11px, 1.4vw, 14px)" }}>
              At {storeName}, flowers are more than just gifts — they are emotions,
              memories, and moments made beautiful.
            </p>
            <p className="text-foreground/75 leading-relaxed"
               style={{ fontSize: "clamp(11px, 1.4vw, 14px)" }}>
              We handcraft each bouquet with love, using the freshest blooms to
              help you express what words cannot.
            </p>
          </div>
        </div>

        {/* spacer so section has height */}
        <div style={{ minHeight: 420 }} />
      </section>

      {/* ── OUR LOCATION ── */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-24 pt-8 pb-6 w-full max-w-6xl mx-auto">
        <SectionHeader label="Our Location" />
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div className="overflow-hidden rounded-xl" style={{ aspectRatio: "3/4" }}>
            <img src={STORE_IMG} alt="Our store" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-foreground leading-tight"
                   style={{ fontSize: "clamp(12px, 1.4vw, 16px)" }}>
                  {storeName}
                </p>
                <p className="text-muted-foreground leading-snug whitespace-pre-line mt-1"
                   style={{ fontSize: "clamp(11px, 1.2vw, 14px)" }}>
                  {footer.address || "123 Bloom Street\nGreenfield District\nPhilippines 1100"}
                </p>
              </div>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-border/40 bg-stone-50"
                 style={{ minHeight: 160 }}>
              {footer.address ? (
                <iframe
                  title="Store map" width="100%" height="100%"
                  style={{ border: 0, minHeight: 160, display: "block" }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(footer.address)}&output=embed`}
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/30"
                     style={{ minHeight: 160 }}>
                  <MapPin className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR HOURS ── */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-24 py-6 w-full max-w-6xl mx-auto border-t border-border/30">
        <SectionHeader label="Our Hours" />
        <div className="space-y-3 max-w-md">
          {hoursLines.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between w-full">
                <span className="text-foreground" style={{ fontSize: "clamp(12px, 1.4vw, 15px)" }}>
                  {h.day}
                </span>
                <span className="text-foreground" style={{ fontSize: "clamp(12px, 1.4vw, 15px)" }}>
                  {h.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THANK YOU ── */}
      <section className="relative w-full overflow-hidden mt-2" style={{ minHeight: 320 }}>
        <img
          src={THANKS_IMG}
          alt="Thank you"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "70% center" }}
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to right, rgba(245,240,235,0.96) 0%, rgba(245,240,235,0.90) 28%, rgba(245,240,235,0.55) 46%, transparent 62%)"
        }} />

        {/* Text block — absolutely positioned, hard-clipped */}
        <div className="absolute top-0 left-0 bottom-0 overflow-hidden" style={{ width: "44%" }}>
          <div className="pt-8 pr-6" style={{ paddingLeft: "clamp(16px, 4vw, 80px)" }}>
            <h2
              className="font-serif font-bold uppercase text-foreground leading-none mb-2"
              style={{ fontSize: "clamp(28px, 5.5vw, 56px)" }}
            >
              Thank You
            </h2>
            <BotanicalDivider />
            <p className="text-foreground/75 leading-relaxed"
               style={{ fontSize: "clamp(11px, 1.4vw, 14px)" }}>
              Every bouquet we create is a reflection of our passion and gratitude.
              Thank you for letting us be part of your special moments.
            </p>
          </div>
        </div>

        <div style={{ minHeight: 320 }} />
      </section>

      {/* ── BADGE STRIP ── */}
      <section style={{ backgroundColor: "#2d4a2d" }} className="py-5 px-6">
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/caytgopc/image/upload/v1782970690/flower_byhj4m.png"
              alt="" className="h-5 w-5 object-contain"
              style={{ filter: "brightness(0) invert(1) opacity(0.7)" }}
            />
            <span className="text-white font-semibold uppercase tracking-widest"
                  style={{ fontSize: "clamp(9px, 1.1vw, 12px)" }}>
              Fresh &amp; Handcrafted
            </span>
          </div>
          <div className="h-5 w-px bg-white/25" />
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-white/70" />
            <span className="text-white font-semibold uppercase tracking-widest"
                  style={{ fontSize: "clamp(9px, 1.1vw, 12px)" }}>
              Locally Sourced
            </span>
          </div>
          <div className="h-5 w-px bg-white/25" />
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-white/70" />
            <span className="text-white font-semibold uppercase tracking-widest"
                  style={{ fontSize: "clamp(9px, 1.1vw, 12px)" }}>
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
