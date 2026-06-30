import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { useCart } from "@/hooks/use-cart";
import { ShoppingBag, Loader2 } from "lucide-react";
import { CartDrawer } from "@/components/cart-drawer";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useLayoutEffect, useState } from "react";
import { usePublicSettings } from "@/hooks/use-products";
import { applyBrandTheme, getBrandSettings, saveCachedBrandSettings, loadCachedBrandSettings } from "@/lib/brand";
import { AdminPageSkeleton } from "@/components/admin-page-skeleton";

// Pages
import Home from "@/pages/home";
import ProductDetail from "@/pages/product-detail";
import Checkout from "@/pages/checkout";
import OrderTracking from "@/pages/order-tracking";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminSpecialOffers from "@/pages/admin/special-offers";
import AdminSettings from "@/pages/admin/settings";
import AdminEvents from "@/pages/admin/events";
import AdminPaymentMethods from "@/pages/admin/payment-methods";
import AdminCustomers from "@/pages/admin/customers";
import PaymentReturn from "@/pages/payment-return";
import NotFound from "@/pages/not-found";

function BrandThemeLoader() {
  const { data: settings } = usePublicSettings();

  useLayoutEffect(() => {
    const cached = loadCachedBrandSettings();
    if (cached) applyBrandTheme(cached);
  }, []);

  useEffect(() => {
    if (!settings) return;
    const brand = getBrandSettings(settings);
    saveCachedBrandSettings(brand);
    applyBrandTheme(brand);
  }, [settings]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    setShowSkeleton(true);
    const t = setTimeout(() => setShowSkeleton(false), 450);
    return () => clearTimeout(t);
  }, [Component]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  if (showSkeleton) return <AdminPageSkeleton />;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/track" component={OrderTracking} />
      <Route path="/payment/success">
        <PaymentReturn mode="success" />
      </Route>
      <Route path="/payment/failed">
        <PaymentReturn mode="failed" />
      </Route>

      {/* Admin Routes */}
      <Route path="/login" component={Login} />
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} />
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} />
      </Route>
      <Route path="/admin/products">
        <ProtectedRoute component={AdminProducts} />
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute component={AdminOrders} />
      </Route>
      <Route path="/admin/special-offers">
        <ProtectedRoute component={AdminSpecialOffers} />
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute component={AdminSettings} />
      </Route>
      <Route path="/admin/events">
        <ProtectedRoute component={AdminEvents} />
      </Route>
      <Route path="/admin/payment-methods">
        <ProtectedRoute component={AdminPaymentMethods} />
      </Route>
      <Route path="/admin/customers">
        <ProtectedRoute component={AdminCustomers} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { items } = useCart();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrandThemeLoader />
        <Toaster />
        <Router />
        
        {/* Floating View Cart Button */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed bottom-8 right-8 z-[40]"
            >
              <CartDrawer trigger={
                <Button 
                  className="bg-primary text-white hover:bg-accent rounded-full px-8 py-6 shadow-2xl flex items-center gap-3 transition-all border-none group"
                  data-testid="button-floating-cart"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-white group-hover:border-white/50 transition-colors">
                    View Bag ({itemCount})
                  </span>
                </Button>
              } />
            </motion.div>
          )}
        </AnimatePresence>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;