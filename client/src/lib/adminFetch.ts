import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { getAdminToken } from "@/hooks/use-auth";

/**
 * Wrapper for all admin API calls.
 * - Automatically redirects to /login if session expires (401)
 * - Returns the raw Response for further checking
 */
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    // Session expired — clear auth state and redirect to login
    localStorage.removeItem("liceria-admin-token");
    queryClient.setQueryData([api.auth.me.path], null);
    queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  return res;
}

/**
 * Reads the error body from a failed response and throws with the server's message.
 */
export async function throwWithMessage(res: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body = await res.json();
    if (body?.message) {
      message = body.message;
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        message += ": " + body.errors.map((e: any) => `${e.path}: ${e.message}`).join(", ");
      } else if (body.error) {
        message += ": " + body.error;
      }
    }
  } catch {}
  throw new Error(message);
}
