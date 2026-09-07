import { create } from 'zustand';
import { UserProfile } from '@travel-diary/contracts';
import { api } from '../../lib/api-client';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  login: (user, token) => {
    api.setToken(token);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    api.setToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<{ success: boolean; data: UserProfile }>('/auth/me');
      if (response.success && response.data) {
        set({ user: response.data, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
