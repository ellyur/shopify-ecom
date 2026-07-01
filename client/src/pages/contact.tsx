import { Navbar } from "@/components/navbar";
import { StoreFooter } from "@/components/store-footer";
import { usePublicSettings } from "@/hooks/use-products";
import { getFooterSettings } from "@/components/store-footer";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from "lucide-react";

export default function Contact() {
  const { data: settings = [] } = usePublicSettings();
  const footer = getFooterSettings(settings);
  const storeName = settings.find(s => s.key === "store_name")?.value || "Our Boutique";

  const items = [
    footer.address && { icon: MapPin, label: "Address", value: footer.address, href: `https://maps.google.com/?q=${encodeURIComponent(footer.address)}` },
    footer.phone && { icon: Phone, label: "Phone", value: footer.phone, href: `tel:${footer.phone}` },
    footer.email && { icon: Mail, label: "Email", value: footer.email, href: `mailto:${footer.email}` },
    footer.hours && { icon: Clock, label: "Hours", value: footer.hours, href: null },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; href: string | null }[];

  const socials = [
    footer.facebook && { icon: Facebook, label: "Facebook", href: footer.facebook },
    footer.instagram && { icon: Instagram, label: "Instagram", href: footer.instagram },
  ].filter(Boolean) as { icon: React.ElementType; label: string; href: string }[];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="mt-[98px] bg-stone-50 border-b border-border/40 py-16 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">Get in Touch</p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Contact Us</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
          We'd love to hear from you. Reach out for inquiries, custom orders, or just to say hello.
        </p>
      </section>

      {/* Contact Info */}
      <section className="max-w-2xl mx-auto px-6 py-14 w-full">
        {items.length > 0 ? (
          <div className="space-y-6">
            {items.map(item => (
              <div key={item.label} className="flex gap-4 items-start">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-0.5">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                      className="text-sm text-foreground hover:text-primary transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-line">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary/60" />
            </div>
            <p className="text-muted-foreground text-sm">
              Contact details haven't been set up yet. Visit Admin → Settings → Store Info to add them.
            </p>
          </div>
        )}

        {/* Social Links */}
        {socials.length > 0 && (
          <>
            <div className="h-px bg-border/40 my-10" />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">Follow Us</p>
              <div className="flex gap-3">
                {socials.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-primary/40 hover:text-primary text-sm text-foreground transition-colors"
                  >
                    <s.icon className="h-4 w-4" />
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <StoreFooter />
    </div>
  );
}
