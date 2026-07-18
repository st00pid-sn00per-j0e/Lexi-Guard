import { API_URL } from "./api";

export type ApiError = { message: string; status: number; detail?: unknown };

// Cookie-based auth: credentials are included automatically.
export function getAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

let isRefreshing = false;
let failedQueue: { resolve: () => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit & { skipContentType?: boolean } = {}
): Promise<Response> {
  const { skipContentType, ...init } = options;
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && !skipContentType) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...init, headers, credentials: "include" });

  const isAuthRefresh = url.includes("/auth/refresh");
  const isAuthLogin = url.includes("/auth/login");

  if (response.status === 401 && !isAuthRefresh && !isAuthLogin) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve: () => resolve(fetchWithAuth(url, options)), reject });
      });
    }

    isRefreshing = true;
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        throw new Error("Session expired");
      }

      processQueue(null);
      return fetch(url, { ...init, headers, credentials: "include" });
    } catch (error) {
      processQueue(error);
      if (typeof window !== "undefined") {
        window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
      }
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

export async function fetchJsonWithAuth<T>(
  url: string,
  options: RequestInit & { skipContentType?: boolean } = {}
): Promise<T> {
  const response = await fetchWithAuth(url, options);

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Leave data as null if parsing fails
  }

  if (!response.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail && typeof detail === "object" && "msg" in detail
        ? String((detail as { msg: unknown }).msg)
        : response.statusText || "Request failed";
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return data as T;
}


