import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { CartDrawer } from "./cart-drawer";
import { Menu, User, Truck } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Boutique" },
    { href: "/track", label: "Track Order" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
    { href: "/faqs", label: "FAQs" },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-white/95 backdrop-blur-md border-b shadow-sm py-2" : "bg-white/80 backdrop-blur-sm py-3 md:py-4"
    )}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/5 text-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 border-r-0 bg-white">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-border/50 bg-primary/5 flex items-center gap-3">
                    <BrandLogo className="h-10 w-auto" showFallbackText />
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                      {navLinks.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className={cn(
                            "block text-lg font-medium transition-colors",
                            location === link.href ? "text-primary" : "text-foreground hover:text-primary"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className={cn("text-sm font-medium transition-colors", location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              Boutique
            </Link>
            <Link href="/track" className={cn("text-sm font-medium transition-colors", location === "/track" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              Track Order
            </Link>
          </div>

          {/* Logo Center */}
          <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 group">
            <BrandLogo className="h-10 md:h-12 w-auto" showFallbackText />
          </Link>

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
  );
}
