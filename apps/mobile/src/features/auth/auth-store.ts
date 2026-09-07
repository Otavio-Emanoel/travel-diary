import { create } from 'zustand';
import { mobileApiClient } from '../../services/api-client';
import { SecureStoreService } from '../../services/secure-store-service';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initializeAuth: async () => {
    try {
      const refreshToken = await SecureStoreService.getRefreshToken();
      if (refreshToken) {
        // Tenta renovar a sessão
        const res = await mobileApiClient.request('/api/v1/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });

        if (res.data?.accessToken) {
          mobileApiClient.setAccessToken(res.data.accessToken);
          if (res.data.user) {
            set({ user: res.data.user, isAuthenticated: true, isLoading: false });
            return;
          }
        }
      }
    } catch (_e) {
      // Ignora erro
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const res = await mobileApiClient.login(email, password);
    set({ isLoading: false });

    if (res.data?.user) {
      set({ user: res.data.user, isAuthenticated: true });
      return { success: true };
    }
    return { success: false, error: res.error?.message || 'Falha na autenticação' };
  },

  register: async (email, password, name) => {
    set({ isLoading: true });
    const res = await mobileApiClient.register(email, password, name);
    set({ isLoading: false });

    if (res.data?.user) {
      set({ user: res.data.user, isAuthenticated: true });
      return { success: true };
    }
    return { success: false, error: res.error?.message || 'Falha no registro' };
  },

  logout: async () => {
    await mobileApiClient.logout();
    set({ user: null, isAuthenticated: false });
  },
}));
