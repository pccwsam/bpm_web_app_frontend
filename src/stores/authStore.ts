import { create } from "zustand";
import apiClient from "../services/api";

interface User {
  id: number;
  okta_user_id: string;
  email: string;
  name: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  loginDemo: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<boolean>;
  initializeFromCookie: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isDemoMode: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: async () => {
    try {
      // Call backend to clear cookies
      await apiClient.post("/api/auth/demo/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear state regardless of backend call success
      set({ user: null, isAuthenticated: false });
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  /**
   * Initialize auth state from cookie.
   * Since tokens are in httpOnly cookies, we can't read them directly.
   * Instead, we verify by fetching current user info.
   */
  initializeFromCookie: async () => {
    try {
      const response = await apiClient.get("/api/auth/me");
      if (response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch (error) {
      // Not authenticated or token expired
      console.debug("No valid session found");
    }
    set({ isLoading: false });
  },
  /**
   * Login with demo credentials.
   * Backend sets httpOnly cookies, frontend only stores user info.
   */
  // loginDemo: async (username: string, password: string) => {
  //   try {
  //     const response = await apiClient.post('/api/auth/demo/login', {
  //       username: username.toLowerCase(),
  //       password,
  //     });

  //     if (response.data.access_token) {
  //       const { user } = response.data;
  //       // Store user info only (token is in httpOnly cookie)
  //       get().setUser(user as User);
  //       return { success: true };
  //     } else {
  //       return { success: false, error: 'Invalid response from server' };
  //     }
  //   } catch (error: any) {
  //     const errorMessage = error.response?.data?.detail || 'Login failed';
  //     return { success: false, error: errorMessage };
  //   }
  // },
  /**
   * Login with demo credentials (Mocked completely on frontend).
   * Bypasses the API server and resolves instantly with mock admin data.
   */
  loginDemo: async (username: string, password: string) => {
    try {
      // Simulate a small network delay for realism (Optional, remove if you want instant response)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Hardcoded response matching your server's payload format
      const mockResponse = {
        access_token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLWFkbWluIiwiZW1haWwiOiJhZG1pbkBkZW1vLmNvbSIsIm5hbWUiOiJBZG1pbiBVc2VyIiwicm9sZXMiOlsiYWRtaW4iLCJwbGFubmVyIiwiYXBwcm92ZXIiXSwiZXhwIjoxNzc5ODc0NDk5LCJ0eXBlIjoiYWNjZXNzIn0.lpY_Kr8ex_U8QBC-rRTcUg9HQ4Hd6MiDG3TiNN7n2Fs",
        token_type: "bearer",
        expires_in: 900,
        user: {
          id: 0,
          okta_user_id: "demo_okta_id", // Added to fulfill your strict User interface requirements
          email: "admin@demo.com",
          name: "Admin User",
          roles: ["admin", "planner", "approver"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
      };

      if (mockResponse.access_token) {
        const { user } = mockResponse;
        // Store user info in Zustand state
        get().setUser(user as User);
        return { success: true };
      } else {
        return { success: false, error: "Invalid mock data configuration" };
      }
    } catch (error: any) {
      return { success: false, error: "Login failed" };
    }
  },
  /**
   * Refresh access token using refresh token cookie.
   * Called automatically when access token is about to expire.
   */
  refreshToken: async () => {
    try {
      const response = await apiClient.post("/api/auth/demo/refresh");
      if (response.data.access_token) {
        console.debug("Token refreshed successfully");
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Token refresh failed:", error);
      // If refresh fails, user needs to re-login
      get().logout();
      return false;
    }
  },
}));
