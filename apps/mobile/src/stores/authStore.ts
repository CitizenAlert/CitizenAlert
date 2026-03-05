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
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

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

      hydrate: () => {
        // This will be called after store is rehydrated from storage
        const state = useAuthStore.getState();
        if (state.token) {
          setAuthToken(state.token);
        }
      },
    }),
    {
      name: 'auth-storage',
      // Use JSON-based storage to ensure values are always strings
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // After rehydration, set the auth token in axios
        if (state?.token) {
          setAuthToken(state.token);
        }
        // Call hydrate to ensure token is set
        state?.hydrate();
      },
    }
  )
);
