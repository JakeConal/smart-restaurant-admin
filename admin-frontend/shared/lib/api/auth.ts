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
}

export const authApi = new AuthApi();
