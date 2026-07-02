import { Navbar } from "@/components/navbar";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateOrder } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Truck, Info, CheckCircle2, Calendar, ArrowRight, Loader2 as PayLoader } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import type { EventWithProducts } from "@shared/schema";
import { usePublicPaymentMethods } from "@/hooks/use-products";
import { useQuery } from "@tanstack/react-query";

const checkoutSchema = z.object({
  orderType: z.enum(["pickup", "delivery"]),
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(10, "Valid phone required"),
  customerFbProfile: z.string().min(2, "FB Name/Link is required"),
  customerEmail: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  deliveryAddress: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  preferredDeliveryDate: z.string().min(1, "Date is required"),
  preferredDeliveryTime: z.string().min(1, "Time is required"),
  specialInstructions: z.string().optional(),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  downpaymentMethod: z.string().optional(),
}).refine((data) => {
  if (data.orderType === "delivery") {
    return !!data.deliveryAddress && data.deliveryAddress.length >= 5 && !!data.city && data.city.length >= 2;
  }
  return true;
}, {
  message: "Address details are required for delivery",
  path: ["deliveryAddress"],
}).refine((data) => {
  if (data.paymentMethod === "cod" || data.paymentMethod === "online") {
    return !!data.downpaymentMethod;
  }
  return true;
}, {
  message: "Please choose a payment option",
  path: ["downpaymentMethod"],
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [paymongoRedirecting, setPaymongoRedirecting] = useState(false);
  const { data: paymentMethodsList = [], isLoading: methodsLoading } = usePublicPaymentMethods();
  const { data: paymongoConfig } = useQuery<{ enabled: boolean; publicKey: string | null }>({
    queryKey: ["/api/paymongo/config"],
  });
  const paymongoEnabled = paymongoConfig?.enabled ?? false;
  const codMethods = paymentMethodsList.filter(m => m.type === "cod");
  const onlineMethods = paymentMethodsList.filter(m => m.type === "online");
  const uniqueOnlineMethods = onlineMethods.filter((method, index, methods) => {
    const methodLabel = method.label.trim().toLowerCase();
    return methods.findIndex(item => item.label.trim().toLowerCase() === methodLabel) === index;
  });

  // Event pricing state
  const [activeEvent, setActiveEvent] = useState<EventWithProducts | null>(null);
  const [pendingEvent, setPendingEvent] = useState<EventWithProducts | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState<string>("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      orderType: "delivery",
      paymentMethod: "",
      customerFbProfile: "",
      preferredDeliveryDate: "",
      preferredDeliveryTime: "",
      specialInstructions: "",
      deliveryAddress: "",
      city: "",
      postalCode: "",
    },
  });

  const orderType = form.watch("orderType");
  const selectedPayment = form.watch("paymentMethod");
  const selectedDownpayment = form.watch("downpaymentMethod");
  const watchedDate = form.watch("preferredDeliveryDate");

  // Check for event pricing when date changes
  const checkEventForDate = useCallback(async (date: string) => {
    if (!date) {
      setActiveEvent(null);
      return;
    }
    try {
      const res = await fetch(`/api/events/by-date/${date}`);
      if (res.ok) {
        const event: EventWithProducts = await res.json();
        if (event && event.products.length > 0) {
          setPendingDate(date);
          setPendingEvent(event);
          setShowEventDialog(true);
        }
      } else {
        setActiveEvent(null);
      }
    } catch {
      setActiveEvent(null);
    }
  }, []);

  useEffect(() => {
    if (watchedDate) checkEventForDate(watchedDate);
    else setActiveEvent(null);
  }, [watchedDate, checkEventForDate]);

  // Compute effective total using event prices where available
  const eventPriceMap = new Map<number, number>(
    activeEvent?.products.map(ep => [ep.productId, Number(ep.eventPrice)]) ?? []
  );

  const effectiveTotal = activeEvent
    ? items.reduce((sum, item) => {
        const eventPrice = eventPriceMap.get(item.productId);
        const price = eventPrice !== undefined ? eventPrice : Number(item.product.price);
        return sum + price * item.quantity;
      }, 0)
    : total;

  // Disable COD methods if Pickup is selected
  const isCodDisabled = orderType === "pickup";
  const isSelectedCod = selectedPayment === "cod";
  const isSelectedOnline = selectedPayment === "online";

  const isPaymongo = form.watch("paymentMethod") === "paymongo";

  const onSubmit = (data: CheckoutFormValues) => {
    const selectedOnlineMethod = uniqueOnlineMethods.find(m => String(m.id) === data.downpaymentMethod);
    const paymentLabel = data.paymentMethod === "cod"
      ? `cod_${selectedOnlineMethod?.label || data.downpaymentMethod || "downpayment"}`
      : data.paymentMethod === "online"
        ? selectedOnlineMethod?.label || data.downpaymentMethod || "online"
        : data.paymentMethod;

    const orderPayload = {
      order: {
        ...data,
        deliveryAddress: data.orderType === 'pickup' ? 'PICKUP AT BOUTIQUE' : data.deliveryAddress || '',
        city: data.orderType === 'pickup' ? 'N/A' : data.city || '',
        paymentMethod: paymentLabel,
        subtotal: effectiveTotal.toString(),
        totalAmount: effectiveTotal.toString(),
        deliveryFee: "0",
        status: "pending",
      },
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId,
        variantColorName: item.variantColorName,
      })),
    };

    createOrder(orderPayload, {
      onSuccess: async (res) => {
        // Save purchased order for review eligibility
        const purchasedProductIds = items.map(item => item.productId).filter(Boolean);
        const existingRaw = localStorage.getItem("purchased_orders");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        existing.push({ orderNumber: res.orderNumber, productIds: purchasedProductIds });
        localStorage.setItem("purchased_orders", JSON.stringify(existing));
        clearCart();

        // PayMongo flow: redirect to hosted checkout
        if (data.paymentMethod === "paymongo") {
          setPaymongoRedirecting(true);
          try {
            const pmRes = await fetch(`/api/paymongo/checkout/${res.orderNumber}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ baseUrl: window.location.origin }),
            });
            const pmData = await pmRes.json();
            if (!pmRes.ok) throw new Error(pmData.message || "Failed to start payment");
            localStorage.setItem("paymongo_order", res.orderNumber);
            window.location.href = pmData.checkoutUrl;
          } catch (err: any) {
            setPaymongoRedirecting(false);
            toast({
              title: "Payment Gateway Error",
              description: err.message || "Could not connect to PayMongo. Your order is saved — contact us to complete payment.",
              variant: "destructive",
              duration: 12000,
            });
            setLocation(`/track?order=${res.orderNumber}`);
          }
          return;
        }

        // Standard flow: show toast + redirect to Messenger
        toast({
          title: "Order Placed Successfully",
          description: `Your Order Number is: ${res.orderNumber}. Please save this to track your order. Redirecting to Messenger...`,
          duration: 15000,
        });
        setTimeout(() => {
          window.open('https://m.me/LiceriaRose', '_blank');
          setLocation(`/track?order=${res.orderNumber}`);
        }, 3000);
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-[90px] pb-20 text-center">
          <h2 className="text-2xl font-serif mb-4">Your cart is empty</h2>
          <Button onClick={() => setLocation("/")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  // Event dialog helpers
  const formatDate = (d: string) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${months[Number(m)-1]} ${Number(day)}, ${y}`;
  };

  const handleContinueWithEvent = () => {
    setActiveEvent(pendingEvent);
    setShowEventDialog(false);
  };

  const handleChangeDateFromDialog = () => {
    setShowEventDialog(false);
    form.setValue("preferredDeliveryDate", "");
    setActiveEvent(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Event Pricing Dialog */}
      <AnimatePresence>
        {showEventDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              data-testid="event-pricing-dialog"
            >
              {/* Header */}
              <div className="bg-primary px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-widest font-bold">Special Event Date</p>
                    <h3 className="text-white font-serif text-xl">{pendingEvent?.name ?? formatDate(pendingDate)}</h3>
                    <p className="text-white/60 text-xs mt-0.5">{formatDate(pendingDate)}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-foreground">
                  Your selected date falls on <strong>{pendingEvent?.name}</strong>. Special event pricing applies for this date.
                  {pendingEvent?.description && <span className="block mt-1 text-muted-foreground">{pendingEvent.description}</span>}
                </p>

                {pendingEvent && pendingEvent.products.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Price Changes</p>
                    {items.map(item => {
                      const ep = pendingEvent.products.find(p => p.productId === item.productId);
                      const regularPrice = Number(item.product.price);
                      const eventPrice = ep ? Number(ep.eventPrice) : regularPrice;
                      const changed = ep !== undefined && eventPrice !== regularPrice;
                      return (
                        <div key={item.cartKey} className={`flex items-center justify-between text-sm p-3 rounded-lg ${changed ? "bg-primary/5 border border-primary/20" : "bg-muted/40"}`}>
                          <span className="font-medium truncate mr-2">{item.quantity}× {item.product.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {changed && <span className="text-muted-foreground line-through text-xs">₱{(regularPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
                            <span className={changed ? "text-primary font-bold" : "text-foreground"}>
                              ₱{(eventPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center pt-2 border-t font-serif text-base">
                      <span>New Total</span>
                      <span className="text-primary font-bold">
                        ₱{items.reduce((sum, item) => {
                          const ep = pendingEvent.products.find(p => p.productId === item.productId);
                          return sum + (ep ? Number(ep.eventPrice) : Number(item.product.price)) * item.quantity;
                        }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Button onClick={handleContinueWithEvent} className="w-full" data-testid="button-continue-event-price">
                    Continue with {formatDate(pendingDate)} <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="outline" onClick={handleChangeDateFromDialog} className="w-full" data-testid="button-change-date">
                    Choose a Different Date
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 pt-[90px] pb-16 md:pb-32">
        {/* Active event banner */}
        {activeEvent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3"
            data-testid="event-pricing-banner"
          >
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">{activeEvent.name} Pricing Applied</p>
              <p className="text-xs text-muted-foreground">{activeEvent.description || "Special event prices are reflected in your order total below."}</p>
            </div>
          </motion.div>
        )}

        <h1 className="font-serif text-3xl md:text-4xl mb-8 text-center">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Checkout Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Order Type Toggle */}
                <div className="p-1 bg-muted rounded-lg flex gap-1 mb-8">
                  <button
                    type="button"
                    onClick={() => form.setValue("orderType", "delivery")}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-md text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      orderType === "delivery" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Truck className="h-4 w-4" /> Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue("orderType", "pickup");
                      if (selectedPayment === "cod") {
                        form.setValue("paymentMethod", "gcash");
                      }
                    }}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-md text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      orderType === "pickup" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Package className="h-4 w-4" /> Pick Up
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input placeholder="0912 345 6789" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input placeholder="jane@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="customerFbProfile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FB Name or Profile Link</FormLabel>
                        <FormControl><Input placeholder="facebook.com/username" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{orderType === "pickup" ? "Pickup Details" : "Delivery Details"}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="preferredDeliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{orderType === "pickup" ? "Pickup Date" : "Preferred Delivery Date"}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="date" 
                                {...field} 
                                className="appearance-none block w-full [&::-webkit-calendar-picker-indicator]:opacity-70"
                                required
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preferredDeliveryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{orderType === "pickup" ? "Pickup Time" : "Preferred Delivery Time"}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="time" 
                                {...field} 
                                className="appearance-none block w-full [&::-webkit-calendar-picker-indicator]:opacity-70"
                                required
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {orderType === "delivery" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="deliveryAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl><Input placeholder="123 Main St, Village" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl><Input placeholder="Makati" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl><Input placeholder="1200" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>
                  )}

                  <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions</FormLabel>
                        <FormControl><Textarea placeholder={orderType === "pickup" ? "Any special request for your pickup..." : "Note for the rider or special request..."} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Method</h3>
                  {methodsLoading ? (
                    <div className="flex items-center gap-3 py-6 text-muted-foreground text-sm">
                      <PayLoader className="h-4 w-4 animate-spin" /> Loading payment options...
                    </div>
                  ) : (
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => {
                      const selectedBank = uniqueOnlineMethods.find(b => String(b.id) === selectedDownpayment);
                      const codMethod = codMethods[0];

                      const paymentGrid = (label: string) => (
                        <div className="space-y-4" data-testid="section-payment-options">
                          <div className="space-y-3">
                            <p className="text-sm font-medium">{label}</p>
                            {uniqueOnlineMethods.length > 0 ? (
                              <div className="grid grid-cols-2 gap-3">
                                {uniqueOnlineMethods.map((bank) => (
                                  <button
                                    key={bank.id}
                                    type="button"
                                    data-testid={`button-payment-option-${bank.id}`}
                                    onClick={() => form.setValue("downpaymentMethod", String(bank.id), { shouldValidate: true })}
                                    className={cn(
                                      "p-4 border rounded-lg transition-all flex flex-col items-center justify-center gap-2 hover:border-primary",
                                      selectedDownpayment === String(bank.id) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-white"
                                    )}
                                  >
                                    {bank.logoUrl
                                      ? <img src={bank.logoUrl} alt={bank.label} className="h-8 object-contain" data-testid={`img-payment-logo-${bank.id}`} />
                                      : <span className="text-sm font-bold">{bank.label}</span>
                                    }
                                    <span className="text-[10px] uppercase tracking-widest" data-testid={`text-payment-label-${bank.id}`}>{bank.label}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground py-2" data-testid="text-no-online-methods">No online payment options configured yet.</p>
                            )}
                          </div>
                          {selectedBank && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 border rounded-lg bg-white flex flex-col items-center gap-4"
                              data-testid="section-selected-payment-details"
                            >
                              <p className="text-xs font-bold uppercase tracking-widest text-center" data-testid="text-payment-scan-title">
                                {isSelectedCod ? "Scan to Pay Downpayment" : "Scan to Pay Full Amount"}
                              </p>
                              {selectedBank.qrUrl && (
                                <img src={selectedBank.qrUrl} alt={`${selectedBank.label} QR`} className="w-48 h-48 object-contain" data-testid="img-payment-qr" />
                              )}
                              {selectedBank.instructions && (
                                <p className="text-sm text-muted-foreground text-center whitespace-pre-line" data-testid="text-payment-instructions">{selectedBank.instructions}</p>
                              )}
                              <div className="mt-2 p-4 bg-amber-50 border-2 border-amber-400 rounded-md text-center space-y-2 shadow-md" data-testid="notice-payment-final-step">
                                <p className="text-[11px] font-extrabold text-amber-700 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-amber-600" /> IMPORTANT — FINAL STEP
                                </p>
                                <p className="text-sm font-bold text-amber-900 leading-relaxed">
                                  After clicking <span className="underline decoration-2">"Place Order"</span>, you MUST send your <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded">receipt / proof of payment</span> to our Messenger to confirm your order.
                                </p>
                                <p className="text-[10px] text-amber-600 font-semibold">Orders without proof will not be confirmed.</p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );

                      return (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-3">
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue("downpaymentMethod", "");
                                }}
                                value={field.value}
                                className="flex flex-col gap-3"
                              >
                                {!isCodDisabled && codMethods.length > 0 && (
                                  <FormItem className={cn(
                                    "flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-all",
                                    isSelectedCod ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-white"
                                  )}>
                                    <FormControl>
                                      <RadioGroupItem value="cod" data-testid="radio-payment-cod" />
                                    </FormControl>
                                    <div className="flex-1">
                                      <FormLabel className="font-medium cursor-pointer">Cash on Delivery</FormLabel>
                                      <p className="text-xs text-muted-foreground mt-1">Pay balance when your order arrives.</p>
                                    </div>
                                  </FormItem>
                                )}

                                <AnimatePresence>
                                  {isSelectedCod && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -6 }}
                                      className="space-y-3 rounded-md border bg-white p-4"
                                    >
                                      <div className="text-sm text-red-600 font-medium p-3 bg-red-50 rounded border border-red-100 flex gap-2 items-start" data-testid="notice-cod-downpayment">
                                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div>
                                          <p>A ₱500.00 downpayment is required for COD orders to confirm your slot and avoid cancellations.</p>
                                          {codMethod?.instructions && (
                                            <p className="mt-2 text-red-500 whitespace-pre-line">{codMethod.instructions}</p>
                                          )}
                                        </div>
                                      </div>
                                      {paymentGrid("Choose where to pay your downpayment:")}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                <FormItem className={cn(
                                  "flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-all",
                                  isSelectedOnline ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-white"
                                )}>
                                  <FormControl>
                                    <RadioGroupItem value="online" data-testid="radio-payment-online" />
                                  </FormControl>
                                  <div className="flex-1">
                                    <FormLabel className="font-medium cursor-pointer">Online / Digital Payment</FormLabel>
                                    <p className="text-xs text-muted-foreground mt-1">Pay via GCash, Maya, or bank transfer.</p>
                                  </div>
                                </FormItem>

                                <AnimatePresence>
                                  {isSelectedOnline && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -6 }}
                                      className="rounded-md border bg-white p-4"
                                    >
                                      {paymentGrid("Choose your online payment option:")}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {paymongoEnabled && (
                                  <>
                                    <FormItem className={cn(
                                      "flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-all",
                                      isPaymongo ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-white"
                                    )}>
                                      <FormControl>
                                        <RadioGroupItem value="paymongo" data-testid="radio-payment-paymongo" />
                                      </FormControl>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <FormLabel className="font-medium cursor-pointer">Pay Online via PayMongo</FormLabel>
                                          <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Secure</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">GCash · Maya · Credit/Debit Card — processed securely by PayMongo.</p>
                                      </div>
                                    </FormItem>
                                    <AnimatePresence>
                                      {isPaymongo && (
                                        <motion.div
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -6 }}
                                          className="rounded-md border bg-primary/5 border-primary/20 p-4 flex items-start gap-3"
                                        >
                                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                          <div className="text-sm text-foreground space-y-1">
                                            <p className="font-medium">You'll be redirected to PayMongo's secure checkout</p>
                                            <p className="text-muted-foreground text-xs">After placing your order, you'll be sent to PayMongo to complete payment via GCash, Maya, or card. Your order is automatically confirmed once payment is received — no need to send a screenshot!</p>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </>
                                )}
                              </RadioGroup>

                              {orderType === "pickup" && codMethods.length > 0 && (
                                <div className="text-sm text-red-600 font-medium p-4 bg-red-50 rounded border border-red-100 flex flex-col gap-2 items-start" data-testid="notice-pickup-payment">
                                  <div className="flex gap-2 items-start">
                                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                    <p>For pickup orders, please pay the ₱500.00 downpayment or full amount online to secure your slot.</p>
                                  </div>
                                </div>
                              )}

                              {paymentMethodsList.length === 0 && (
                                <p className="text-sm text-muted-foreground py-2" data-testid="text-no-payment-methods">No payment methods configured yet.</p>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-white rounded-none mt-8 font-serif tracking-wide shadow-lg transition-transform active:scale-[0.98]"
                  disabled={isPending || paymongoRedirecting}
                  data-testid="button-place-order"
                >
                  {paymongoRedirecting ? (
                    <span className="flex items-center gap-2"><PayLoader className="h-4 w-4 animate-spin" /> Redirecting to PayMongo...</span>
                  ) : isPending ? "Processing..." : 
                   selectedPayment === "paymongo" ? `Pay ₱${effectiveTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} via PayMongo` :
                   orderType === "pickup" ? "Place Order" :
                   selectedPayment === "cod" ? "Place Order • Downpayment" :
                   `Place Order • ₱${effectiveTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div className="bg-secondary p-8 h-fit rounded-lg border border-border/50 shadow-sm sticky top-24">
            <h3 className="font-serif text-2xl mb-6 flex items-center gap-3">
              Order Summary
            </h3>
            <div className="space-y-6">
              {items.map((item) => {
                const eventPrice = eventPriceMap.get(item.productId);
                const regularPrice = Number(item.product.price);
                const displayPrice = eventPrice !== undefined ? eventPrice : regularPrice;
                const hasEventPrice = eventPrice !== undefined && eventPrice !== regularPrice;
                return (
                  <div key={item.cartKey} className="flex gap-4 text-sm group">
                    <div className="h-16 w-16 bg-white border border-border/50 rounded overflow-hidden shrink-0">
                      <img
                        src={item.variantImageUrl || item.product.images?.[0] || ""}
                        alt={item.product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">{item.quantity}x {item.product.name}</span>
                      {item.variantColorName && (
                        <span className="text-[10px] uppercase tracking-widest text-primary">{item.variantColorName}</span>
                      )}
                      <div className="flex items-center gap-2">
                        {hasEventPrice && (
                          <span className="text-muted-foreground line-through text-xs">₱{(regularPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        )}
                        <span className={`font-medium ${hasEventPrice ? "text-primary" : ""}`}>
                          ₱{(displayPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        {hasEventPrice && <span className="text-[9px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Event</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <Separator className="my-6" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₱{effectiveTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {activeEvent && (
                  <div className="flex justify-between text-sm text-primary font-medium">
                    <span className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {activeEvent.name} Pricing</span>
                    <span>Applied</span>
                  </div>
                )}
                {orderType === "delivery" && (
                  <div className="flex justify-between text-sm text-primary font-medium">
                    <span className="flex items-center gap-2">Delivery Fee <Info className="h-3 w-3" /></span>
                    <span>To be quoted</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-serif pt-4 border-t">
                  <span>Total Amount</span>
                  <span className="text-primary">₱{effectiveTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {orderType === "pickup" && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Package className="h-3 w-3" /> Boutique Pickup
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Please visit our boutique at the scheduled time. <strong>₱500.00 downpayment</strong> is required to confirm your reservation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
