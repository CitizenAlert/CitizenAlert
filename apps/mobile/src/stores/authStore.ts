import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';
import { User, RegisterData } from '@/types/auth';
import { getErrorMessage } from '@/utils/errorHandler';
import { setAuthToken } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isValidating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
  validateToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isValidating: true,

      login: async (email: string, password: string) => {
        try {
          const response = await authService.login(email, password);
          setAuthToken(response.access_token);
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
          setAuthToken(response.access_token);
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
        setAuthToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      validateToken: async () => {
        const state = useAuthStore.getState();
        if (!state.token) {
          set({ isAuthenticated: false, isValidating: false });
          return false;
        }

        try {
          // Try to fetch profile with stored token
          const user = await authService.getProfile();
          set({ user, isAuthenticated: true, isValidating: false });
          return true;
        } catch (error: any) {
          // Token is invalid/expired
          if (error.response?.status === 401 || error.response?.status === 403) {
            setAuthToken(null);
            set({ user: null, token: null, isAuthenticated: false, isValidating: false });
            return false;
          }
          // Network error or other issue - assume token is valid for now
          set({ isValidating: false });
          return true;
        }
      },

      hydrate: async () => {
        // This will be called after store is rehydrated from storage
        const state = useAuthStore.getState();
        if (state.token) {
          setAuthToken(state.token);
          // Validate token with backend
          await state.validateToken();
        } else {
          set({ isAuthenticated: false, isValidating: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Use JSON-based storage to ensure values are always strings
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // After rehydration, validate the token
        state?.hydrate();
      },
    }
  )
);
