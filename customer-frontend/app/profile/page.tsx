"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { profileApi, orderApi } from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import {
  validatePasswordComplexity,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  getPasswordStrengthBarColor,
} from "@/lib/password-validator";
import Link from "next/link";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    token,
    isAuthenticated,
    isGuest,
    customer,
    authToken,
    logout,
    updateCustomer,
  } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Order history
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState<
    Array<{
      id: number;
      orderId: string;
      paidAt?: string;
      createdAt?: string;
      total: number;
      items: Array<{ menuItemName?: string; name?: string; quantity: number }>;
      status?: string;
    }>
  >([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordValidationErrors, setPasswordValidationErrors] = useState<
    Record<string, string>
  >({});
  const [newPasswordStrength, setNewPasswordStrength] = useState(
    validatePasswordComplexity(""),
  );

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loadedAvatar, setLoadedAvatar] = useState<string | null>(null);

  // FAQ
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const currentToken = searchParams.get("token") || token;

  useEffect(() => {
    setMounted(true);
  }, []);

  // FAQ data
  const faqData = [
    {
      question: "How do I place an order?",
      answer:
        "Browse our menu, add items to your cart, and proceed to checkout. You can pay with cash or online payment methods.",
    },
    {
      question: "Can I modify my order after placing it?",
      answer:
        "Once an order is confirmed, modifications are not possible. Please contact the restaurant directly if you need to make changes.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept cash on delivery, credit/debit cards, and various digital payment methods like VNPay.",
    },
    {
      question: "Can I cancel my order?",
      answer:
        "Orders can be cancelled within 2 minutes of placement. After that, please contact the restaurant directly.",
    },
    {
      question: "How do I update my profile information?",
      answer:
        "Go to your profile page and click 'change' next to Personal details. You can update your name, phone number, and date of birth.",
    },
    {
      question: "Can I change my password?",
      answer:
        "Yes, you can change your password in the profile section. This option is not available for Google login accounts.",
    },
    {
      question: "How do I upload a profile picture?",
      answer:
        "Click on your profile picture in the Personal details section and select a new image. Supported formats: JPG, PNG, max 5MB.",
    },
    {
      question: "What should I do if I forgot my password?",
      answer:
        "Use the 'Forgot Password' link on the login page. We'll send you a reset link via email.",
    },
  ];

  // Validation functions
  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (firstName.trim() && firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (firstName.trim() && firstName.trim().length > 50) {
      errors.firstName = "First name must not exceed 50 characters";
    }

    if (lastName.trim() && lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    if (lastName.trim() && lastName.trim().length > 50) {
      errors.lastName = "Last name must not exceed 50 characters";
    }

    if (phoneNumber.trim()) {
      const phoneRegex = /^[0-9\s\-\+\(\)]{7,}$/;
      if (!phoneRegex.test(phoneNumber)) {
        errors.phoneNumber = "Invalid phone number format (at least 7 digits)";
      }
      if (phoneNumber.trim().length > 20) {
        errors.phoneNumber = "Phone number must not exceed 20 characters";
      }
    }

    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 13) {
        errors.dateOfBirth = "You must be at least 13 years old";
      }
      if (age > 150) {
        errors.dateOfBirth = "Please enter a valid birth date";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    } else if (newPassword.length > 50) {
      errors.newPassword = "Password must be less than 50 characters";
    } else if (!newPasswordStrength.isValid) {
      errors.newPassword = "Password does not meet complexity requirements";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Password confirmation is required";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword =
        "New password must be different from current password";
    }

    setPasswordValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
    }
  }, [isAuthenticated, currentToken, router]);

  // Initialize form with customer data
  useEffect(() => {
    if (customer) {
      setFirstName(customer.firstName || "");
      setLastName(customer.lastName || "");
      setPhoneNumber(customer.phoneNumber || "");
      setDateOfBirth(customer.dateOfBirth || "");

      // Reset avatar and reload for new customer
      setLoadedAvatar(null);
      setPhotoPreview(null);

      // Load avatar from backend
      if (authToken && customer.id) {
        loadAvatarFromBackend();
      }
    }
  }, [customer, authToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAvatarFromBackend = async () => {
    if (!authToken || !customer?.id) {
      setLoadedAvatar(null);
      return;
    }

    try {
      // Add timestamp to cache bust the request
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/profile/picture?t=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Cache-Control": "no-cache",
          },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          setLoadedAvatar(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } else {
        // If response is not ok (404, etc), explicitly clear avatar
        console.log(`Avatar load failed with status ${response.status}`);
        setLoadedAvatar(null);
      }
    } catch (error) {
      console.log("Error loading avatar:", error);
      setLoadedAvatar(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    if (!validateProfile()) {
      setError("Please fix validation errors");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await profileApi.updateProfile(authToken, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth,
      });

      updateCustomer({
        ...customer!,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setValidationErrors({});
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    if (!validatePassword()) {
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");

    try {
      await profileApi.updatePassword(authToken, {
        currentPassword,
        newPassword,
      });

      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordValidationErrors({});
      setSuccess("Password changed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      let errorMessage = "Failed to change password";

      if (err instanceof Error) {
        // Try to parse the error message for better user experience
        const message = err.message.toLowerCase();

        if (message.includes("current password is incorrect")) {
          errorMessage = "Current password is incorrect";
        } else if (message.includes("password does not meet complexity")) {
          errorMessage = "New password does not meet complexity requirements";
        } else if (message.includes("cannot change password for google")) {
          errorMessage = "Cannot change password for Google login accounts";
        } else if (message.includes("account does not have a password")) {
          errorMessage =
            "Account does not have a password. Please use forgot password to set one.";
        } else if (message.includes("new password must be different")) {
          errorMessage = "New password must be different from current password";
        } else if (message.includes("unauthorized")) {
          errorMessage = "Current password is incorrect";
        } else if (message.includes("bad request")) {
          errorMessage = "Please check your input and try again";
        } else {
          errorMessage = err.message;
        }
      }

      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5MB");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploadingPhoto(true);
    setError("");

    try {
      await profileApi.uploadPhoto(authToken, file);
      // Reload avatar after successful upload
      await loadAvatarFromBackend();
      setSuccess("Photo updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace(`/login?token=${currentToken}`);
  };

  const handleViewOrderHistory = async () => {
    if (!authToken || !customer?.id) return;

    setLoadingOrders(true);
    setError("");
    try {
      // Use the orderApi from lib
      const response: any = await orderApi.getOrderHistory(
        customer.id,
        authToken,
      );

      // The response structure might be { success: true, data: [] } or just []
      const orders = response.data || response;

      if (Array.isArray(orders)) {
        setOrderHistory(orders);
        setShowOrderHistory(true);
      } else {
        throw new Error("Invalid order data format");
      }
    } catch (err) {
      console.error("Error loading order history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load order history",
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  const getProfileImage = () => {
    if (photoPreview) return photoPreview;
    if (loadedAvatar) return loadedAvatar;
    if (customer?.googleProfilePicUrl) return customer.googleProfilePicUrl;
    return null;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Guest profile view
  if (isGuest) {
    return (
      <div className="min-h-screen bg-ivory-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="w-32 h-32 bg-white rounded-[48px] flex items-center justify-center mx-auto shadow-sm border border-slate-100">
            <div className="text-5xl">👤</div>
          </div>

          <div className="space-y-4">
            <h1 className="text-h1">Anonymous</h1>
            <p className="text-body text-slate-500">
              Unlock your flavor history and <br />
              personalized rewards.
            </p>
          </div>

          <Link
            href={`/login?token=${currentToken}`}
            className="btn-primary block w-full shadow-slate-200"
          >
            Sign Up / Login
          </Link>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            Exclusive Dining Access
          </p>
        </div>
        <BottomNav token={currentToken || ""} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100 pb-[240px]">
      {/* Dynamic Header */}
      <div className="sticky top-0 z-30 bg-ivory-100/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:border-slate-900 transition-all active:scale-95"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-h2">Identity</h1>
          </div>

          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
          >
            <svg
              className="w-5 h-5"
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
          </button>
        </div>
      </div>

      <main className="px-6 pt-8 space-y-8">
        {/* Status Feedback */}
        {(success || error) && (
          <div
            className={`p-4 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-3 animate-fade-in ${success ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {success || error}
          </div>
        )}

        {/* Hero Profile Card */}
        <section className="space-y-6">
          <div className="bento-card bg-white p-8 group transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />

            <div className="flex flex-col items-center text-center space-y-6">
              {/* Avatar Large */}
              <div className="relative">
                <div
                  className="w-32 h-32 rounded-[48px] overflow-hidden bg-white border-4 border-white shadow-2xl relative cursor-pointer group/avatar"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {getProfileImage() ? (
                    <Image
                      src={getProfileImage()!}
                      alt="Profile"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-slate-50">
                      👤
                    </div>
                  )}

                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-slate-900/0 group-hover/avatar:bg-slate-900/10 transition-colors" />
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white active:scale-90"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 leading-none">
                  {firstName || lastName
                    ? `${firstName} ${lastName}`.trim()
                    : "Set Your Name"}
                </h2>
                <p className="text-sm font-medium text-slate-400">
                  {customer?.email || "No email linked"}
                </p>
              </div>

              <div className="flex gap-2">
                <div className="px-4 py-2 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Verified Member
                  </span>
                </div>
                {customer?.isGoogleLogin && (
                  <div className="px-4 py-2 bg-white rounded-full border border-slate-200 flex items-center gap-2 shadow-sm">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Google Linked
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Action Grid */}
        <section className="grid grid-cols-2 gap-4">
          {/* Order History Card */}
          <button
            onClick={handleViewOrderHistory}
            className="bento-card bg-white p-6 text-left group hover:bg-slate-900 transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-white/10 flex items-center justify-center mb-4 transition-colors">
              <svg
                className="w-5 h-5 text-slate-400 group-hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-white mb-1">
              Journal
            </h4>
            <p className="text-[10px] text-slate-400 group-hover:text-white/60 font-medium">
              Order History
            </p>
          </button>

          {/* Personal Info Card */}
          <button
            onClick={() => setIsEditing(true)}
            disabled={customer?.googleId ? true : false}
            className="bento-card bg-white p-6 text-left group hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-white/10 flex items-center justify-center mb-4 transition-colors">
              <svg
                className="w-5 h-5 text-slate-400 group-hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-white mb-1">
              Details
            </h4>
            <p className="text-[10px] text-slate-400 group-hover:text-white/60 font-medium">
              Personal Information
            </p>
          </button>

          {/* Security Card */}
          {!customer?.isGoogleLogin && (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bento-card bg-white p-6 text-left group hover:bg-slate-900 transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-white/10 flex items-center justify-center mb-4 transition-colors">
                <svg
                  className="w-5 h-5 text-slate-400 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-white mb-1">
                Pass
              </h4>
              <p className="text-[10px] text-slate-400 group-hover:text-white/60 font-medium">
                Auth Settings
              </p>
            </button>
          )}

          {/* Help Card */}
          <button
            onClick={() => setShowFAQ(true)}
            className="bento-card bg-white p-6 text-left group hover:bg-slate-900 transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-white/10 flex items-center justify-center mb-4 transition-colors">
              <svg
                className="w-5 h-5 text-slate-400 group-hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-white mb-1">
              Inquiry
            </h4>
            <p className="text-[10px] text-slate-400 group-hover:text-white/60 font-medium">
              Help Center
            </p>
          </button>
        </section>

        {/* Profile Edit Overlay */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
            <div className="w-full max-w-lg bg-ivory-100 rounded-[40px] shadow-2xl overflow-hidden animate-slide-up border border-white/50">
              <div className="px-8 py-6 flex justify-between items-center border-b border-slate-200/50 bg-white/50 backdrop-blur-md">
                <div className="space-y-1">
                  <h2 className="text-h2 leading-none">Edit Profile</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Update Personal Details
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm active:scale-90"
                >
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={handleUpdateProfile}
                className="px-8 py-8 space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-[18px] py-4 px-5 text-sm font-medium focus:border-slate-900 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-[18px] py-4 px-5 text-sm font-medium focus:border-slate-900 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-[18px] py-4 px-5 text-sm font-medium focus:border-slate-900 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-[18px] py-4 px-5 text-sm font-medium focus:border-slate-900 transition-all shadow-sm"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 h-16 rounded-[24px] bg-white border border-slate-200 text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 active:scale-95 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] btn-primary h-16 shadow-slate-200"
                  >
                    {loading ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password change modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm fade-in max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Change Password</h2>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl ${
                      passwordValidationErrors.currentPassword
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    required
                  />
                  {passwordValidationErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {passwordValidationErrors.currentPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setNewPasswordStrength(
                        validatePasswordComplexity(e.target.value),
                      );
                    }}
                    className={`w-full px-4 py-3 border rounded-xl ${
                      passwordValidationErrors.newPassword
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    required
                  />
                  {passwordValidationErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {passwordValidationErrors.newPassword}
                    </p>
                  )}

                  {/* Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg">
                      {/* Strength Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">
                            Strength
                          </span>
                          <span
                            className={`text-xs font-bold ${getPasswordStrengthColor(
                              newPasswordStrength.score,
                            )}`}
                          >
                            {getPasswordStrengthLabel(
                              newPasswordStrength.score,
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthBarColor(
                              newPasswordStrength.score,
                            )}`}
                            style={{
                              width: `${(newPasswordStrength.score / 5) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">
                          Requirements:
                        </p>
                        <div className="space-y-0.5 text-xs">
                          <div
                            className={
                              newPasswordStrength.requirements.minLength
                                ? "text-green-600 flex items-center gap-1"
                                : "text-gray-500 flex items-center gap-1"
                            }
                          >
                            <span
                              className={
                                newPasswordStrength.requirements.minLength
                                  ? "text-green-500"
                                  : "text-gray-400"
                              }
                            >
                              {newPasswordStrength.requirements.minLength
                                ? "✓"
                                : "○"}
                            </span>
                            8+ characters
                          </div>
                          <div
                            className={
                              newPasswordStrength.requirements.hasUpperCase
                                ? "text-green-600 flex items-center gap-1"
                                : "text-gray-500 flex items-center gap-1"
                            }
                          >
                            <span
                              className={
                                newPasswordStrength.requirements.hasUpperCase
                                  ? "text-green-500"
                                  : "text-gray-400"
                              }
                            >
                              {newPasswordStrength.requirements.hasUpperCase
                                ? "✓"
                                : "○"}
                            </span>
                            Uppercase (A-Z)
                          </div>
                          <div
                            className={
                              newPasswordStrength.requirements.hasLowerCase
                                ? "text-green-600 flex items-center gap-1"
                                : "text-gray-500 flex items-center gap-1"
                            }
                          >
                            <span
                              className={
                                newPasswordStrength.requirements.hasLowerCase
                                  ? "text-green-500"
                                  : "text-gray-400"
                              }
                            >
                              {newPasswordStrength.requirements.hasLowerCase
                                ? "✓"
                                : "○"}
                            </span>
                            Lowercase (a-z)
                          </div>
                          <div
                            className={
                              newPasswordStrength.requirements.hasNumber
                                ? "text-green-600 flex items-center gap-1"
                                : "text-gray-500 flex items-center gap-1"
                            }
                          >
                            <span
                              className={
                                newPasswordStrength.requirements.hasNumber
                                  ? "text-green-500"
                                  : "text-gray-400"
                              }
                            >
                              {newPasswordStrength.requirements.hasNumber
                                ? "✓"
                                : "○"}
                            </span>
                            Number (0-9)
                          </div>
                          <div
                            className={
                              newPasswordStrength.requirements.hasSpecialChar
                                ? "text-green-600 flex items-center gap-1"
                                : "text-gray-500 flex items-center gap-1"
                            }
                          >
                            <span
                              className={
                                newPasswordStrength.requirements.hasSpecialChar
                                  ? "text-green-500"
                                  : "text-gray-400"
                              }
                            >
                              {newPasswordStrength.requirements.hasSpecialChar
                                ? "✓"
                                : "○"}
                            </span>
                            Special char (!@#$%...)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl ${
                      passwordValidationErrors.confirmPassword
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    required
                  />
                  {passwordValidationErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {passwordValidationErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordError("");
                      setPasswordValidationErrors({});
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex-1 py-3 border border-gray-200 rounded-full font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 py-3 bg-[#fa4a0c] text-white rounded-full font-medium disabled:opacity-50"
                  >
                    {passwordLoading ? "Changing..." : "Change"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order history modal */}
        {showOrderHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md fade-in max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Order History</h2>
                <button
                  onClick={() => setShowOrderHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {orderHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mb-3">
                    <svg
                      className="w-12 h-12 text-gray-300 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No orders yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Start ordering to see your history here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderHistory.map((order: Record<string, any>) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {order.orderId}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              order.paidAt || order.createdAt,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            ${Number(order.total).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-gray-600">
                          {Array.isArray(order.items) && order.items.length > 0
                            ? `${order.items.length} item${order.items.length !== 1 ? "s" : ""}`
                            : "No items"}
                        </p>
                        {Array.isArray(order.items) &&
                          order.items.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                              {order.items
                                .slice(0, 2)
                                .map(
                                  (item: Record<string, any>, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between"
                                    >
                                      <span>
                                        {item.menuItemName || item.name}
                                      </span>
                                      <span className="text-gray-400">
                                        x{item.quantity}
                                      </span>
                                    </div>
                                  ),
                                )}
                              {order.items.length > 2 && (
                                <div className="text-gray-400">
                                  +{order.items.length - 2} more item(s)
                                </div>
                              )}
                            </div>
                          )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          ✓ Paid
                        </span>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {order.status || "Completed"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAQ modal */}
        {showFAQ && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md fade-in max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  Frequently Asked Questions
                </h2>
                <button
                  onClick={() => setShowFAQ(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {faqData.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedFAQ(expandedFAQ === index ? null : index)
                      }
                      className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-sm pr-2">
                        {faq.question}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                          expandedFAQ === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {expandedFAQ === index && (
                      <div className="px-4 pb-3">
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav token={currentToken || ""} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
