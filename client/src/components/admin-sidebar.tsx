import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Menu, Calendar, Gift, Settings, CreditCard, ShoppingBag, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { useAdminOrders } from "@/hooks/use-orders";

const NAV_CATEGORIES = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", badgeKey: null },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/products", icon: Package, label: "Products", badgeKey: null },
      { href: "/admin/orders", icon: ShoppingCart, label: "Orders", badgeKey: "orders" },
      { href: "/admin/special-offers", icon: Gift, label: "Special Offers", badgeKey: null },
      { href: "/admin/events", icon: Calendar, label: "Events", badgeKey: null },
      { href: "/admin/payment-methods", icon: CreditCard, label: "Payments", badgeKey: null },
      { href: "/admin/customers", icon: Users, label: "Customers", badgeKey: null },
    ],
  },
  {
    label: "Store",
    items: [
      { href: "/", icon: ShoppingBag, label: "Storefront", badgeKey: null },
      { href: "/track", icon: Truck, label: "Tracking", badgeKey: null },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", icon: Settings, label: "Settings", badgeKey: null },
    ],
  },
];

function NavItems({ currentPath, pendingOrderCount, onNavigate }: { currentPath: string; pendingOrderCount: number; onNavigate?: () => void }) {
  return (
    <div className="space-y-6">
      {NAV_CATEGORIES.map((category) => (
        <div key={category.label}>
          <p className="px-4 mb-1 text-[9px] font-bold tracking-[0.2em] uppercase text-white/40 select-none">
            {category.label}
          </p>
          <div className="space-y-0.5">
            {category.items.map(({ href, icon: Icon, label, badgeKey }) => {
              const isActive = currentPath === href || (href !== "/" && currentPath.startsWith(href));
              const count = badgeKey === "orders" ? pendingOrderCount : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  data-testid={`link-admin-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-[11px] font-semibold tracking-widest uppercase transition-all duration-200 rounded-none",
                    isActive
                      ? "bg-white/15 text-white border-l-2 border-white"
                      : "text-white/60 hover:bg-white/8 hover:text-white/90 border-l-2 border-transparent"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {count > 0 && (
                    <span
                      className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
                      data-testid={`badge-pending-${label.toLowerCase()}`}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminSidebar({ logoutMutation }: { logoutMutation: any }) {
  const [location] = useLocation();
  const { data: pendingOrders } = useAdminOrders("pending");
  const pendingOrderCount = pendingOrders?.length ?? 0;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-primary border-r border-white/5 fixed h-screen z-30 shadow-2xl">
        <div className="px-8 py-8 border-b border-white/10">
          <BrandLogo className="h-20 w-auto" onDark />
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin">
          <NavItems currentPath={location} pendingOrderCount={pendingOrderCount} />
        </nav>

        <div className="px-4 pb-6 border-t border-white/10 pt-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10 rounded-none border-l-2 border-transparent text-[11px] tracking-widest uppercase font-semibold"
            onClick={() => logoutMutation.mutate()}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between bg-primary px-4 py-3 shadow-md z-30 sticky top-0">
        <div className="relative">
          <BrandLogo className="h-10 w-auto" onDark />
          {pendingOrderCount > 0 && (
            <span className="absolute -top-1 -right-3 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none" data-testid="badge-pending-mobile">
              {pendingOrderCount > 99 ? "99+" : pendingOrderCount}
            </span>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
              <Menu className="h-6 w-6" />
              {pendingOrderCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                  {pendingOrderCount > 99 ? "99+" : pendingOrderCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0 border-none bg-primary">
            <div className="flex flex-col h-full">
              <div className="px-6 py-6 border-b border-white/10">
                <BrandLogo className="h-14 w-auto" onDark />
              </div>
              <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <NavItems currentPath={location} pendingOrderCount={pendingOrderCount} onNavigate={() => {}} />
              </nav>
              <div className="px-4 pb-6 border-t border-white/10 pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10 rounded-none text-[11px] tracking-widest uppercase font-semibold"
                  onClick={() => logoutMutation.mutate()}
                  data-testid="button-admin-logout-mobile"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
