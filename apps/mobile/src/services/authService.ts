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

  async updateProfile(data: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string }): Promise<User> {
    const response = await api.patch<User>('/users/profile', data);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.patch('/users/password', { currentPassword, newPassword });
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/users/account');
  },

  async createMairieAccount(data: { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string }): Promise<LoginResponse> {
    // This endpoint will be called by super admins only
    // The backend will verify the user is an admin and use the server-side SUPER_ADMIN_CODE
    const response = await api.post<LoginResponse>('/auth/create-mairie', data);
    return response.data;
  },

  logout() {
    setAuthToken(null);
  },
};
