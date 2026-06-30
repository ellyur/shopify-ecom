import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Package, MapPin, Clock, CreditCard, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderFromUrl = params.get("order");
    if (orderFromUrl) {
      setOrderNumber(orderFromUrl);
      setSearchQuery(orderFromUrl.toUpperCase());
    }
  }, []);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["/api/orders", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;
      const res = await fetch(`/api/orders/${searchQuery}`);
      if (!res.ok) throw new Error("Order not found");
      return res.json();
    },
    enabled: !!searchQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(orderNumber.trim().toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'downpayment': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paid': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'processing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivery': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl mb-6">Track Your Order</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Enter your order number (e.g., RUL-1234) to see the current status of your floral arrangement.
          </p>
          
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="RUL-XXXX" 
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="pl-10 h-12 rounded-none border-primary/20 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" className="h-12 px-8 rounded-none bg-primary hover:bg-accent transition-colors">
              Track
            </Button>
          </form>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-100 text-red-700 text-center rounded-lg">
            We couldn't find an order with that number. Please double-check and try again.
          </div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <Card className="rounded-none border-border/50 shadow-xl overflow-hidden">
              <CardHeader className="bg-primary text-white p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="font-serif text-3xl mb-1">Order {order.orderNumber}</CardTitle>
                    <div className="flex flex-col gap-1">
                      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold">
                        Official {order.orderType === 'pickup' ? 'Pickup' : 'Delivery'} Schedule:
                      </p>
                      <p className="text-white text-lg font-serif">
                        {order.orderType === 'pickup' 
                          ? `${order.preferredDeliveryDate} at ${order.preferredDeliveryTime}`
                          : order.scheduledDate 
                            ? `${new Date(order.scheduledDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} at ${order.scheduledTime}` 
                            : 'To Be Determined'}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn("px-4 py-1 text-[10px] uppercase tracking-[0.2em] font-bold rounded-none border", getStatusColor(order.status))}>
                    {order.status === 'downpayment' ? 'Downpayment Received' : order.status === 'paid' ? 'Fully Paid' : order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                {/* Status Timeline Placeholder or Simple Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
                        <User className="h-3 w-3" /> Customer Details
                      </h4>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      {order.customerFbProfile && (
                        <p className="text-sm text-primary underline truncate max-w-full block mt-1">
                          {order.customerFbProfile}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-3">Order Placed On</p>
                      <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
                        <Clock className="h-3 w-3" /> {order.orderType === 'pickup' ? 'Pickup Schedule' : 'Delivery Schedule'}
                      </h4>
                      <div className="space-y-2">
                        {order.orderType === 'delivery' && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Requested Delivery</p>
                            <p className="text-sm font-medium">{order.preferredDeliveryDate} at {order.preferredDeliveryTime}</p>
                          </div>
                        )}
                        {order.scheduledDate ? (
                          <div className="p-3 bg-primary/5 border border-primary/10">
                            <p className="text-[10px] text-primary uppercase tracking-widest font-bold mb-1">
                              Official {order.orderType === 'pickup' ? 'Pickup' : 'Delivery'} Schedule
                            </p>
                            <p className="text-sm font-bold text-primary">
                              {new Date(order.scheduledDate).toLocaleDateString(undefined, { dateStyle: 'long' })} at {order.scheduledTime}
                            </p>
                          </div>
                        ) : order.orderType === 'pickup' ? (
                          <div className="p-3 bg-primary/5 border border-primary/10">
                            <p className="text-[10px] text-primary uppercase tracking-widest font-bold mb-1">
                              Official Pickup Schedule
                            </p>
                            <p className="text-sm font-bold text-primary">
                              {order.preferredDeliveryDate} at {order.preferredDeliveryTime}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {order.orderType !== 'pickup' && (
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
                          <MapPin className="h-3 w-3" /> Delivery Address
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {order.deliveryAddress}<br />
                          {order.city}{order.postalCode ? `, ${order.postalCode}` : ""}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
                        <CreditCard className="h-3 w-3" /> Payment
                      </h4>
                      <p className="text-sm uppercase tracking-wider font-medium">
                        {order.paymentMethod.replace('cod_', 'COD via ')}
                      </p>
                      <p className="text-2xl font-serif mt-2">₱{Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    {order.specialInstructions && (
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">Notes</h4>
                        <p className="text-sm italic text-muted-foreground">"{order.specialInstructions}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-6">Order Items</h4>
                  <div className="space-y-4">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="h-16 w-16 bg-muted overflow-hidden">
                          {item.productImage && <img src={item.productImage} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-serif">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-sm">₱{Number(item.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
