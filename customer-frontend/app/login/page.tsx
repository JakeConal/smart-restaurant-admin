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

  const urlToken = searchParams.get("token");

  useEffect(() => {
    const authToken = searchParams.get("auth_token");
    const authUser = searchParams.get("auth_user");

    if (urlToken && !token) {
      setToken(urlToken);
    }

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
          tableToken: urlToken || undefined,
        })) as AuthResponse;

        if ((response as any).requiresEmailVerification) {
          setVerificationEmail(email);
          setShowEmailVerification(true);
          return;
        }
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

  const handleResendVerificationEmail = async () => {
    setResendLoading(true);
    try {
      await authApi.resendVerificationEmail(verificationEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setResendLoading(false);
    }
  };

  if (showWelcome && isAuthenticated) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6 text-center">
        <div className="bento-card max-w-sm w-full py-12">
          <div className="w-20 h-20 bg-green-100 rounded-[24px] flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-h2 mb-2">Welcome Back!</h1>
          <p className="text-body mb-8 text-slate-500">
            {customer?.firstName || customer?.email}
          </p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!token && !searchParams.get("token") && !searchParams.get("auth_token")) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6 text-center">
        <div className="bento-card max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-[20px] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-h3 mb-2">Access Restricted</h1>
          <p className="text-body text-slate-500 mb-6">
            Please scan the QR code on your table to browse our menu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-4 mb-4">
          <div className="bento-card p-0 !rounded-[24px] flex items-center justify-center w-20 h-20 bg-slate-800 shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 opacity-50"></div>
            <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-caption tracking-widest text-slate-400 font-bold">Premium Ordering</p>
        </div>

        <div className="bento-card">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-h2">{activeTab === "login" ? "Sign In" : "Register"}</h1>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "login" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "signup" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Join
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-3 animate-fade-in">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                {error}
              </div>
            )}

            {activeTab === "signup" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-caption !text-[10px]">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-field"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-caption !text-[10px]">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-field"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-caption !text-[10px]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="name@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center transition-all">
                <label className="text-caption !text-[10px]">Password</label>
                {activeTab === "login" && (
                  <Link
                    href={`/forgot-password${urlToken ? `?token=${urlToken}` : ""}`}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider"
                  >
                    Forgot?
                  </Link>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (activeTab === "signup") {
                    setPasswordStrength(validatePasswordComplexity(e.target.value));
                  }
                }}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            {activeTab === "signup" && password.length > 0 && (
              <div className="p-4 bg-slate-50/50 rounded-2xl space-y-3 border border-slate-100">
                <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  <span>Security Status</span>
                  <span className={getPasswordStrengthColor(passwordStrength.score)}>
                    {getPasswordStrengthLabel(passwordStrength.score)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className={`h-full transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${getPasswordStrengthBarColor(passwordStrength.score)}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : activeTab === "login" ? "Sign In Now" : "Create Account"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-400 tracking-widest">
              <span className="bg-white px-4">Social Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 py-3.5 border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm text-slate-700 group active:scale-95"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="flex items-center justify-center gap-3 py-3.5 border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm text-slate-700 group active:scale-95"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7-7h14a7 7 0 00-7-7z" />
              </svg>
              Quick Guest
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by</p>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-900 rounded-md"></div>
            <span className="text-xs font-black text-slate-900 tracking-tight">SMART RESTAURANT</span>
          </div>
        </div>
      </div>

      {showEmailVerification && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bento-card max-w-sm w-full text-center space-y-8 py-10">
            <div className="w-20 h-20 bg-blue-100 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-h2">Check Inbox</h2>
              <p className="text-body text-slate-500">We've dispatched a secure link to <br /><span className="font-bold text-slate-900">{verificationEmail}</span></p>
            </div>
            <div className="space-y-4 pt-4">
              <button
                type="button"
                onClick={() => { setShowEmailVerification(false); setActiveTab("login"); }}
                className="btn-primary w-full shadow-slate-300"
              >
                Back to Sign In
              </button>
              <button
                type="button"
                onClick={handleResendVerificationEmail}
                disabled={resendLoading}
                className="btn-secondary w-full"
              >
                {resendLoading ? "Sending..." : resendSuccess ? "Verification Resent" : "Resend Link"}
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Valid for 24 hours</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6"><div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}

