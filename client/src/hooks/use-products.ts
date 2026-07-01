import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProduct, type InsertCategory, type ProductVariant, type InsertSpecialOffer, type SpecialOffer, type Setting, type PaymentMethod, type InsertPaymentMethod } from "@shared/schema";
import { adminFetch, throwWithMessage } from "@/lib/adminFetch";

// Public Hooks
export function useProducts(filters?: { category?: string; search?: string; sort?: string; limit?: number }) {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.append("category", filters.category);
  if (filters?.search) queryParams.append("search", filters.search);
  if (filters?.sort) queryParams.append("sort", filters.sort);
  if (filters?.limit) queryParams.append("limit", String(filters.limit));

  return useQuery({
    queryKey: [api.products.list.path, filters],
    queryFn: async () => {
      const url = `${api.products.list.path}?${queryParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

const PAGE_SIZE = 12;

export function useInfiniteProducts(filters?: { category?: string; search?: string }) {
  return useInfiniteQuery({
    queryKey: [api.products.list.path, "infinite", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.append("category", filters.category);
      if (filters?.search) queryParams.append("search", filters.search);
      queryParams.append("limit", String(PAGE_SIZE));
      queryParams.append("offset", String(pageParam));
      const url = `${api.products.list.path}?${queryParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
    initialPageParam: 0,
  });
}

export function useProductsCount(filters?: { category?: string; search?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.append("category", filters.category);
  if (filters?.search) queryParams.append("search", filters.search);
  return useQuery<{ total: number }>({
    queryKey: ["/api/products/count", filters],
    queryFn: async () => {
      const res = await fetch(`/api/products/count?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch count");
      return res.json();
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: [api.products.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      return api.products.get.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

export function useSpecialOffers() {
  return useQuery<SpecialOffer[]>({
    queryKey: [api.specialOffers.list.path],
    queryFn: async () => {
      const res = await fetch(api.specialOffers.list.path);
      if (!res.ok) throw new Error("Failed to fetch special offers");
      return api.specialOffers.list.responses[200].parse(await res.json());
    },
  });
}

export function usePublicSettings() {
  return useQuery<Setting[]>({
    queryKey: [api.settings.list.path],
    queryFn: async () => {
      const res = await fetch(api.settings.list.path);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.settings.list.responses[200].parse(await res.json());
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useAllProducts(filters?: { search?: string }, enabled = true) {
  const queryParams = new URLSearchParams();
  if (filters?.search) queryParams.append("search", filters.search);
  queryParams.append("limit", "9999");
  return useQuery({
    queryKey: [api.products.list.path, "all-grouped", filters],
    queryFn: async () => {
      const url = `${api.products.list.path}?${queryParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
    enabled,
  });
}

// Admin Hooks
export function useAdminProducts() {
  return useQuery({
    queryKey: [api.admin.products.list.path],
    queryFn: async () => {
      const res = await adminFetch(api.admin.products.list.path);
      if (!res.ok) throw new Error("Failed to fetch admin products");
      return api.admin.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useAdminSettings() {
  return useQuery<Setting[]>({
    queryKey: [api.admin.settings.list.path],
    queryFn: async () => {
      const res = await adminFetch(api.admin.settings.list.path);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.admin.settings.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const url = buildUrl(api.admin.settings.update.path, { key });
      const res = await adminFetch(url, {
        method: api.admin.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to update setting");
      return api.admin.settings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.settings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.settings.list.path] });
    },
  });
}

export function useAdminSpecialOffers() {
  return useQuery<SpecialOffer[]>({
    queryKey: [api.admin.specialOffers.list.path],
    queryFn: async () => {
      const res = await adminFetch(api.admin.specialOffers.list.path);
      if (!res.ok) throw new Error("Failed to fetch special offers");
      return api.admin.specialOffers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSpecialOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSpecialOffer) => {
      const res = await adminFetch(api.admin.specialOffers.create.path, {
        method: api.admin.specialOffers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to create special offer");
      return api.admin.specialOffers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.specialOffers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.specialOffers.list.path] });
    },
  });
}

export function useUpdateSpecialOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertSpecialOffer>) => {
      const url = buildUrl(api.admin.specialOffers.update.path, { id });
      const res = await adminFetch(url, {
        method: api.admin.specialOffers.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to update special offer");
      return api.admin.specialOffers.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.specialOffers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.specialOffers.list.path] });
    },
  });
}

export function useDeleteSpecialOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.specialOffers.delete.path, { id });
      const res = await adminFetch(url, {
        method: api.admin.specialOffers.delete.method,
      });
      if (!res.ok) await throwWithMessage(res, "Failed to delete special offer");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.specialOffers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.specialOffers.list.path] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await adminFetch(api.admin.products.create.path, {
        method: api.admin.products.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to create product");
      return api.admin.products.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertProduct>) => {
      const url = buildUrl(api.admin.products.update.path, { id });
      const res = await adminFetch(url, {
        method: api.admin.products.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to update product");
      return api.admin.products.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.products.delete.path, { id });
      const res = await adminFetch(url, {
        method: api.admin.products.delete.method,
      });
      if (!res.ok) await throwWithMessage(res, "Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCategory) => {
      const res = await adminFetch(api.admin.categories.create.path, {
        method: api.admin.categories.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to create category");
      return api.admin.categories.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.categories.list.path] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.categories.delete.path, { id });
      const res = await adminFetch(url, {
        method: api.admin.categories.delete.method,
      });
      if (!res.ok) await throwWithMessage(res, "Failed to delete category");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.categories.list.path] }),
  });
}

