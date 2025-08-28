import axios from 'axios';
import { apiClient } from './apiClient';

interface LoginResponse {
  user: any;
  token: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  university: string;
  batch: string;
  course: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post('/users/auth/login', { email, password });
    return response.data.data;
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post('/users/auth/register', userData);
    return response.data.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/users/auth/logout');
  }

  async getProfile(): Promise<any> {
    const response = await apiClient.get('/users/auth/profile');
    return response.data.data;
  }

  async updateProfile(updates: any): Promise<any> {
    const response = await apiClient.put('/users/profile', updates);
    return response.data.data;
  }

  async refreshToken(): Promise<LoginResponse> {
    const response = await apiClient.post('/users/auth/refresh-token');
    return response.data.data;
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/users/auth/verify-email', { token });
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/users/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/users/auth/reset-password', { token, password });
  }

  async uploadProfilePhoto(file: File): Promise<{ photo: string }> {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await apiClient.post('/users/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async searchUsers(query: {
    q?: string;
    university?: string;
    batch?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const response = await apiClient.get('/users/search', { params: query });
    return response.data.data;
  }

  async updatePrivacySettings(settings: {
    showSchedule?: 'public' | 'friends' | 'private';
    showLocation?: 'public' | 'friends' | 'private';
    allowFriendRequests?: boolean;
    showOnlineStatus?: boolean;
  }): Promise<any> {
    const response = await apiClient.put('/users/privacy', settings);
    return response.data.data;
  }

  async getUserById(userId: string): Promise<any> {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data.data;
  }

  async deactivateAccount(password: string): Promise<void> {
    await apiClient.post('/users/deactivate', { password });
  }
}

export const authService = new AuthService();
