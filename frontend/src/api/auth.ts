import { apiClient } from './client';
import type { User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export const authApi = {
  // POST /api/v1/auth/login -> { user, accessToken, refreshToken }
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  // POST /api/v1/auth/refresh { refreshToken } -> { user, accessToken, refreshToken }
  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return data;
  },

  // POST /api/v1/auth/logout { refreshToken } -> { success: true }
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  // GET /api/v1/auth/me -> { user }
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<{ user: User }>('/auth/me');
    return data.user;
  },
};
