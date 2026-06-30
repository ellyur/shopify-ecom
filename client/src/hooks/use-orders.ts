import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertOrder } from "@shared/schema";
import { adminFetch, throwWithMessage } from "@/lib/adminFetch";

export function useOrders(filter?: { status?: string; search?: string }) {
  const queryParams = new URLSearchParams();
  if (filter?.status) queryParams.append("status", filter.status);
  if (filter?.search) queryParams.append("search", filter.search);

  return useQuery({
    queryKey: [api.admin.orders.list.path, filter],
    queryFn: async () => {
      const url = `${api.admin.orders.list.path}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await adminFetch(url);
      if (!res.ok) await throwWithMessage(res, "Failed to fetch orders");
      return api.admin.orders.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (data: { order: InsertOrder; items: { productId: number; quantity: number }[] }) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return api.orders.create.responses[201].parse(await res.json());
    },
  });
}

export function useAdminOrders(status?: string) {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append("status", status);

  return useQuery({
    queryKey: [api.admin.orders.list.path, status],
    queryFn: async () => {
      const url = `${api.admin.orders.list.path}?${queryParams.toString()}`;
      const res = await adminFetch(url);
      if (!res.ok) await throwWithMessage(res, "Failed to fetch orders");
      return api.admin.orders.list.responses[200].parse(await res.json());
    },
  });
}

export function useAdminOrder(id: number) {
  return useQuery({
    queryKey: [api.admin.orders.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.admin.orders.get.path, { id });
      const res = await adminFetch(url);
      if (res.status === 404) return null;
      if (!res.ok) await throwWithMessage(res, "Failed to fetch order");
      return api.admin.orders.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.admin.orders.updateStatus.path, { id });
      const res = await adminFetch(url, {
        method: api.admin.orders.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) await throwWithMessage(res, "Failed to update status");
      return api.admin.orders.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.dashboard.path] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) await throwWithMessage(res, "Failed to delete order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.dashboard.path] });
    },
  });
}

export function useAdminDashboard(filter?: { date?: string; month?: string }) {
  const queryParams = new URLSearchParams();
  if (filter?.date) queryParams.append("date", filter.date);
  if (filter?.month) queryParams.append("month", filter.month);

  return useQuery({
    queryKey: [api.admin.dashboard.path, filter],
    queryFn: async () => {
      const url = `${api.admin.dashboard.path}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await adminFetch(url);
      if (!res.ok) await throwWithMessage(res, "Failed to fetch dashboard stats");
      return api.admin.dashboard.responses[200].parse(await res.json());
    },
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: [api.admin.analytics.path],
    queryFn: async () => {
      const res = await adminFetch(api.admin.analytics.path);
      if (!res.ok) await throwWithMessage(res, "Failed to fetch analytics");
      return api.admin.analytics.responses[200].parse(await res.json());
    },
  });
}
