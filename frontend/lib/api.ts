import { API_BASE } from "@/lib/constants";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const userId = localStorage.getItem("userId");
  const storeId = localStorage.getItem("storeId");

  return {
    ...(userId ? { "x-user-id": userId } : {}),
    ...(storeId ? { "x-store-id": storeId } : {}),
  };
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

  if (!res.ok) {
    throw new ApiError(
      res.status,
      `[${res.status}] ${path} — ${res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}
