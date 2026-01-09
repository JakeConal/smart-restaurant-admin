"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { profileApi } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

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
      id: string;
      orderId: string;
      paidAt: string;
      total: number;
      items: Array<{ id: string; name: string }>;
      status: string;
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

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loadedAvatar, setLoadedAvatar] = useState<string | null>(null);

  const currentToken = searchParams.get("token") || token;

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
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    } else if (newPassword.length > 50) {
      errors.newPassword = "Password must be less than 50 characters";
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
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password",
      );
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
    try {
      // Fetch order history from API
      const response = await fetch(`/api/orders/history/${customer.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order history");
      }

      const data = await response.json();
      setOrderHistory(data.data || []);
      setShowOrderHistory(true);
    } catch (err) {
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

  if (!isAuthenticated) return null;

  // Guest profile view
  if (isGuest) {
    return (
      <div className="min-h-screen pb-24 safe-bottom">
        <div className="pt-8 px-6">
          <button onClick={() => router.back()} className="mb-4">
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold mb-8">My profile</h1>
        </div>

        <div className="px-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Guest User</h2>
            <p className="text-gray-500 mb-6">
              Create an account to save your preferences and order history
            </p>
            <button
              onClick={() => router.push(`/login?token=${currentToken}`)}
              className="w-full py-4 bg-[#fa4a0c] text-white rounded-full font-semibold hover:bg-[#e04009] transition-colors"
            >
              Sign Up / Login
            </button>
          </div>
        </div>

        <BottomNav token={currentToken || ""} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 safe-bottom">
      {/* Header */}
      <div className="pt-8 px-6">
        <button onClick={() => router.back()} className="mb-4">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-3xl font-bold mb-8">My profile</h1>
      </div>

      {/* Success message */}
      {success && (
        <div className="mx-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm fade-in">
          {success}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Personal details section */}
      <div className="px-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Personal details</h2>
          {!isEditing && !customer?.googleId && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-[#fa4a0c] text-sm font-medium"
            >
              change
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex gap-4">
            {/* Profile photo */}
            <div className="relative">
              <div
                className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {getProfileImage() ? (
                  <Image
                    src={getProfileImage()!}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    👤
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full spinner"></div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#fa4a0c] text-white rounded-full flex items-center justify-center shadow-md"
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
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>

            {/* User info */}
            <div className="flex-1">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          validationErrors.firstName
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        }`}
                      />
                      {validationErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          validationErrors.lastName
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        }`}
                      />
                      {validationErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone number"
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${
                        validationErrors.phoneNumber
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    />
                    {validationErrors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${
                        validationErrors.dateOfBirth
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    />
                    {validationErrors.dateOfBirth && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setValidationErrors({});
                      }}
                      className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2 bg-[#fa4a0c] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="font-semibold text-lg">
                    {firstName || lastName
                      ? `${firstName} ${lastName}`.trim()
                      : "No name set"}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {customer?.email}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-gray-500 text-sm">
                      {phoneNumber || "No phone number"}
                    </p>
                  </div>
                  {dateOfBirth && (
                    <p className="text-gray-500 text-sm mt-1">
                      Born: {new Date(dateOfBirth).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="px-6 space-y-3">
        {/* Orders */}
        <button
          onClick={handleViewOrderHistory}
          disabled={loadingOrders}
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span className="font-semibold">
            {loadingOrders ? "Loading..." : "Order History"}
          </span>
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Change password (only for non-Google users) */}
        {!customer?.googleId && (
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold">Change Password</span>
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Pending reviews */}
        <button className="w-full bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center hover:bg-gray-50 transition-colors">
          <span className="font-semibold">Pending reviews</span>
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* FAQ */}
        <button className="w-full bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center hover:bg-gray-50 transition-colors">
          <span className="font-semibold">FAQ</span>
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Help */}
        <button className="w-full bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center hover:bg-gray-50 transition-colors">
          <span className="font-semibold">Help</span>
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Logout button */}
      <div className="px-6 mt-8">
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-[#fa4a0c] text-white rounded-full font-semibold hover:bg-[#e04009] transition-colors"
        >
          Log Out
        </button>
      </div>

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
                  onChange={(e) => setNewPassword(e.target.value)}
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
                <p className="text-xs text-gray-500 mt-1">
                  At least 6 characters, max 50 characters
                </p>
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
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderHistory.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{order.orderId}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.paidAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold">₫{order.total.toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-2">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {order.status}
                      </span>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
