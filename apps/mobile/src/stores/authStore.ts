import { create } from 'zustand';
import { authService } from '@/services/authService';
import { User, RegisterData } from '@/types/auth';
import { getErrorMessage } from '@/utils/errorHandler';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  },

  register: async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },
}));
