"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "@/shared/components/ui";
import { authApi } from "@/shared/lib/api/auth";
import { CheckCircle, XCircle, Clock, Loader2, Mail } from "lucide-react";

type VerificationState = "loading" | "success" | "expired" | "invalid";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("invalid");
      setMessage("No verification token provided");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authApi.verifyEmail(token);
        setState("success");
        setMessage(response.message || "Email verified successfully!");

        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Verification failed";

        if (errorMessage.includes("expired")) {
          setState("expired");
          setMessage("This verification link has expired");
          // Try to extract email from error or token
          const emailMatch = errorMessage.match(/[\w.-]+@[\w.-]+\.\w+/);
          if (emailMatch) setEmail(emailMatch[0]);
        } else if (errorMessage.includes("already used")) {
          setState("invalid");
          setMessage("This verification link has already been used");
        } else if (errorMessage.includes("Invalid")) {
          setState("invalid");
          setMessage("Invalid verification link");
        } else {
          setState("invalid");
          setMessage(errorMessage);
        }
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address...
            </p>
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
              Email Verified!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-8 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-200">
                You will be automatically redirected to the{" "}
                <strong className="text-blue-600 dark:text-blue-400">
                  login page
                </strong>{" "}
                in 3 seconds.
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
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-5 mb-8 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-orange-600 rounded-full"></div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  Security Message
                </p>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-200 leading-relaxed">
                Verification links expire after{" "}
                <strong className="text-orange-600 dark:text-orange-400">
                  1 hour
                </strong>{" "}
                for security reasons. Please request a new link to continue.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href={
                  email
                    ? `/resend-verification?email=${encodeURIComponent(email)}`
                    : "/resend-verification"
                }
              >
                <Button className="w-full" variant="primary">
                  <Mail className="h-4 w-4 mr-2" />
                  Get New Verification Link
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full" variant="secondary">
                  Back to Sign In
                </Button>
              </Link>
            </div>
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
              Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="space-y-3">
              <Link href="/resend-verification">
                <Button className="w-full" variant="primary">
                  <Mail className="h-4 w-4 mr-2" />
                  Request New Verification Email
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full" variant="secondary">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">{renderContent()}</Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
