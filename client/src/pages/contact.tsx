import { Navbar } from "@/components/navbar";
import { StoreFooter } from "@/components/store-footer";
import { getFooterSettings } from "@/components/store-footer";
import { usePublicSettings } from "@/hooks/use-products";
import { Phone, Mail, MapPin, Clock, Heart, Star } from "lucide-react";

const HERO_IMG = "https://res.cloudinary.com/caytgopc/image/upload/v1782971584/ChatGPT_Image_Jul_2_2026_01_50_36_PM_1_hbvutp.jpg";
const STORE_IMG = "https://res.cloudinary.com/caytgopc/image/upload/v1782969845/Storefront_Extracted_ucqjjb.jpg";

const DEFAULT_HOURS = [
  { day: "Monday – Friday", time: "8:00 AM – 7:00 PM" },
  { day: "Saturday",        time: "8:00 AM – 6:00 PM" },
  { day: "Sunday",          time: "9:00 AM – 5:00 PM" },
];

function ContactCard({
  icon: Icon,
  title,
  value,
  sub,
  href,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  sub: string;
  href?: string;
}) {
  return (
    <div
      className="flex-1 rounded-2xl border border-border/60 bg-white p-4 flex flex-col gap-2"
      style={{ minWidth: 0 }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}
      >
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="font-semibold text-foreground text-sm">{title}</p>
      {href ? (
        <a
          href={href}
          className="text-primary font-medium text-sm hover:underline leading-tight"
        >
          {value}
        </a>
      ) : (
        <p className="text-primary font-medium text-sm leading-tight">{value}</p>
      )}
      <p className="text-muted-foreground text-xs leading-snug">{sub}</p>
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{ marginTop: 90, minHeight: 620 }}
      >
        {/* LEFT — content */}
        <div
          className="order-2 lg:order-1 flex items-center justify-start px-6 py-12 lg:px-16 xl:px-24"
          style={{ backgroundColor: "#F9F6F1" }}
        >
          <div style={{ maxWidth: 460, width: "100%" }}>
            {/* eyebrow */}
            <p
              className="font-bold uppercase tracking-widest mb-2"
              style={{ fontSize: 11, color: "hsl(var(--primary))" }}
            >
              We're Here to Help
            </p>

            {/* title */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontSize: "clamp(42px, 5vw, 64px)",
                fontWeight: 700,
                lineHeight: 1,
                color: "#1a1a1a",
                marginBottom: 12,
              }}
            >
              Contact Us
            </h1>

            {/* divider */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-10 bg-border/60" />
              <Heart className="h-3 w-3 text-primary/60" />
              <div className="h-px w-10 bg-border/60" />
            </div>

            <p
              className="text-foreground/70 mb-8"
              style={{ fontSize: "clamp(14px, 1.2vw, 16px)", lineHeight: 1.8 }}
            >
              Have a question, special request, or need help with your order?
              Our team is here to assist you anytime.
            </p>

            {/* Contact cards */}
            <div className="flex flex-col sm:flex-row gap-3">
              {footer.email ? (
                <ContactCard
                  icon={Mail}
                  title="Email Us"
                  value={footer.email}
                  sub="We reply within 24 hours"
                  href={`mailto:${footer.email}`}
                />
              ) : (
                <ContactCard
                  icon={Mail}
                  title="Email Us"
                  value="hello@liceriarose.store"
                  sub="We reply within 24 hours"
                />
              )}

              {footer.phone ? (
                <ContactCard
                  icon={Phone}
                  title="Call Us"
                  value={footer.phone}
                  sub="Mon – Sun, 8 AM – 7 PM"
                  href={`tel:${footer.phone}`}
                />
              ) : (
                <ContactCard
                  icon={Phone}
                  title="Call Us"
                  value="Set in Admin Settings"
                  sub="Mon – Sun, 8 AM – 7 PM"
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — floral image */}
        <div className="order-1 lg:order-2 relative" style={{ minHeight: 360 }}>
          <img
            src={HERO_IMG}
            alt="Contact us — floral"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "70% center" }}
          />
          {/* gradient bleeds left on desktop */}
          <div className="absolute inset-0 hidden lg:block" style={{
            background: "linear-gradient(to right, #F9F6F1 0%, rgba(249,246,241,0.3) 20%, transparent 45%)"
          }} />
          {/* "We're here to help!" card */}
          <div
            className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg hidden lg:block"
            style={{ maxWidth: 200 }}
          >
            <p
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: 22,
                color: "#1a1a1a",
                lineHeight: 1.3,
                marginBottom: 4,
              }}
            >
              We're here<br />to help!
            </p>
            <Heart className="h-4 w-4 text-primary/70" />
          </div>
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-24 py-10 w-full max-w-6xl mx-auto">
        {/* section header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground whitespace-nowrap">
            Our Location
          </span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          {/* Store photo */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <img src={STORE_IMG} alt="Our store" className="w-full h-full object-cover" />
            </div>

            {/* Info rows */}
            <div className="space-y-4">
              {footer.address && (
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full border border-border/60 flex items-center justify-center mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Address</p>
                    <p className="text-foreground text-sm leading-snug">{footer.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full border border-border/60 flex items-center justify-center mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Hours</p>
                  <div className="space-y-0.5">
                    {hoursLines.map((h, i) => (
                      <div key={i} className="flex justify-between gap-6">
                        <span className="text-foreground text-sm">{h.day}</span>
                        <span className="text-foreground text-sm whitespace-nowrap">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-border/30 bg-stone-50" style={{ minHeight: 380 }}>
            {footer.address ? (
              <iframe
                title="Store location"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 380, display: "block" }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(footer.address)}&output=embed`}
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/40"
                   style={{ minHeight: 380 }}>
                <MapPin className="h-10 w-10" />
                <p className="text-sm">Address not set — configure in Admin → Settings</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── BADGE STRIP ── */}
      <section style={{ backgroundColor: "#2d4a2d" }} className="py-5 px-6 mt-4">
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-white/70" />
            <div>
              <p className="text-white font-semibold uppercase tracking-widest"
                 style={{ fontSize: "clamp(8px, 1vw, 11px)" }}>
                Fast Response
              </p>
              <p className="text-white/50" style={{ fontSize: "clamp(7px, 0.9vw, 10px)" }}>
                We're quick to help
              </p>
            </div>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-white/70" />
            <div>
              <p className="text-white font-semibold uppercase tracking-widest"
                 style={{ fontSize: "clamp(8px, 1vw, 11px)" }}>
                Friendly Support
              </p>
              <p className="text-white/50" style={{ fontSize: "clamp(7px, 0.9vw, 10px)" }}>
                Always here for you
              </p>
            </div>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-white/70" />
            <div>
              <p className="text-white font-semibold uppercase tracking-widest"
                 style={{ fontSize: "clamp(8px, 1vw, 11px)" }}>
                Satisfaction First
              </p>
              <p className="text-white/50" style={{ fontSize: "clamp(7px, 0.9vw, 10px)" }}>
                Your happiness matters
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="-mt-12">
        <StoreFooter />
      </div>
    </div>
  );
}
