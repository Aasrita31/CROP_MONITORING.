import { create } from "zustand";
import { authApi, type LoginData, type RegisterData } from "@/services/authApi";

export interface UserProfile {
  id: number;
  email: string;
  phone?: string | null;
  role: string;
  full_name: string;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  preferred_language: string;
  profile_photo_url?: string | null;
  visibility: string;
  joined_date?: string | null;
  is_active: boolean;
  has_farms: boolean;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<UserProfile>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  setUser: (user: UserProfile) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (data: LoginData) => {
    const response = await authApi.login(data);
    localStorage.setItem("agritwin_token", response.access_token);
    localStorage.setItem("agritwin_refresh_token", response.refresh_token);
    set({
      user: response.user,
      token: response.access_token,
      refreshToken: response.refresh_token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (data: RegisterData) => {
    const user = await authApi.register(data);
    return user;
  },

  logout: () => {
    localStorage.removeItem("agritwin_token");
    localStorage.removeItem("agritwin_refresh_token");
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  refreshAuth: async () => {
    const refreshTk = localStorage.getItem("agritwin_refresh_token");
    if (!refreshTk) {
      set({ isLoading: false });
      return;
    }
    try {
      const response = await authApi.refreshToken(refreshTk);
      localStorage.setItem("agritwin_token", response.access_token);
      localStorage.setItem("agritwin_refresh_token", response.refresh_token);
      set({
        user: response.user,
        token: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem("agritwin_token");
      localStorage.removeItem("agritwin_refresh_token");
      set({ isLoading: false, isAuthenticated: false, user: null });
    }
  },

  setUser: (user: UserProfile) => {
    set({ user });
  },

  initialize: async () => {
    const token = localStorage.getItem("agritwin_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await authApi.getMe(token);
      set({
        user,
        token,
        refreshToken: localStorage.getItem("agritwin_refresh_token"),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token might be expired, try refresh
      try {
        await get().refreshAuth();
      } catch {
        set({ isLoading: false, isAuthenticated: false });
      }
    }
  },
}));
