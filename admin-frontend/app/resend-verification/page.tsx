"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Button, Input, useToast } from "@/shared/components/ui";
import { authApi } from "@/shared/lib/api/auth";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

function ResendVerificationContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    // Get email from query params and prefill
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
      
      // Clean up URL by removing query params
      window.history.replaceState({}, "", "/resend-verification");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.resendVerificationEmail(email);
      setEmailSent(true);
      success(response.message || "Verification email sent!");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to send verification email";

      if (errorMessage.includes("already verified")) {
        showError(
          <div>
            <p className="font-semibold">Email already verified</p>
            <p className="text-sm mt-1">You can now sign in with your account</p>
          </div>,
          4000
        );
        // Redirect to login after showing message
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (errorMessage.includes("not found")) {
        showError("No account found with this email address");
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        {emailSent ? (
          // Success state
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <Mail className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Sent!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've sent a new verification link to <strong>{email}</strong>
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-8 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Next steps
                </p>
              </div>
              <ol className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">1</span>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-200 leading-relaxed">
                    Check your <strong className="text-blue-600 dark:text-blue-400">inbox and spam</strong> folder for our email.
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">2</span>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-200 leading-relaxed">
                    Click the <strong className="text-blue-600 dark:text-blue-400">verification link</strong> inside the email.
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">3</span>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-200 leading-relaxed">
                    Return here to <strong className="text-blue-600 dark:text-blue-400">sign in</strong> to your dashboard.
                  </p>
                </li>
              </ol>
            </div>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full">Go to Sign In</Button>
              </Link>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="text-sm text-slate-600 hover:text-slate-700 dark:text-slate-400 w-full"
              >
                Resend to a different email
              </button>
            </div>
          </div>
        ) : (
          // Form state
          <>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <Mail className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Resend Verification Email
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Enter your email address to receive a new verification link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification Email
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Link
                href="/login"
                className="flex items-center justify-center text-sm text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ResendVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ResendVerificationContent />
    </Suspense>
  );
}
