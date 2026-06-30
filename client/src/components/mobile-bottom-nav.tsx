import { Link, useLocation } from "wouter";
import { Home, Truck, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/hooks/use-cart";

interface MobileBottomNavProps {
  onFilterClick: () => void;
  activeFilterCount?: number;
}

export function MobileBottomNav({ onFilterClick, activeFilterCount = 0 }: MobileBottomNavProps) {
  const [location] = useLocation();
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border/60 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-2">

        {/* Home */}
        <Link href="/" data-testid="bottom-nav-home">
          <button className="flex flex-col items-center gap-1 min-w-[56px] py-1 group">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
              location === "/" ? "bg-primary/10" : "group-hover:bg-muted"
            )}>
              <Home className={cn(
                "h-5 w-5 transition-colors",
                location === "/" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
            </div>
            <span className={cn(
              "text-[10px] font-semibold tracking-wide leading-none",
              location === "/" ? "text-primary" : "text-muted-foreground"
            )}>Home</span>
          </button>
        </Link>

        {/* Track */}
        <Link href="/track" data-testid="bottom-nav-track">
          <button className="flex flex-col items-center gap-1 min-w-[56px] py-1 group">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
              location === "/track" ? "bg-primary/10" : "group-hover:bg-muted"
            )}>
              <Truck className={cn(
                "h-5 w-5 transition-colors",
                location === "/track" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
            </div>
            <span className={cn(
              "text-[10px] font-semibold tracking-wide leading-none",
              location === "/track" ? "text-primary" : "text-muted-foreground"
            )}>Track</span>
          </button>
        </Link>

        {/* Cart */}
        <CartDrawer
          trigger={
            <button className="flex flex-col items-center gap-1 min-w-[56px] py-1 group" data-testid="bottom-nav-cart">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full group-hover:bg-muted transition-all duration-200">
                <ShoppingBag className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-wide leading-none text-muted-foreground">Cart</span>
            </button>
          }
        />

        {/* Filter */}
        <button
          onClick={onFilterClick}
          className="flex flex-col items-center gap-1 min-w-[56px] py-1 group relative"
          data-testid="bottom-nav-filter"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full group-hover:bg-muted transition-all duration-200">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-wide leading-none text-muted-foreground">Filter</span>
        </button>

      </div>
    </nav>
  );
}
