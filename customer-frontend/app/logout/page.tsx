"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/context";

function LogoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, token } = useApp();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Perform logout
    logout();

    // Countdown and redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const currentToken = token || searchParams.get("token");
          router.replace(
            `/login${currentToken ? `?token=${currentToken}` : ""}`,
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [logout, router, token, searchParams]);

  return (
    <div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6 text-center">
      <div className="bento-card max-w-sm w-full py-12 space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-[24px] flex items-center justify-center mx-auto shadow-inner group">
          <svg
            className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-h2">Signed Out</h1>
          <p className="text-body text-slate-500">
            You've been securely logged out.
          </p>
        </div>

        <div className="pt-4 flex flex-col items-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-700 animate-spin"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Redirecting in {countdown}s
            </span>
          </div>

          <button
            onClick={() => {
              const currentToken = token || searchParams.get("token");
              router.replace(
                `/login${currentToken ? `?token=${currentToken}` : ""}`,
              );
            }}
            className="text-xs font-black text-slate-900 border-b-2 border-slate-900 pb-0.5 hover:text-slate-600 hover:border-slate-600 transition-all"
          >
            LOGIN AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6 text-center">
          <div className="bento-card max-w-sm w-full py-12 space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-[24px] mx-auto" />
              <div className="h-8 bg-slate-100 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
            </div>
          </div>
        </div>
      }
    >
      <LogoutContent />
    </Suspense>
  );
}
