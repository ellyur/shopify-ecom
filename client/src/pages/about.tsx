import { Navbar } from "@/components/navbar";
import { StoreFooter } from "@/components/store-footer";
import { usePublicSettings } from "@/hooks/use-products";
import { Flower2, Heart, Leaf, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function About() {
  const { data: settings = [] } = usePublicSettings();
  const storeName = settings.find(s => s.key === "store_name")?.value || "Our Boutique";

  const values = [
    {
      icon: Flower2,
      title: "Fresh & Premium",
      description: "Every arrangement is crafted using only the freshest blooms, sourced daily to ensure peak quality and longevity.",
    },
    {
      icon: Heart,
      title: "Made with Love",
      description: "Each bouquet is handcrafted with care and intention, designed to carry your emotions beautifully.",
    },
    {
      icon: Leaf,
      title: "Sustainable Sourcing",
      description: "We partner with responsible growers who share our commitment to the environment and ethical practices.",
    },
    {
      icon: Sparkles,
      title: "Timeless Elegance",
      description: "Our designs blend classic beauty with modern sensibility — arrangements that feel both fresh and enduring.",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="mt-[98px] bg-stone-50 border-b border-border/40 py-16 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">Our Story</p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">About {storeName}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
          Beautiful flowers, thoughtfully arranged — for every moment that matters.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-6 py-14 text-center">
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">Beautiful. Natural. Timeless.</h2>
        <div className="space-y-4 text-muted-foreground text-sm leading-relaxed text-left">
          <p>
            We started with a simple belief: flowers have the power to express what words sometimes cannot. Whether it's a grand celebration, a quiet gesture of love, or a moment of sympathy — the right arrangement makes all the difference.
          </p>
          <p>
            Our boutique was built on a passion for floral artistry and a deep respect for nature's beauty. Every stem we use is hand-selected, every bouquet designed with intention. We don't just put flowers together — we craft experiences.
          </p>
          <p>
            From intimate everyday arrangements to custom event florals, we pour the same dedication into every order. Our customers aren't just buyers — they're part of the story we tell with every bloom.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 w-full">
        <div className="h-px bg-border/40" />
      </div>

      {/* Values */}
      <section className="max-w-4xl mx-auto px-6 py-14 w-full">
        <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold text-center mb-2">What We Stand For</p>
        <h2 className="font-serif text-2xl md:text-3xl text-foreground text-center mb-10">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map(v => (
            <div key={v.title} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Logo closer */}
      <section className="bg-stone-50 border-t border-border/40 py-12 text-center">
        <BrandLogo className="h-14 w-auto mx-auto mb-3" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Fresh Flowers. Handcrafted.</p>
      </section>

      <StoreFooter />
    </div>
  );
}
