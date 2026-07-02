import { Navbar } from "@/components/navbar";
import { StoreFooter } from "@/components/store-footer";
import { getFooterSettings } from "@/components/store-footer";
import { usePublicSettings } from "@/hooks/use-products";
import { Flower2, Heart, MapPin, Clock, Leaf } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const HERO_IMG = "https://res.cloudinary.com/caytgopc/image/upload/v1782969822/ChatGPT_Image_Jul_2_2026_01_21_13_PM_h6wr9y.jpg";
const STORE_IMG = "https://res.cloudinary.com/caytgopc/image/upload/v1782969845/Storefront_Extracted_ucqjjb.jpg";
const THANKS_IMG = "https://res.cloudinary.com/caytgopc/image/upload/v1782969832/ChatGPT_Image_Jul_2_2026_01_22_28_PM_pcj4xw.jpg";

const DEFAULT_HOURS = [
  { day: "Monday – Friday", time: "8:00 AM – 7:00 PM" },
  { day: "Saturday", time: "8:00 AM – 6:00 PM" },
  { day: "Sunday", time: "9:00 AM – 5:00 PM" },
];

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="text-xs md:text-sm uppercase tracking-[0.2em] font-bold text-foreground whitespace-nowrap">
        {label}
      </h2>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

export default function About() {
  const { data: settings = [] } = usePublicSettings();
  const footer = getFooterSettings(settings);
  const storeName = settings.find(s => s.key === "store_name")?.value || "Our Boutique";

  const hoursLines = footer.hours
    ? footer.hours.split("\n").filter(Boolean).map(line => {
        const [day, ...rest] = line.split(":");
        return { day: day?.trim(), time: rest.join(":").trim() };
      })
    : DEFAULT_HOURS;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative mt-[56px] md:mt-[64px] w-full overflow-hidden" style={{ minHeight: "420px" }}>
        <img
          src={HERO_IMG}
          alt="About us hero"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* gradient overlay — heavier on left so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 py-12 md:py-20 flex flex-col justify-center min-h-[420px]">
          <div className="w-[72%] sm:w-[55%] md:w-[42%]">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-semibold mb-2">
              Our Story
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-foreground uppercase leading-none mb-2.5">
              About Us
            </h1>
            <p className="font-serif italic text-sm sm:text-base md:text-xl text-foreground/80 mb-3">
              Our story in every bloom.
            </p>
            {/* Decorative floral divider */}
            <div className="flex items-center gap-2 mb-4 text-primary/60">
              <Leaf className="h-3 w-3" />
              <div className="h-px w-6 bg-primary/40" />
              <Flower2 className="h-4 w-4" />
              <div className="h-px w-6 bg-primary/40" />
              <Leaf className="h-3 w-3 scale-x-[-1]" />
            </div>
            <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed mb-2.5">
              At {storeName}, flowers are more than just gifts — they are emotions, memories,
              and moments made beautiful.
            </p>
            <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
              We handcraft each bouquet with love, using the freshest blooms to help you
              express what words cannot.
            </p>
          </div>
        </div>
      </section>

      {/* ── OUR LOCATION ── */}
      <section className="max-w-4xl mx-auto px-6 py-12 w-full">
        <SectionHeader label="Our Location" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Store photo */}
          <div className="rounded-xl overflow-hidden aspect-[4/3]">
            <img
              src={STORE_IMG}
              alt="Our store"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Address + map */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{storeName}</p>
                {footer.address ? (
                  <p className="text-muted-foreground text-sm mt-0.5 whitespace-pre-line leading-relaxed">
                    {footer.address}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm mt-0.5">
                    123 Bloom Street<br />
                    Greenfield District<br />
                    Philippines
                  </p>
                )}
              </div>
            </div>

            {/* Map placeholder / embed */}
            <div className="flex-1 min-h-[140px] rounded-xl overflow-hidden border border-border/40 bg-stone-100 relative">
              {footer.address ? (
                <iframe
                  title="Store location"
                  width="100%"
                  height="100%"
                  style={{ minHeight: 140, border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(footer.address)}&output=embed`}
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                  <MapPin className="h-8 w-8" />
                  <p className="text-xs">Map preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6 w-full">
        <div className="h-px bg-border/30" />
      </div>

      {/* ── OUR HOURS ── */}
      <section className="max-w-4xl mx-auto px-6 py-12 w-full">
        <SectionHeader label="Our Hours" />
        <div className="space-y-3 max-w-sm">
          {hoursLines.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between w-full">
                <span className="text-sm text-foreground">{h.day}</span>
                <span className="text-sm text-muted-foreground">{h.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THANK YOU ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "320px" }}>
        <img
          src={THANKS_IMG}
          alt="Thank you"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* gradient overlay — text on left */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-14 md:py-20 flex flex-col justify-center min-h-[320px]">
          <div className="max-w-[55%] md:max-w-[40%]">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground uppercase leading-none mb-3">
              Thank You
            </h2>
            <div className="flex items-center gap-2 mb-5 text-primary/60">
              <Leaf className="h-3 w-3" />
              <div className="h-px w-8 bg-primary/40" />
              <Heart className="h-4 w-4 fill-primary/40 text-primary/60" />
              <div className="h-px w-8 bg-primary/40" />
              <Leaf className="h-3 w-3 scale-x-[-1]" />
            </div>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Every bouquet we create is a reflection of our passion and gratitude. 
              Thank you for letting us be part of your special moments.
            </p>
          </div>
        </div>
      </section>

      {/* ── BADGE STRIP ── */}
      <section className="bg-foreground text-white py-5 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-around gap-4">
          <div className="flex items-center gap-2.5">
            <Flower2 className="h-5 w-5 text-white/70" />
            <span className="text-xs uppercase tracking-widest font-semibold">Fresh &amp; Handcrafted</span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-white/20" />
          <div className="flex items-center gap-2.5">
            <Leaf className="h-5 w-5 text-white/70" />
            <span className="text-xs uppercase tracking-widest font-semibold">Locally Sourced</span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-white/20" />
          <div className="flex items-center gap-2.5">
            <Heart className="h-5 w-5 text-white/70" />
            <span className="text-xs uppercase tracking-widest font-semibold">Made with Love</span>
          </div>
        </div>
      </section>

      <StoreFooter />
    </div>
  );
}
