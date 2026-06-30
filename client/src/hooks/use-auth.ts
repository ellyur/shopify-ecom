import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

const loginSchema = z.object({ username: z.string(), password: z.string() });
type LoginInput = z.infer<typeof loginSchema>;
const adminTokenKey = "liceria-admin-token";

export function getAdminToken() {
  return localStorage.getItem(adminTokenKey);
}

function getAuthHeaders() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch auth status");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (creds: LoginInput) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid username or password");
        throw new Error("Login failed");
      }
      const data = await res.json();
      if (data.token) {
        localStorage.setItem(adminTokenKey, data.token);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data.user || data);
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      localStorage.removeItem(adminTokenKey);
      queryClient.setQueryData([api.auth.me.path], null);
    },
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    loginMutation,
    logoutMutation
  };
}

export function useLogin() {
  const { loginMutation } = useAuth();
  return loginMutation;
}

export function useLogout() {
  const { logoutMutation } = useAuth();
  return logoutMutation;
}
