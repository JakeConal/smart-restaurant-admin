import { apiClient } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  restaurantName: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: string;
    restaurantId: string;
    firstName?: string;
    lastName?: string;
  };
}

export class AuthApi {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post("/admin-auth/login", data);
    return response.data;
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post("/admin-auth/signup", data);
    return response.data;
  }

  async googleLogin(): Promise<void> {
    window.location.href = `${apiClient.defaults.baseURL}/admin-auth/google`;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post("/admin-auth/verify-email", { token });
    return response.data;
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const response = await apiClient.post("/admin-auth/resend-verification", { email });
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post("/admin-auth/forgot-password", { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post("/admin-auth/reset-password", { 
      token, 
      newPassword 
    });
    return response.data;
  }
}

export const authApi = new AuthApi();
