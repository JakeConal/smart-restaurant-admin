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
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
            {customer && (
              <p className="text-gray-600 mb-2">
                {customer.firstName || customer.email}
              </p>
            )}
            <p className="text-gray-600 mb-8">Taking you to the menu...</p>
            <div className="w-10 h-10 border-3 border-yellow-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // No token error
  if (!token && !searchParams.get("token") && !searchParams.get("auth_token")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Access
            </h1>
            <p className="text-gray-600">
              Please scan a valid QR code at your table to access the menu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 flex items-center justify-center px-4 py-6 sm:py-12">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center border-b border-gray-100">
            <h1 className="text-4xl font-bold text-gray-900">Log In</h1>
          </div>

          {/* Tabs */}
          <div className="px-8 py-8 border-b border-gray-200">
            <div className="flex gap-12 justify-center">
              <button
                onClick={() => setActiveTab("login")}
                className={`text-base font-semibold pb-4 transition-all ${
                  activeTab === "login"
                    ? "text-amber-600 border-b-2 border-amber-600"
                    : "text-gray-400 border-b-2 border-transparent hover:text-gray-600"
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`text-base font-semibold pb-4 transition-all ${
                  activeTab === "signup"
                    ? "text-gray-900 border-b-2 border-gray-400"
                    : "text-gray-400 border-b-2 border-transparent hover:text-gray-600"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-10 space-y-8">
            {/* Welcome text */}
            {activeTab === "login" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Welcome
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Please enter your account details to access your personalized
                  experience and manage your preferences.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* First and Last Name (Sign Up) */}
            {activeTab === "signup" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-yellow-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-yellow-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-yellow-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="example@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-yellow-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••••"
                  required
                  minLength={6}
                />
                <svg
                  className="w-5 h-5 text-amber-600 absolute right-4 top-1/2 transform -translate-y-1/2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              </div>
            </div>

            {/* Forgot Password Link */}
            {activeTab === "login" && (
              <div className="text-right">
                <Link
                  href={`/forgot-password${urlToken ? `?token=${urlToken}` : ""}`}
                  className="text-amber-600 text-sm font-medium hover:text-amber-700 transition-colors"
                >
                  Forgot Password
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : activeTab === "login" ? (
                "Log In"
              ) : (
                "Sign Up"
              )}
            </button>

            {/* Or sign in with */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">or sign in with</p>
            </div>

            {/* Social Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex-1 w-12 h-12 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#dc2626"
                  >
                    G
                  </text>
                </svg>
              </button>
              <button
                type="button"
                onClick={handleGuestLogin}
                className="flex-1 w-12 h-12 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-gray-700 text-sm">
                {activeTab === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="text-orange-500 font-bold hover:text-orange-600 transition-colors"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-orange-500 font-bold hover:text-orange-600 transition-colors"
                    >
                      Log In
                    </button>
                  </>
                )}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <div className="w-12 h-12 border-4 border-yellow-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
