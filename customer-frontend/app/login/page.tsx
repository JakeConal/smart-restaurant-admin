"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { authApi } from "@/lib/api";
import { AuthResponse } from "@/lib/types";
import {
  validatePasswordComplexity,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  getPasswordStrengthBarColor,
} from "@/lib/password-validator";

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
  const [passwordStrength, setPasswordStrength] = useState(
    validatePasswordComplexity(""),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

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
          tableToken: urlToken, // Pass the original table token
        })) as AuthResponse;

        // Check if email verification is required
        if ((response as any).requiresEmailVerification) {
          setVerificationEmail(email);
          setShowEmailVerification(true);
          setEmail("");
          setPassword("");
          setFirstName("");
          setLastName("");
          return;
        }
      }

      login(response);
      setShowWelcome(true);
    } catch (err) {
      let errorMessage = "Authentication failed";

      if (err instanceof Error) {
        const message = err.message.toLowerCase();

        // For signup validation errors
        if (message.includes("password does not meet complexity")) {
          errorMessage =
            "Password does not meet complexity requirements. Please check the requirements below.";
        }
        // For signup duplicate email
        else if (message.includes("email already exists")) {
          errorMessage =
            "An account with this email already exists. Please try logging in instead.";
        }
        // For login/signup invalid credentials or wrong password
        else if (
          message.includes("invalid") &&
          message.includes("credentials")
        ) {
          errorMessage =
            "Invalid email or password. Please check your credentials.";
        }
        // For user not found during signup
        else if (message.includes("user not found")) {
          errorMessage =
            "No account found with this email. Please sign up first.";
        }
        // Default: show the API error message as-is
        else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
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

  const handleResendVerificationEmail = async () => {
    setResendLoading(true);
    setResendSuccess(false);

    try {
      await authApi.resendVerificationEmail(verificationEmail);
      setResendSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      let errorMessage = "Failed to resend verification email";

      if (err instanceof Error) {
        const message = err.message.toLowerCase();

        if (message.includes("email already verified")) {
          errorMessage = "This email is already verified. You can log in now.";
        } else if (message.includes("not found")) {
          errorMessage = "Account not found. Please sign up again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setResendLoading(false);
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
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Password
                </label>
                {activeTab === "login" && (
                  <Link
                    href={`/forgot-password${urlToken ? `?token=${urlToken}` : ""}`}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                  >
                    Forgot Password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (activeTab === "signup") {
                      setPasswordStrength(
                        validatePasswordComplexity(e.target.value),
                      );
                    }
                  }}
                  className="w-full px-4 py-3 bg-yellow-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••••"
                  required
                  minLength={activeTab === "signup" ? 8 : 1}
                />
              </div>

              {/* Password Strength Indicator (Sign Up Only) */}
              {activeTab === "signup" && password.length > 0 && (
                <div className="mt-4 space-y-3">
                  {/* Strength Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">
                        Password Strength
                      </span>
                      <span
                        className={`text-xs font-bold ${getPasswordStrengthColor(
                          passwordStrength.score,
                        )}`}
                      >
                        {getPasswordStrengthLabel(passwordStrength.score)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthBarColor(
                          passwordStrength.score,
                        )}`}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Requirements List */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">
                      Password must include:
                    </p>
                    <div className="space-y-1 text-xs">
                      <div
                        className={
                          passwordStrength.requirements.minLength
                            ? "text-green-600 flex items-center gap-2"
                            : "text-gray-500 flex items-center gap-2"
                        }
                      >
                        <span
                          className={
                            passwordStrength.requirements.minLength
                              ? "text-green-500"
                              : "text-gray-400"
                          }
                        >
                          ✓
                        </span>
                        At least 8 characters
                      </div>
                      <div
                        className={
                          passwordStrength.requirements.hasUpperCase
                            ? "text-green-600 flex items-center gap-2"
                            : "text-gray-500 flex items-center gap-2"
                        }
                      >
                        <span
                          className={
                            passwordStrength.requirements.hasUpperCase
                              ? "text-green-500"
                              : "text-gray-400"
                          }
                        >
                          ✓
                        </span>
                        One uppercase letter (A-Z)
                      </div>
                      <div
                        className={
                          passwordStrength.requirements.hasLowerCase
                            ? "text-green-600 flex items-center gap-2"
                            : "text-gray-500 flex items-center gap-2"
                        }
                      >
                        <span
                          className={
                            passwordStrength.requirements.hasLowerCase
                              ? "text-green-500"
                              : "text-gray-400"
                          }
                        >
                          ✓
                        </span>
                        One lowercase letter (a-z)
                      </div>
                      <div
                        className={
                          passwordStrength.requirements.hasNumber
                            ? "text-green-600 flex items-center gap-2"
                            : "text-gray-500 flex items-center gap-2"
                        }
                      >
                        <span
                          className={
                            passwordStrength.requirements.hasNumber
                              ? "text-green-500"
                              : "text-gray-400"
                          }
                        >
                          ✓
                        </span>
                        One number (0-9)
                      </div>
                      <div
                        className={
                          passwordStrength.requirements.hasSpecialChar
                            ? "text-green-600 flex items-center gap-2"
                            : "text-gray-500 flex items-center gap-2"
                        }
                      >
                        <span
                          className={
                            passwordStrength.requirements.hasSpecialChar
                              ? "text-green-500"
                              : "text-gray-400"
                          }
                        >
                          ✓
                        </span>
                        One special character (!@#$%...)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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

      {/* Email Verification Modal */}
      {showEmailVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verify Your Email
              </h2>
              <p className="text-gray-600 mb-4">
                We've sent a verification link to:
              </p>
              <p className="text-lg font-semibold text-amber-600 mb-4">
                {verificationEmail}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-blue-800 font-medium mb-2">
                ✓ Check your email inbox (and spam folder)
              </p>
              <p className="text-sm text-blue-800 mb-2">
                ✓ Click the verification link to confirm your email
              </p>
              <p className="text-sm text-blue-800">
                ✓ Link expires in 24 hours
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowEmailVerification(false);
                  setActiveTab("login");
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-all duration-200"
              >
                Continue to Login
              </button>
              <button
                onClick={handleResendVerificationEmail}
                disabled={resendLoading}
                className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resendLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : resendSuccess ? (
                  <>
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    <span className="text-green-600">
                      Resent! Check your email
                    </span>
                  </>
                ) : (
                  "Resend Verification Link"
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Once verified, you can log in to your account.
            </p>
          </div>
        </div>
      )}
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
