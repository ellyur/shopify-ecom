import { Navbar } from "@/components/navbar";
import { StoreFooter } from "@/components/store-footer";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    ],
  },
  {
    category: "Payments & Returns",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept various payment methods including online payments and cash on delivery, depending on your location. Available options will be shown at checkout.",
      },
      {
        q: "What if my flowers arrive damaged?",
        a: "We take great care in packaging, but if your order arrives damaged, please take a photo and contact us within 24 hours. We'll make it right.",
      },
      {
        q: "Can I cancel or change my order?",
        a: "Orders can be modified or cancelled before they are prepared. Please contact us as soon as possible if you need to make changes.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", open && "rotate-180")} />
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
            <p className="text-sm text-muted-foreground leading-relaxed pb-4 pr-8">{a}</p>
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

      {/* Hero */}
      <section className="mt-[98px] bg-stone-50 border-b border-border/40 py-16 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">Help Center</p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Frequently Asked Questions</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
          Everything you need to know about ordering, delivery, and our flowers.
        </p>
      </section>

      {/* FAQ List */}
      <section className="max-w-2xl mx-auto px-6 py-14 w-full">
        <div className="space-y-10">
          {FAQS.map(section => (
            <div key={section.category}>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-4">{section.category}</p>
              <div className="bg-white rounded-2xl border border-border/50 px-5">
                {section.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <StoreFooter />
    </div>
  );
}
