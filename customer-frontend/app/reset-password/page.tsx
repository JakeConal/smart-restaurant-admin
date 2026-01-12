"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import {
  validatePasswordComplexity,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  getPasswordStrengthBarColor,
} from "@/lib/password-validator";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tableToken = searchParams.get("tableToken");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = validatePasswordComplexity(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!passwordStrength.isValid) {
      setError("Password does not meet complexity requirements");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);

      // Redirect after 3 seconds with tableToken
      setTimeout(() => {
        if (tableToken) {
          router.push(`/login?token=${tableToken}`);
        } else {
          router.push("/login");
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen pt-12 px-6">
        <Link
          href="/login"
          className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-8"
        >
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </Link>

        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-center mb-4">
            Invalid Reset Link
          </h1>
          <p className="text-gray-600 text-center mb-8">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link
            href="/forgot-password"
            className="block w-full px-8 py-3 bg-[#fa4a0c] text-white font-semibold rounded-full hover:bg-[#e04009] transition-colors text-center"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
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
          <h1 className="text-2xl font-bold mb-2">
            Password Reset Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your password has been updated. You can now log in with your new
            password.
          </p>
          <p className="text-sm text-gray-500 mb-4">Redirecting to login...</p>
          <Link
            href={tableToken ? `/login?token=${tableToken}` : "/login"}
            className="inline-block px-8 py-3 bg-[#fa4a0c] text-white font-semibold rounded-full hover:bg-[#e04009] transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 px-6">
      <Link
        href="/login"
        className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-8"
      >
        <svg
          className="w-6 h-6 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </Link>

      <h1 className="text-3xl font-bold mb-2">Reset Your Password</h1>
      <p className="text-gray-600 mb-8">
        Create a strong password to secure your account.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm text-gray-500 font-semibold mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl bg-white focus:border-[#fa4a0c] transition-colors pr-10"
              placeholder="••••••••"
              required
            />
          </div>

          {password && (
            <div className="mt-3 space-y-2">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getPasswordStrengthBarColor(passwordStrength.score)}`}
                  style={{ width: `${(password.length / 20) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span
                  className={getPasswordStrengthColor(passwordStrength.score)}
                >
                  {getPasswordStrengthLabel(passwordStrength.score)}
                </span>
                <span className="text-gray-500">
                  {password.length} characters
                </span>
              </div>
            </div>
          )}

          {password && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <p
                className={
                  passwordStrength.requirements.minLength
                    ? "text-green-600"
                    : "text-gray-500"
                }
              >
                {passwordStrength.requirements.minLength ? "✓" : "○"} At least 8
                characters
              </p>
              <p
                className={
                  passwordStrength.requirements.hasUpperCase
                    ? "text-green-600"
                    : "text-gray-500"
                }
              >
                {passwordStrength.requirements.hasUpperCase ? "✓" : "○"} One
                uppercase letter
              </p>
              <p
                className={
                  passwordStrength.requirements.hasLowerCase
                    ? "text-green-600"
                    : "text-gray-500"
                }
              >
                {passwordStrength.requirements.hasLowerCase ? "✓" : "○"} One
                lowercase letter
              </p>
              <p
                className={
                  passwordStrength.requirements.hasNumber
                    ? "text-green-600"
                    : "text-gray-500"
                }
              >
                {passwordStrength.requirements.hasNumber ? "✓" : "○"} One number
              </p>
              <p
                className={
                  passwordStrength.requirements.hasSpecialChar
                    ? "text-green-600"
                    : "text-gray-500"
                }
              >
                {passwordStrength.requirements.hasSpecialChar ? "✓" : "○"} One
                special character
              </p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-500 font-semibold mb-2">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full py-3 px-4 border border-gray-200 rounded-xl bg-white focus:border-[#fa4a0c] transition-colors"
            placeholder="••••••••"
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-red-600 text-sm mt-2">Passwords do not match</p>
          )}
          {confirmPassword && password === confirmPassword && (
            <p className="text-green-600 text-sm mt-2">Passwords match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={
            loading || !passwordStrength.isValid || password !== confirmPassword
          }
          className="w-full h-14 bg-[#fa4a0c] text-white font-semibold rounded-full btn-press hover:bg-[#e04009] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner"></div>
              Resetting...
            </span>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
