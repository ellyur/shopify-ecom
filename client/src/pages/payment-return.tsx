import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle2, XCircle, Loader2, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";

type ReturnStatus = "loading" | "paid" | "failed" | "pending";

export default function PaymentReturn({ mode }: { mode: "success" | "failed" }) {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderNumber = params.get("order") || localStorage.getItem("paymongo_order") || "";
  const [_, setLocation] = useLocation();
  const [status, setStatus] = useState<ReturnStatus>("loading");
  const [retrying, setRetrying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Small delay so PayMongo webhook has time to fire before we poll
    const timer = setTimeout(async () => {
      if (!orderNumber) {
        setStatus(mode === "success" ? "paid" : "failed");
        return;
      }
      try {
        const res = await fetch(`/api/paymongo/session-status/${orderNumber}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid") {
            setStatus("paid");
            localStorage.removeItem("paymongo_order");
          } else if (mode === "success") {
            // PayMongo redirected to success but webhook may not have arrived yet
            setStatus("paid");
            localStorage.removeItem("paymongo_order");
          } else {
            setStatus("failed");
          }
        } else {
          setStatus(mode === "success" ? "paid" : "failed");
        }
      } catch {
        setStatus(mode === "success" ? "paid" : "failed");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [orderNumber, mode]);

  const handleRetryPayment = async () => {
    if (!orderNumber) return;
    setRetrying(true);
    try {
      const res = await fetch(`/api/paymongo/retry/${orderNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create payment session");
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Could not start payment. Please try again or contact us.",
        variant: "destructive",
      });
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-32 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full text-center space-y-6"
        >
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <h1 className="font-serif text-2xl">Verifying your payment…</h1>
              <p className="text-muted-foreground text-sm">Please wait a moment.</p>
            </>
          )}

          {status === "paid" && (
            <>
              <div className="flex justify-center">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <h1 className="font-serif text-3xl text-green-700">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Your order <strong className="text-foreground">{orderNumber}</strong> has been paid and confirmed. We'll prepare your bouquet right away! 🌸
              </p>
              <div className="flex flex-col gap-3">
                {orderNumber && (
                  <Button
                    onClick={() => setLocation(`/track?order=${orderNumber}`)}
                    className="w-full gap-2"
                  >
                    Track My Order <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" onClick={() => setLocation("/")} className="w-full">
                  Continue Shopping
                </Button>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="flex justify-center">
                <div className="bg-red-100 rounded-full p-4">
                  <XCircle className="h-16 w-16 text-red-500" />
                </div>
              </div>
              <h1 className="font-serif text-3xl text-red-600">Payment Not Completed</h1>
              <p className="text-muted-foreground">
                Your payment was not completed.{" "}
                {orderNumber
                  ? <>Your order <strong className="text-foreground">{orderNumber}</strong> is saved — you can retry payment below.</>
                  : "You can return to checkout and try again."}
              </p>
              <div className="flex flex-col gap-3">
                {orderNumber && (
                  <Button
                    onClick={handleRetryPayment}
                    disabled={retrying}
                    className="w-full gap-2"
                  >
                    {retrying ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Starting payment…</>
                    ) : (
                      <><RotateCcw className="h-4 w-4" /> Retry Payment</>
                    )}
                  </Button>
                )}
                {orderNumber && (
                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/track?order=${orderNumber}`)}
                    className="w-full"
                  >
                    View Order Status
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setLocation("/")} className="w-full">
                  Back to Shop
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
