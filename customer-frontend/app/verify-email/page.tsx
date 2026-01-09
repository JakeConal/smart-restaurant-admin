"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "invalid"
  >("loading");
  const [message, setMessage] = useState("");
  const [tableToken, setTableToken] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("invalid");
        setMessage(
          "No verification token provided. Please check your email link.",
        );
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        // Use tableToken from response - this is the original token user had when signing up
        const finalToken = (response as any).tableToken;
        setTableToken(finalToken);
        setStatus("success");
        setMessage("Your email has been verified successfully!");

        // Redirect to login after 3 seconds with tableToken
        setTimeout(() => {
          if (finalToken) {
            router.push(`/login?token=${finalToken}`);
          } else {
            router.push("/login");
          }
        }, 3000);
      } catch (err) {
        setStatus("error");

        if (err instanceof Error) {
          const message = err.message.toLowerCase();

          if (message.includes("expired")) {
            setMessage(
              "Verification link has expired. Please request a new one.",
            );
          } else if (message.includes("already verified")) {
            setMessage("Your email is already verified. You can now log in.");
          } else if (message.includes("already used")) {
            setMessage("This verification link has already been used.");
          } else {
            setMessage(err.message);
          }
        } else {
          setMessage("An error occurred while verifying your email.");
        }
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 border-4 border-yellow-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Your Email
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your email...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting to login in a moment...
              </p>
              <Link
                href={tableToken ? `/login?token=${tableToken}` : "/login"}
                className="inline-block mt-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href={tableToken ? `/login?token=${tableToken}` : "/login"}
                  className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-all duration-200"
                >
                  Back to Login
                </Link>
                <Link
                  href={
                    tableToken
                      ? `/login?tab=signup&token=${tableToken}`
                      : "/login?tab=signup"
                  }
                  className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Request New Verification Link
                </Link>
              </div>
            </>
          )}

          {status === "invalid" && (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Invalid Link
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                href={tableToken ? `/login?token=${tableToken}` : "/login"}
                className="inline-block bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
