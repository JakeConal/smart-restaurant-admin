"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.forgotPassword(email, token || undefined);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6 text-center">
        <div className="bento-card max-w-sm w-full py-12 space-y-8">
          <div className="w-20 h-20 bg-blue-100 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-h2">Email Sent</h1>
            <p className="text-body text-slate-500">
              We've dispatched a recovery link to <br /><span className="font-bold text-slate-900">{email}</span>
            </p>
          </div>
          <Link
            href={`/login${token ? `?token=${token}` : ""}`}
            className="btn-primary block w-full"
          >
            Return to Sign In
          </Link>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Didn't receive? Check your spam folder
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href={`/login${token ? `?token=${token}` : ""}`}
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
            <h1 className="text-h2">Reset Access</h1>
            <p className="text-body text-slate-500">
              Locked out? Provide your email to receive a secure recovery link.
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full shadow-slate-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : "Send Recovery Link"}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center space-y-2 opacity-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Recovery System</p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6"><div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
