import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";

interface CartDrawerProps {
  trigger?: React.ReactNode;
}

export function CartDrawer({ trigger }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, total } = useCart();
  const [_, setLocation] = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-transparent">
            <ShoppingBag className="h-5 w-5" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {items.length}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md bg-background border-l-border">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl font-normal">Shopping Bag</SheetTitle>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Your bag is empty</p>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white transition-colors" asChild>
              <SheetTrigger>Start Shopping</SheetTrigger>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 my-4">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.cartKey} className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-secondary">
                      <img
                        src={item.variantImageUrl || item.product.images?.[0] || ""}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-serif font-medium">{item.product.name}</h3>
                        {item.variantColorName && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.variantColorHex && (
                              <span className="inline-block h-3 w-3 rounded-full border border-border/50 flex-shrink-0" style={{ backgroundColor: item.variantColorHex }} />
                            )}
                            <span className="text-[10px] uppercase tracking-widest text-primary">{item.variantColorName}</span>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-0.5">₱{Number(item.product.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border rounded-md">
                          <button
                            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                            className="p-1 hover:bg-secondary transition-colors"
                            data-testid={`button-decrease-${item.cartKey}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm" data-testid={`text-quantity-${item.cartKey}`}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                            className="p-1 hover:bg-secondary transition-colors"
                            data-testid={`button-increase-${item.cartKey}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.cartKey)}
                          data-testid={`button-remove-${item.cartKey}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="space-y-4 pt-4">
              <Separator />
              <div className="flex items-center justify-between font-serif text-lg">
                <span>Subtotal</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Shipping and taxes calculated at checkout.
              </p>
              <SheetTrigger asChild>
                <Button
                  className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-white rounded-none"
                  onClick={() => setLocation("/checkout")}
                  data-testid="button-proceed-checkout"
                >
                  Proceed to Checkout
                </Button>
              </SheetTrigger>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
