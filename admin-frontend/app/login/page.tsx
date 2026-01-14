"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card, useToast } from "@/shared/components/ui";
import { useAuth } from "@/shared/components/auth/AuthContext";
import { Eye, EyeOff, ChefHat, Mail, CheckCircle2, Circle } from "lucide-react";
import toast from "react-hot-toast";
import { 
  validatePasswordComplexity, 
  getPasswordStrengthBarColor, 
  getPasswordStrengthLabel 
} from "@/shared/lib/password-validator";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [restaurantName, setRestaurantName] = useState("");
  const [showEmailSentMessage, setShowEmailSentMessage] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const { login, signup, googleLogin, loadUser, isLoading } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const user = searchParams.get("user");
    if (token && user) {
      try {
        const userData = JSON.parse(decodeURIComponent(user));
        localStorage.setItem("authToken", token);
        localStorage.setItem("authUser", JSON.stringify(userData));
        loadUser();
        // Redirect based on user role
        const role = userData.role?.toUpperCase();
        if (role === 'SUPER_ADMIN') {
          router.push("/super-admin/admins");
        } else if (role === 'WAITER') {
          router.push("/waiter/orders");
        } else if (role === 'KITCHEN' || role === 'KITCHEN_STAFF') {
          router.push("/kitchen");
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [searchParams, router, loadUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const result = await login({ email, password });
        // Redirect based on user role
        const role = result?.user?.role?.toUpperCase();
        if (role === 'SUPER_ADMIN') {
          router.push("/super-admin/admins");
        } else if (role === 'WAITER') {
          router.push("/waiter/orders");
        } else if (role === 'KITCHEN' || role === 'KITCHEN_STAFF') {
          router.push("/kitchen");
        } else {
          router.push("/");
        }
      } else {
        // Validate password strength before signup
        const strength = validatePasswordComplexity(password);
        if (!strength.isValid) {
          showError("Please ensure your password meets all complexity requirements.");
          return;
        }
        await signup({ email, password, restaurantName });
        // Show email verification message instead of redirecting
        setShowEmailSentMessage(true);
        success("Account created! Please check your email to verify your account.");
      }
    } catch (error: any) {
      // Check if error is about unverified email
      const errorMessage = error?.response?.data?.message || '';
      if (errorMessage.includes("verify your email")) {
        // Dismiss the generic error toast from AuthContext
        toast.remove();
        
        showError(
          <div className="space-y-1">
            <p className="font-bold">Email Not Verified</p>
            <p>Please check your inbox or <Link 
                href={`/resend-verification?email=${encodeURIComponent(email)}`}
                className="underline font-bold"
              >
                resend verification link
              </Link>
            </p>
          </div>,
          10000
        );
      }
      // Other errors are handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        {showEmailSentMessage ? (
          // Email verification message
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ve sent a verification link to <strong>{email}</strong>
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
              <Button
                onClick={() => {
                  setShowEmailSentMessage(false);
                  setIsLogin(true);
                }}
                className="w-full"
              >
                Back to Sign In
              </Button>
              <Link
                href={`/resend-verification?email=${encodeURIComponent(email)}`}
                className="block text-sm text-slate-600 hover:text-slate-700 dark:text-slate-400"
              >
                Didn&apos;t receive the email? Resend verification
              </Link>
            </div>
          </div>
        ) : (
          // Login/Signup form
          <>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <ChefHat className="h-12 w-12 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Smart Restaurant
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {isLogin
                  ? "Sign in to your account"
                  : "Create your restaurant account"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  if (!isLogin) {
                    setPasswordStrength(validatePasswordComplexity(val));
                  }
                }}
                required
                className="pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {!isLogin && password && passwordStrength && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Password strength:{" "}
                    <span className={getPasswordStrengthBarColor(passwordStrength.score).replace('bg-', 'text-')}>
                      {getPasswordStrengthLabel(passwordStrength.score)}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {passwordStrength.score}/5
                  </span>
                </div>
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        item <= passwordStrength.score
                          ? getPasswordStrengthBarColor(passwordStrength.score)
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    {passwordStrength.requirements.minLength ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-300" />
                    )}
                    <span className={`text-[10px] ${passwordStrength.requirements.minLength ? 'text-green-600 dark:text-green-500' : 'text-gray-500'}`}>8+ characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.requirements.hasUpperCase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-300" />
                    )}
                    <span className={`text-[10px] ${passwordStrength.requirements.hasUpperCase ? 'text-green-600 dark:text-green-500' : 'text-gray-500'}`}>Uppercase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.requirements.hasLowerCase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-300" />
                    )}
                    <span className={`text-[10px] ${passwordStrength.requirements.hasLowerCase ? 'text-green-600 dark:text-green-500' : 'text-gray-500'}`}>Lowercase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.requirements.hasNumber ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-300" />
                    )}
                    <span className={`text-[10px] ${passwordStrength.requirements.hasNumber ? 'text-green-600 dark:text-green-500' : 'text-gray-500'}`}>Number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.requirements.hasSpecialChar ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-300" />
                    )}
                    <span className={`text-[10px] ${passwordStrength.requirements.hasSpecialChar ? 'text-green-600 dark:text-green-500' : 'text-gray-500'}`}>Special character</span>
                  </div>
                </div>
              </div>
            )}
            {isLogin && (
              <div className="text-right mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  Forgot Password?
                </Link>
              </div>
            )}
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="restaurantName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Restaurant Name
              </label>
              <Input
                id="restaurantName"
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your restaurant name"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with Google
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={googleLogin}
            className="w-full flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
