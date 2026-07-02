import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { CartDrawer } from "./cart-drawer";
import { Menu, User, Truck, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setIsOpen(false); }, [location]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const links = [
    { href: "/", label: "Boutique" },
    { href: "/track", label: "Track Order" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
    { href: "/faqs", label: "FAQs" },
  ];

  return (
    <>
      {/* ── Announcement bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#3d4f3d] text-white text-center py-2 text-[11px] tracking-[0.15em] uppercase font-medium select-none">
        Fresh flowers. Handcrafted with love.
      </div>

      <nav className={cn(
        "fixed left-0 right-0 z-40 transition-all duration-300 top-[34px]",
        isScrolled ? "bg-white/95 backdrop-blur-md border-b shadow-sm py-2" : "bg-white/80 backdrop-blur-sm py-3 md:py-4"
      )}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">

            {/* Hamburger — mobile only */}
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/5 text-foreground"
                onClick={() => setIsOpen(true)}
                data-testid="button-open-menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn("text-sm font-medium transition-colors", location === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Logo Center */}
            <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 group">
              <BrandLogo className="h-10 md:h-12 w-auto" showFallbackText />
            </Link>

            {/* Right icons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href="/track" className="hidden md:flex text-muted-foreground hover:text-primary transition-colors p-2">
                <Truck className="h-5 w-5" />
              </Link>
              <Link href="/login" className="hidden md:flex items-center text-muted-foreground hover:text-primary transition-colors p-2">
                <User className="h-5 w-5" />
              </Link>
              <div className="relative">
                <CartDrawer />
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <div
        className="fixed top-0 left-0 z-[70] h-full bg-white shadow-2xl transition-transform duration-300"
        style={{
          width: "80vw",
          maxWidth: 320,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-primary/5">
          <BrandLogo className="h-10 w-auto" showFallbackText />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-gray-500 hover:text-gray-800"
            data-testid="button-close-menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="px-6 py-6 flex flex-col gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-lg font-medium"
              style={{ color: location === link.href ? "var(--primary, #7c3d52)" : "#1a1a1a" }}
              onClick={() => setIsOpen(false)}
              data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
