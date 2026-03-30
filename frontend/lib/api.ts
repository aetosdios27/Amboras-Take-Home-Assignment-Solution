import { API_BASE } from "@/lib/constants";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });

  /* ── Auto-logout on 401 (expired / invalid token) ── */
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("storeId");
    localStorage.removeItem("userId");
    window.location.href = "/login";
    throw new ApiError(401, "Session expired — redirecting to login");
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      `[${res.status}] ${path} — ${res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}
