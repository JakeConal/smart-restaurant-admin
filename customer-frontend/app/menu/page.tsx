"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Input, useToast } from "@/shared/components/ui";
import { Eye, EyeOff, CheckCircle, UtensilsCrossed } from "lucide-react";

function MenuPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [isValidQr, setIsValidQr] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const table = searchParams.get("table");
    const token = searchParams.get("token");
    const user = searchParams.get("user");

    if (table && token) {
      // Decode the JWT token to get restaurantId
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const restaurantIdFromToken = payload.restaurantId;

        if (restaurantIdFromToken && table) {
          setRestaurantId(restaurantIdFromToken);
          setTableId(table);
          setIsValidQr(true);

          // If user just logged in, redirect to restaurant menu
          if (user === "logged_in") {
            router.push(`/restaurant/${restaurantIdFromToken}?table=${table}`);
          } else {
            setShowAuth(true);
          }
        } else {
          setIsValidQr(false);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        setIsValidQr(false);
      }
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement customer login
      console.log("Customer login:", { email, password });

      // For now, simulate successful login
      toast.success("Login successful!");

      // Redirect to restaurant menu
      if (restaurantId && tableId) {
        router.push(
          `/restaurant/${restaurantId}?table=${tableId}&token=${searchParams.get("token")}`,
        );
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    // Proceed to menu as guest
    router.push(
      `/restaurant/${restaurantId}?table=${tableId}&token=${searchParams.get("token")}&mode=guest`,
    );
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google login
    toast.info("Google login coming soon!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Brand Header */}
      <div className="bg-orange-500 text-white py-8 px-4 text-center">
        <div className="max-w-md mx-auto">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Smart Restaurant</h1>
          <p className="text-orange-100">Scan. Order. Enjoy.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-t-2xl shadow-lg p-6">
            {isValidQr && restaurantId && tableId && showAuth ? (
              <>
                {/* QR Success Confirmation */}
                <div className="flex items-center justify-center mb-6 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <div className="text-center">
                    <p className="text-green-800 font-medium text-sm">
                      QR Code Scanned Successfully
                    </p>
                    <p className="text-green-600 text-xs mt-1">
                      Restaurant: {restaurantId} | Table: {tableId}
                    </p>
                  </div>
                </div>

                {/* Welcome Title */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                  Welcome Back
                </h2>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4 mb-6">
                  <div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Email address"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Password"
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>

                {/* Social Login */}
                <div className="mb-6">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleGoogleLogin}
                    variant="secondary"
                    className="w-full border border-gray-300 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </div>

                {/* Guest Access */}
                <div className="text-center">
                  <button
                    onClick={handleGuest}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Continue as Guest →
                  </button>
                </div>
              </>
            ) : isValidQr ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Invalid QR Code</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <MenuPageContent />
    </Suspense>
  );
}
