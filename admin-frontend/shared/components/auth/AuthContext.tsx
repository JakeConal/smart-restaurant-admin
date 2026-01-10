"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  authApi,
  LoginRequest,
  SignupRequest,
  AuthResponse,
} from "@/shared/lib/api";
import { useToast } from "@/shared/components/ui";

interface User {
  id: string;
  email: string;
  role: string;
  restaurantId: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error: showError } = useToast();

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authApi.login(data);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem("authToken", response.access_token);
      localStorage.setItem("authUser", JSON.stringify(response.user));
      success("Login successful! Welcome back!");
    } catch (authError) {
      showError("Login failed. Please check your credentials and try again.");
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupRequest) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authApi.signup(data);
      // Don't auto-login after signup - user needs to verify email first
      // Just return success, login page will show email verification message
      success("Account created! Please check your email to verify.");
    } catch (authError) {
      showError("Signup failed. Please try again.");
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      setIsLoading(true);
      await authApi.googleLogin();
    } catch (authError) {
      showError("Google login failed. Please try again.");
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    success("Logged out successfully.");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, signup, googleLogin, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
