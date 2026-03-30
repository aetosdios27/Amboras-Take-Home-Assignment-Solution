import { API_BASE } from "@/lib/constants";
import { ApiError } from "@/lib/api";

export interface LoginResponse {
  access_token: string;
  user_id: string;
  store_id: string;
}

export const authService = {
  async login(userId: string, storeId: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, storeId }),
    });

    if (!res.ok) {
      throw new ApiError(res.status, `Login failed: ${res.statusText}`);
    }

    return res.json() as Promise<LoginResponse>;
  },
};
