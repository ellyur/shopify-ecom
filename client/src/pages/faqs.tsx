import { Navbar } from "@/components/navbar";
import { StoreFooter } from "@/components/store-footer";
import { useState } from "react";
import { ChevronDown, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const HERO_IMG = "https://res.cloudinary.com/caytgopc/image/upload/v1782971584/ChatGPT_Image_Jul_2_2026_01_50_36_PM_1_hbvutp.jpg";

const FAQS = [
  {
    category: "Orders",
    items: [
      {
        q: "How do I place an order?",
        a: "Simply browse our boutique, add your favorite arrangements to your bag, and proceed to checkout. You can choose your preferred delivery date and provide any special instructions.",
      },
      {
        q: "Can I customize my bouquet?",
        a: "Yes! Many of our arrangements come in different sizes and color variants. For fully custom orders, feel free to reach out to us directly via phone or email.",
      },
      {
        q: "Can I include a personalized message?",
        a: "Absolutely. During checkout, there's a field where you can write a personal note to be included with your order.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept Cash on Delivery (COD), GCash, and bank transfer. Available options will be shown at checkout.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "Orders can be modified or cancelled before they are prepared. Please contact us as soon as possible if you need to make changes.",
      },
    ],
  },
  {
    category: "Delivery",
    items: [
      {
        q: "Do you offer same-day delivery?",
        a: "Yes, we offer same-day delivery for orders placed before our cut-off time. Availability may vary depending on your location. Check the product page for details.",
      },
      {
        q: "What areas do you deliver to?",
        a: "We currently deliver within our service area. Please contact us directly if you're unsure whether we cover your location.",
      },
      {
        q: "Can I schedule a specific delivery time?",
        a: "You can choose a preferred delivery date during checkout. For specific time requests, please reach out to us after placing your order.",
      },
    ],
  },
  {
    category: "Products",
    items: [
      {
        q: "How long will my flowers last?",
        a: "With proper care — trimming stems, changing water daily, and keeping away from direct heat — most arrangements last 5–7 days. We include care instructions with every order.",
      },
      {
        q: "Are your flowers fresh?",
        a: "Yes. We source our blooms daily to ensure peak freshness. Every arrangement is made to order.",
      },
      {
        q: "Do you offer seasonal or limited edition arrangements?",
        a: "Yes! We regularly introduce seasonal collections and limited edition arrangements. Keep an eye on our boutique and special offers section.",
      },
      {
        q: "What if my flowers arrive damaged?",
        a: "We take great care in packaging, but if your order arrives damaged, please take a photo and contact us within 24 hours. We'll make it right.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl border border-border/50 bg-white overflow-hidden"
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-sm font-medium text-foreground leading-snug">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open ? "rotate-180 text-primary" : "text-muted-foreground"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground leading-relaxed px-5 pb-5 pr-12">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQs() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{ marginTop: 90, minHeight: 520 }}
      >
        {/* LEFT — content */}
        <div
          className="order-2 lg:order-1 flex items-center justify-start px-6 py-12 lg:px-16 xl:px-24"
          style={{ backgroundColor: "#F9F6F1" }}
        >
          <div style={{ maxWidth: 460, width: "100%" }}>
            {/* eyebrow */}
            <p
              className="font-bold uppercase tracking-widest mb-3"
              style={{ fontSize: 11, color: "hsl(var(--primary))" }}
            >
              Help Center
            </p>

            {/* title */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontSize: "clamp(36px, 4.5vw, 58px)",
                fontWeight: 700,
                lineHeight: 1.05,
                color: "#1a1a1a",
                marginBottom: 16,
              }}
            >
              Frequently Asked<br />Questions
            </h1>

            {/* divider */}
            <div className="flex items-center gap-2 mb-5">
              <div className="h-px w-10 bg-border/60" />
              <Heart className="h-3 w-3 text-primary/60" />
              <div className="h-px w-10 bg-border/60" />
            </div>

            <p
              className="text-foreground/70"
              style={{ fontSize: "clamp(14px, 1.2vw, 16px)", lineHeight: 1.8 }}
            >
              Everything you need to know about ordering, delivery, and our flowers.
            </p>
          </div>
        </div>

        {/* RIGHT — floral image */}
        <div className="order-1 lg:order-2 relative" style={{ minHeight: 320 }}>
          <img
            src={HERO_IMG}
            alt="Frequently Asked Questions — floral"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
          {/* gradient bleeds left on desktop */}
          <div className="absolute inset-0 hidden lg:block" style={{
            background: "linear-gradient(to right, #F9F6F1 0%, rgba(249,246,241,0.3) 20%, transparent 45%)"
          }} />
        </div>
      </section>

      {/* ── FAQ ACCORDION ── */}
      <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-10">
          {FAQS.map(section => (
            <div key={section.category}>
              {/* Category header */}
              <p
                className="font-bold uppercase tracking-[0.2em] text-foreground mb-4"
                style={{ fontSize: 11 }}
              >
                {section.category}
              </p>
              {/* Items */}
              <div className="space-y-3">
                {section.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-auto">
        <StoreFooter />
      </div>
    </div>
  );
}
