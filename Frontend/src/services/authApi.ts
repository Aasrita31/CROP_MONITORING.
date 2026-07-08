import { apiClient } from "./apiClient";
import type { UserProfile } from "@/stores/authStore";

export interface LoginData {
  identifier: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
  state?: string;
  district?: string;
  village?: string;
  preferred_language?: string;
  visibility?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface ProfileUpdateData {
  full_name?: string;
  phone?: string;
  village?: string;
  district?: string;
  state?: string;
  preferred_language?: string;
  visibility?: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<UserProfile> => {
    const res = await apiClient.post("/auth/register", data);
    return res.data;
  },

  login: async (data: LoginData): Promise<TokenResponse> => {
    const res = await apiClient.post("/auth/login", data);
    return res.data;
  },

  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const res = await apiClient.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return res.data;
  },

  getMe: async (token: string): Promise<UserProfile> => {
    const res = await apiClient.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post("/auth/forgot-password", { email });
    return res.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const res = await apiClient.post("/auth/verify-otp", { email, otp });
    return res.data;
  },

  resetPassword: async (email: string, otp: string, new_password: string) => {
    const res = await apiClient.post("/auth/reset-password", {
      email,
      otp,
      new_password,
    });
    return res.data;
  },

  getProfile: async (token: string): Promise<UserProfile> => {
    const res = await apiClient.get("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  updateProfile: async (
    token: string,
    data: ProfileUpdateData
  ): Promise<UserProfile> => {
    const res = await apiClient.put("/profile", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  updateVisibility: async (
    token: string,
    visibility: string
  ): Promise<UserProfile> => {
    const res = await apiClient.put(
      "/profile/visibility",
      { visibility },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};
