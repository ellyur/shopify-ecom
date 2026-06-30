import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ProductRatingSummary } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

function getBrowserKey(): string {
  let key = localStorage.getItem("rating_browser_key");
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("rating_browser_key", key);
  }
  return key;
}

function getPurchasedOrders(): { orderNumber: string; productIds: number[] }[] {
  try {
    const raw = localStorage.getItem("purchased_orders");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getOrderNumberForProduct(productId: number): string | null {
  const orders = getPurchasedOrders();
  const match = orders.find(o => o.productIds.includes(productId));
  return match ? match.orderNumber : null;
}

export function useProductRating(productId: number) {
  const browserKey = getBrowserKey();
  const queryClient = useQueryClient();
  const orderNumber = getOrderNumberForProduct(productId);
  const canRate = !!orderNumber;

  const query = useQuery<ProductRatingSummary>({
    queryKey: ["/api/products", productId, "ratings"],
    queryFn: () =>
      fetch(`/api/products/${productId}/ratings?browserKey=${encodeURIComponent(browserKey)}`)
        .then((r) => r.json()),
    staleTime: 30000,
  });

  const mutation = useMutation({
    mutationFn: (stars: number) =>
      apiRequest("POST", `/api/products/${productId}/ratings`, { stars, browserKey, orderNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "ratings"] });
    },
  });

  return {
    rating: query.data,
    isLoading: query.isLoading,
    myRating: query.data?.myRating ?? null,
    canRate,
    submitRating: (stars: number) => mutation.mutate(stars),
    isPending: mutation.isPending,
  };
}
