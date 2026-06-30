import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductVariant } from '@shared/schema';

export type CartItem = {
  cartKey: string;
  productId: number;
  product: Product;
  quantity: number;
  variantId?: number;
  variantColorName?: string;
  variantImageUrl?: string;
  variantColorHex?: string;
};

type CartState = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
};

function makeCartKey(productId: number, variantId?: number) {
  return variantId ? `${productId}-v${variantId}` : `${productId}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      addItem: (product, quantity = 1, variant?) => {
        const cartKey = makeCartKey(product.id, variant?.id);
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.cartKey === cartKey);

        let newItems;
        if (existingItem) {
          newItems = currentItems.map((item) =>
            item.cartKey === cartKey
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...currentItems, {
            cartKey,
            productId: product.id,
            product,
            quantity,
            variantId: variant?.id,
            variantColorName: variant?.colorName,
            variantImageUrl: variant?.imageUrl ?? undefined,
            variantColorHex: variant?.colorHex ?? undefined,
          }];
        }

        set({
          items: newItems,
          total: calculateTotal(newItems),
        });
      },
      removeItem: (cartKey) => {
        const newItems = get().items.filter((item) => item.cartKey !== cartKey);
        set({ items: newItems, total: calculateTotal(newItems) });
      },
      updateQuantity: (cartKey, quantity) => {
        if (quantity < 1) return;
        const newItems = get().items.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity } : item
        );
        set({ items: newItems, total: calculateTotal(newItems) });
      },
      clearCart: () => set({ items: [], total: 0 }),
    }),
    { name: 'rulvelt-cart-v2' }
  )
);

function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0);
}
