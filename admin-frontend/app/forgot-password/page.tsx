"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, Button, Input, useToast } from "@/shared/components/ui";
import { authApi } from "@/shared/lib/api/auth";
import { KeyRound, ArrowLeft, Mail, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { success, error: showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      setEmailSent(true);
      success(response.message || "Password reset email sent!");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to send reset email";
      showError(errorMessage);
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
              Check Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              If an account exists for <strong>{email}</strong>, you will
              receive a password reset link shortly.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-8 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Important Info
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-200 leading-relaxed">
                    Check your <strong className="text-blue-600 dark:text-blue-400">spam folder</strong> if you don't see the email.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-200 leading-relaxed">
                    The reset link expires in <strong className="text-blue-600 dark:text-blue-400">30 minutes</strong>.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-200 leading-relaxed">
                    Request a new link if the current one <strong className="text-blue-600 dark:text-blue-400">expires</strong>.
                  </p>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full">Back to Sign In</Button>
              </Link>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="text-sm text-slate-600 hover:text-slate-700 dark:text-slate-400 w-full"
              >
                Send to a different email
              </button>
            </div>
          </div>
        ) : (
          // Form state
          <>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <KeyRound className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Forgot Password?
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                No worries! Enter your email and we'll send you reset
                instructions.
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
                    Send Reset Link
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
