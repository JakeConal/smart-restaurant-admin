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
      <div className="min-h-screen bg-ivory-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bento-card max-w-sm w-full py-12 space-y-8">
          <div className="w-20 h-20 bg-red-100 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-h2">Invalid Link</h1>
            <p className="text-body text-slate-500">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="btn-primary block w-full"
          >
            Request New Link
          </Link>
          <Link
            href="/login"
            className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6 text-center">
        <div className="bento-card max-w-sm w-full py-12 space-y-8">
          <div className="w-20 h-20 bg-green-100 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-h2">Success!</h1>
            <p className="text-body text-slate-500">
              Your password has been securely updated.
            </p>
          </div>
          <div className="pt-4 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Redirecting...</span>
            </div>
            <Link
              href={tableToken ? `/login?token=${tableToken}` : "/login"}
              className="btn-primary w-full shadow-slate-200"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group mb-4"
        >
          <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-900 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </Link>

        <div className="bento-card">
          <div className="mb-8 space-y-2">
            <h1 className="text-h2">New Password</h1>
            <p className="text-body text-slate-500">
              Create a robust password to secure your account access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-3 animate-fade-in">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-caption !text-[10px]">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {password && (
                <div className="space-y-3 animate-fade-in">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getPasswordStrengthBarColor(passwordStrength.score)}`}
                      style={{ width: `${Math.min((password.length / 15) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getPasswordStrengthColor(passwordStrength.score)}`}>
                      {getPasswordStrengthLabel(passwordStrength.score)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {password.length} chars
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {[
                      { key: 'minLength', label: '8+ chars' },
                      { key: 'hasUpperCase', label: 'Uppercase' },
                      { key: 'hasLowerCase', label: 'Lowercase' },
                      { key: 'hasNumber', label: 'Number' },
                      { key: 'hasSpecialChar', label: 'Special' }
                    ].map((req) => (
                      <div key={req.key} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${(passwordStrength.requirements as any)[req.key] ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-300'
                          }`}>
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${(passwordStrength.requirements as any)[req.key] ? 'text-slate-600' : 'text-slate-400'
                          }`}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-caption !text-[10px]">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input-field ${confirmPassword && password !== confirmPassword ? 'border-red-200' : ''}`}
                  placeholder="••••••••"
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-fade-in pl-1">Passwords mismatch</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordStrength.isValid || password !== confirmPassword}
              className="btn-primary w-full shadow-slate-200 disabled:opacity-30 disabled:grayscale"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6"><div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