// Variant Hooks (Public)
export function useProductVariants(productId: number | undefined) {
  return useQuery<ProductVariant[]>({
    queryKey: ["/api/products", productId, "variants"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/variants`);
      if (!res.ok) throw new Error("Failed to fetch variants");
      return res.json();
    },
    enabled: !!productId,
  });
}

// Variant Hooks (Admin)
export function useAdminProductVariants(productId: number | undefined) {
  return useQuery<ProductVariant[]>({
    queryKey: ["/api/admin/products", productId, "variants"],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/products/${productId}/variants`);
      if (!res.ok) throw new Error("Failed to fetch variants");
      return res.json();
    },
    enabled: !!productId,
  });
}

export function useCreateVariant(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProductVariant>) => {
      const res = await adminFetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to create variant");
      return res.json() as Promise<ProductVariant>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products", productId, "variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "variants"] });
    },
  });
}

export function useUpdateVariant(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProductVariant> & { id: number }) => {
      const res = await adminFetch(`/api/admin/products/${productId}/variants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to update variant");
      return res.json() as Promise<ProductVariant>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products", productId, "variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "variants"] });
    },
  });
}

export function useDeleteVariant(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/products/${productId}/variants/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) await throwWithMessage(res, "Failed to delete variant");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products", productId, "variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "variants"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const url = `/api/admin/categories/${id}`;
      const res = await adminFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to update category");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.categories.list.path] }),
  });
}

// Payment Methods Hooks
export function usePublicPaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: [api.paymentMethods.list.path],
    queryFn: async () => {
      const res = await fetch(api.paymentMethods.list.path);
      if (!res.ok) throw new Error("Failed to fetch payment methods");
      return res.json();
    },
  });
}

export function useAdminPaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: [api.admin.paymentMethods.list.path],
    queryFn: async () => {
      const res = await adminFetch(api.admin.paymentMethods.list.path);
      if (!res.ok) throw new Error("Failed to fetch payment methods");
      return res.json();
    },
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertPaymentMethod) => {
      const res = await adminFetch(api.admin.paymentMethods.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to create payment method");
      return res.json() as Promise<PaymentMethod>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.paymentMethods.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.paymentMethods.list.path] });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertPaymentMethod> & { id: number }) => {
      const url = buildUrl(api.admin.paymentMethods.update.path, { id });
      const res = await adminFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to update payment method");
      return res.json() as Promise<PaymentMethod>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.paymentMethods.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.paymentMethods.list.path] });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.paymentMethods.delete.path, { id });
      const res = await adminFetch(url, { method: "DELETE" });
      if (!res.ok) await throwWithMessage(res, "Failed to delete payment method");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.paymentMethods.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.paymentMethods.list.path] });
    },
  });
}
