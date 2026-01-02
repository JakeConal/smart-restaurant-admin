"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { authApi } from "@/lib/api";
import { AuthResponse } from "@/lib/types";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, setToken, login, loginAsGuest, isAuthenticated, customer } =
    useApp();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Get token from URL params (available during SSR)
  const urlToken = searchParams.get("token");

  // Handle token and auth from URL
  useEffect(() => {
    const authToken = searchParams.get("auth_token");
    const authUser = searchParams.get("auth_user");

    if (urlToken && !token) {
      setToken(urlToken);
    }

    // Handle Google OAuth callback
    if (authToken && authUser) {
      try {
        const user = JSON.parse(decodeURIComponent(authUser));
        login({ access_token: authToken, user });
        setShowWelcome(true);
      } catch (e) {
        console.error("Failed to parse auth user:", e);
      }
    }
  }, [searchParams, token, setToken, login, urlToken]);

  // Show welcome message and redirect after login
  useEffect(() => {
    if (showWelcome && isAuthenticated) {
      const timer = setTimeout(() => {
        const currentToken = token || searchParams.get("token");
        if (currentToken) {
          router.push(`/menu?token=${currentToken}`);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, isAuthenticated, token, searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response: AuthResponse;

      if (activeTab === "login") {
        response = (await authApi.customerLogin(
          email,
          password,
        )) as AuthResponse;
      } else {
        response = (await authApi.customerSignup({
          email,
          password,
          firstName,
          lastName,
        })) as AuthResponse;
      }

      login(response);
      setShowWelcome(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const currentToken = token || searchParams.get("token");
    const authUrl = authApi.getGoogleAuthUrl({
      token: currentToken || undefined,
      redirect: "login",
    });
    window.location.href = authUrl;
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    const currentToken = token || searchParams.get("token");
    if (currentToken) {
      router.push(`/menu?token=${currentToken}`);
    }
  };

  // Show welcome message if authenticated
  if (showWelcome && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-white via-blue-50 to-neutral-50">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-heading-xl text-neutral-900 mb-3">
            Welcome{customer ? `, ${customer.firstName || customer.email}` : ""}
            !
          </h1>
          <p className="text-body-lg text-neutral-600 mb-6">
            Taking you to the menu...
          </p>
          <div className="w-10 h-10 border-3 border-neutral-200 border-t-blue-600 rounded-full spinner mx-auto"></div>
        </div>
      </div>
    );
  }

  // No token error
  if (!token && !searchParams.get("token") && !searchParams.get("auth_token")) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-white via-red-50 to-neutral-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-heading-lg text-neutral-900 mb-3">
            Invalid Access
          </h1>
          <p className="text-body-lg text-neutral-600 max-w-sm">
            Please scan a valid QR code at your table to access the menu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-neutral-50">
      {/* Header with logo */}
      <div className="card rounded-none rounded-b-3xl shadow-lg pt-16 pb-8 px-6">
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 justify-center">
          <button
            onClick={() => setActiveTab("login")}
            className={`text-label-lg pb-3 transition-all interactive ${
              activeTab === "login"
                ? "text-neutral-900 font-medium"
                : "text-neutral-500"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`text-label-lg pb-3 transition-all interactive ${
              activeTab === "signup"
                ? "text-neutral-900 font-medium"
                : "text-neutral-500"
            }`}
          >
            Sign Up
          </button>
        </div>
        <div className="flex justify-center mt-3">
          <div
            className={`h-1 w-16 bg-blue-600 rounded-full transition-all duration-300 ease-out ${
              activeTab === "signup" ? "translate-x-20" : "-translate-x-20"
            }`}
          />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 pt-8">
        {error && (
          <div className="card bg-red-50 border-red-200 mb-6 animate-slide-in-up">
            <div className="card-body">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-body-md text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "signup" && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="input-group">
              <label className="text-label-md text-neutral-700">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input focus-ring"
                placeholder="John"
                required
              />
            </div>
            <div className="input-group">
              <label className="text-label-md text-neutral-700">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input focus-ring"
                placeholder="Doe"
                required
              />
            </div>
          </div>
        )}

        <div className="input-group mb-6">
          <label className="text-label-md text-neutral-700">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input focus-ring"
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="input-group mb-6">
          <label className="text-label-md text-neutral-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input focus-ring"
            placeholder="Enter your password"
            required
            minLength={6}
          />
        </div>

        {activeTab === "login" && (
          <div className="mb-8">
            <Link
              href={`/forgot-password${urlToken ? `?token=${urlToken}` : ""}`}
              className="text-blue-600 text-label-md font-medium interactive"
            >
              Forgot password?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-xl w-full mb-8 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner"></div>
              <span>Processing...</span>
            </div>
          ) : activeTab === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-neutral-50 text-body-md text-neutral-500">
              or continue with
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-secondary btn-lg flex-1 focus-ring"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="btn btn-lg flex-1 bg-neutral-800 text-white hover:bg-neutral-700 focus-ring"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Guest
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-neutral-50">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-neutral-200 border-t-blue-600 rounded-full spinner mb-4"></div>
            <p className="text-body-lg text-neutral-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
