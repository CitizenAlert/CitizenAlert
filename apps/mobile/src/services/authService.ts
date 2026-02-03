import { api, setAuthToken } from './api';
import { LoginResponse, RegisterData, User } from '@/types/auth';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
    }
    return response.data;
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', data);
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
    }
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },

  logout() {
    setAuthToken(null);
  },
};
