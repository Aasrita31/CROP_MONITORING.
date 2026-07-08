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
  isLoading: boolean;       // true only while an async auth API call is in flight
  isInitialized: boolean;   // true once initialize() has finished (success or failure)

  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<UserProfile>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  setUser: (user: UserProfile) => void;
  initialize: () => Promise<void>;
}

// Race a promise against a timeout so we never hang forever
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,       // starts false — no spinner on first render
  isInitialized: false,   // becomes true once we've checked localStorage

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
      isInitialized: true,
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
      isInitialized: true,
    });
  },

  refreshAuth: async () => {
    const refreshTk = localStorage.getItem("agritwin_refresh_token");
    if (!refreshTk) {
      set({ isLoading: false, isInitialized: true });
      return;
    }
    try {
      const response = await withTimeout(authApi.refreshToken(refreshTk), 5000);
      localStorage.setItem("agritwin_token", response.access_token);
      localStorage.setItem("agritwin_refresh_token", response.refresh_token);
      set({
        user: response.user,
        token: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      localStorage.removeItem("agritwin_token");
      localStorage.removeItem("agritwin_refresh_token");
      set({ isLoading: false, isAuthenticated: false, user: null, isInitialized: true });
    }
  },

  setUser: (user: UserProfile) => {
    set({ user });
  },

  initialize: async () => {
    // Don't run twice
    if (get().isInitialized) return;

    const token = localStorage.getItem("agritwin_token");
    if (!token) {
      // No token — immediately mark as done, user is not authenticated
      set({ isLoading: false, isInitialized: true });
      return;
    }

    // We have a token, show a brief loading indicator while we validate it
    set({ isLoading: true });

    try {
      const user = await withTimeout(authApi.getMe(token), 5000);
      set({
        user,
        token,
        refreshToken: localStorage.getItem("agritwin_refresh_token"),
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      // Token expired — try to refresh
      try {
        await get().refreshAuth();
      } catch {
        localStorage.removeItem("agritwin_token");
        localStorage.removeItem("agritwin_refresh_token");
        set({ isLoading: false, isAuthenticated: false, user: null, isInitialized: true });
      }
    }
  },
}));

// Auto-initialize immediately when the module loads on the client.
// This means by the time React renders and useEffect fires, the auth
// check is already in progress (or done if no token).
if (typeof window !== "undefined") {
  useAuthStore.getState().initialize();
}
