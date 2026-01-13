"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Button, Input, useToast } from "@/shared/components/ui";
import { authApi } from "@/shared/lib/api/auth";
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

type ResetState = "form" | "loading" | "success" | "expired" | "invalid";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, setState] = useState<ResetState>("form");
  const [errors, setErrors] = useState<string[]>([]);
  const { success, error: showError } = useToast();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setState("invalid");
    }
  }, [searchParams]);

  const validatePassword = (): boolean => {
    const validationErrors: string[] = [];

    if (password.length < 8) {
      validationErrors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      validationErrors.push(
        "Password must contain at least one uppercase letter",
      );
    }
    if (!/[a-z]/.test(password)) {
      validationErrors.push(
        "Password must contain at least one lowercase letter",
      );
    }
    if (!/[0-9]/.test(password)) {
      validationErrors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      validationErrors.push(
        "Password must contain at least one special character",
      );
    }
    if (password !== confirmPassword) {
      validationErrors.push("Passwords do not match");
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setState("loading");

    try {
      const response = await authApi.resetPassword(token, password);
      setState("success");
      success(response.message || "Password reset successfully!");

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to reset password";

      if (errorMessage.includes("expired")) {
        setState("expired");
      } else if (
        errorMessage.includes("Invalid") ||
        errorMessage.includes("already used")
      ) {
        setState("invalid");
      } else {
        setState("form");
        showError(errorMessage);
      }
    }
  };

  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Resetting Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait...</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your password has been reset successfully.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 dark:text-green-600">
                Redirecting you to the login page in 3 seconds...
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full">Go to Sign In</Button>
            </Link>
          </div>
        );

      case "expired":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-orange-100 p-3">
                <Clock className="h-16 w-16 text-orange-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Link Expired
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This password reset link has expired.
            </p>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                <strong>Password reset links expire after 30 minutes</strong>{" "}
                for security reasons. Please request a new link.
              </p>
            </div>
            <Link href="/forgot-password">
              <Button className="w-full">Request New Reset Link</Button>
            </Link>
          </div>
        );

      case "invalid":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This password reset link is invalid or has already been used.
            </p>
            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button className="w-full">Request New Reset Link</Button>
              </Link>
              <Link href="/login">
                <Button className="w-full" variant="secondary">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        );

      case "form":
      default:
        return (
          <>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <KeyRound className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reset Your Password
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {errors.length > 0 ? (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-5 mb-8 text-left shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-red-600 rounded-full"></div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-600">
                      Action Required
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-400 leading-relaxed">
                          {error}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-8 text-left shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Password Requirements
                    </p>
                  </div>
                  <ul className="text-sm font-medium text-slate-600 dark:text-slate-200 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      At least{" "}
                      <strong className="text-blue-600 dark:text-blue-400">
                        8 characters
                      </strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      One{" "}
                      <strong className="text-blue-600 dark:text-blue-400">
                        uppercase
                      </strong>{" "}
                      and{" "}
                      <strong className="text-blue-600 dark:text-blue-400">
                        lowercase
                      </strong>{" "}
                      letter
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      One{" "}
                      <strong className="text-blue-600 dark:text-blue-400">
                        number
                      </strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      One{" "}
                      <strong className="text-blue-600 dark:text-blue-400">
                        special character
                      </strong>{" "}
                      (!@#...)
                    </li>
                  </ul>
                </div>
              )}

              <Button type="submit" className="w-full">
                Reset Password
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-slate-600 hover:text-slate-700 dark:text-slate-400"
              >
                Back to Sign In
              </Link>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">{renderContent()}</Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
