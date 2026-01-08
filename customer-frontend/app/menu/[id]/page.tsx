"use client";

import { useState, useEffect, Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { useCart } from "@/lib/cart-context";
import { menuApi, reviewApi } from "@/lib/api";
import { MenuItem, MenuResponse, Review } from "@/lib/types";

function ItemDetailContent({ itemId }: { itemId: string }) {
  // NEW MODERN DESIGN
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, authToken, customer } = useApp();
  const { addItem, getTotalItems } = useCart();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >({});
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState(5);
  const [editingComment, setEditingComment] = useState("");
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const currentToken = searchParams.get("token") || token;

  // Set mounted flag to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
    }
  }, [isAuthenticated, currentToken, router, mounted]);

  // Fetch item details
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!currentToken) return;

      try {
        setLoading(true);
        const response = (await menuApi.getMenu(currentToken)) as MenuResponse;

        if (response.success) {
          const foundItem = response.menu.items.find((i) => i.id === itemId);
          if (foundItem) {
            setItem(foundItem);

            // Get related items from same category
            const related = response.menu.items
              .filter(
                (i) => i.id !== itemId && i.categoryId === foundItem.categoryId,
              )
              .slice(0, 4);
            setRelatedItems(related);

            // Initialize modifiers
            const initialModifiers: Record<string, string[]> = {};
            foundItem.modifierGroups.forEach((group) => {
              initialModifiers[group.id] = [];
            });
            setSelectedModifiers(initialModifiers);
          } else {
            setError("Item not found");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load item");
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [currentToken, itemId]);

  // Reset reviews when itemId changes
  useEffect(() => {
    setReviews([]);
    setAverageRating(0);
    setTotalReviews(0);
  }, [itemId]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!currentToken) return;

      try {
        const response = (await menuApi.getMenu(currentToken)) as MenuResponse;
        const menuItem = response.menu.items.find((item) => item.id === itemId);
        const restaurantId = menuItem?.restaurantId || "";

        if (!restaurantId) return;

        const [reviewsData, ratingData] = await Promise.all([
          reviewApi.getItemReviews(itemId, restaurantId, { limit: 5 }),
          reviewApi.getAverageRating(itemId, restaurantId),
        ]);

        const reviewsResponse = reviewsData as {
          reviews?: Review[];
          pagination?: unknown;
        };
        if (reviewsResponse?.reviews) {
          setReviews(reviewsResponse.reviews);
        } else {
          setReviews([]);
        }

        const ratingResponse = ratingData as {
          averageRating?: number;
          totalReviews?: number;
        };
        if (ratingResponse?.averageRating !== undefined) {
          setAverageRating(ratingResponse.averageRating);
          setTotalReviews(ratingResponse.totalReviews || 0);
        } else {
          setAverageRating(0);
          setTotalReviews(0);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
        setReviews([]);
        setAverageRating(0);
        setTotalReviews(0);
      }
    };

    if (currentToken && itemId) {
      fetchReviews();
    }
  }, [currentToken, itemId, reviewsRefreshKey]);

  const handleModifierChange = (
    groupId: string,
    optionId: string,
    selectionType: "single" | "multiple",
  ) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];

      if (selectionType === "single") {
        return { ...prev, [groupId]: [optionId] };
      } else {
        if (current.includes(optionId)) {
          return {
            ...prev,
            [groupId]: current.filter((id) => id !== optionId),
          };
        } else {
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  const calculateTotalPrice = () => {
    if (!item) return 0;

    let total = item.price;

    Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
      const group = item.modifierGroups.find((g) => g.id === groupId);
      if (group) {
        optionIds.forEach((optionId) => {
          const option = group.options.find((o) => o.id === optionId);
          if (option) {
            total += option.priceAdjustment;
          }
        });
      }
    });

    return total * quantity;
  };

  const handleAddToCart = () => {
    if (!item || !item.canOrder) return;

    // Check required modifiers
    const missingRequired = item.modifierGroups
      .filter((g) => g.isRequired)
      .find((g) => !selectedModifiers[g.id]?.length);

    if (missingRequired) {
      alert(`Please select an option for "${missingRequired.name}"`);
      return;
    }

    // Build modifiers array
    const modifiers: Array<{
      groupId: string;
      groupName: string;
      optionId: string;
      optionName: string;
      priceAdjustment: number;
    }> = [];
    Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
      const group = item.modifierGroups.find((g) => g.id === groupId);
      if (group) {
        optionIds.forEach((optionId) => {
          const option = group.options.find((o) => o.id === optionId);
          if (option) {
            modifiers.push({
              groupId: group.id,
              groupName: group.name,
              optionId: option.id,
              optionName: option.name,
              priceAdjustment: option.priceAdjustment,
            });
          }
        });
      }
    });

    addItem(item, quantity, modifiers, specialInstructions || undefined);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleSubmitReview = async () => {
    if (!authToken || reviewRating < 1 || reviewRating > 5) {
      setReviewError(
        "Please provide a valid rating. You must be logged in to review.",
      );
      return;
    }

    if (!currentToken) {
      setReviewError("No valid session token found.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");
    setReviewSuccess(false);

    try {
      await reviewApi.createReview(authToken, {
        menuItemId: itemId,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });

      setReviewSuccess(true);
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);

      // Trigger reviews refresh
      setReviewsRefreshKey((prev) => prev + 1);

      // Refresh reviews
      try {
        const response = (await menuApi.getMenu(currentToken)) as MenuResponse;
        const menuItem = response.menu.items.find((item) => item.id === itemId);
        const restaurantId = menuItem?.restaurantId || "";

        if (restaurantId) {
          const reviewsData = await reviewApi.getItemReviews(
            itemId,
            restaurantId,
            { limit: 5 },
          );
          const reviewsResponse = reviewsData as {
            reviews?: Review[];
            pagination?: unknown;
          };
          if (reviewsResponse?.reviews) {
            setReviews(reviewsResponse.reviews);
          }

          const ratingData = await reviewApi.getAverageRating(
            itemId,
            restaurantId,
          );
          const ratingResponse = ratingData as {
            averageRating?: number;
            totalReviews?: number;
          };
          if (ratingResponse?.averageRating !== undefined) {
            setAverageRating(ratingResponse.averageRating);
            setTotalReviews(ratingResponse.totalReviews || 0);
          }
        }
      } catch (err) {
        console.error("Failed to refresh reviews:", err);
      }

      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to submit review",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = async (reviewId: string) => {
    if (!authToken || editingRating < 1 || editingRating > 5) {
      setReviewError("Please provide a valid rating");
      return;
    }

    if (!currentToken) {
      setReviewError("No valid session token found.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    try {
      await reviewApi.updateReview(reviewId, authToken, {
        rating: editingRating,
        comment: editingComment || undefined,
      });

      setEditingReviewId(null);
      setReviewsRefreshKey((prev) => prev + 1);

      // Refresh reviews
      try {
        const response = (await menuApi.getMenu(currentToken)) as MenuResponse;
        const menuItem = response.menu.items.find((item) => item.id === itemId);
        const restaurantId = menuItem?.restaurantId || "";

        if (restaurantId) {
          const reviewsData = await reviewApi.getItemReviews(
            itemId,
            restaurantId,
            { limit: 5 },
          );
          const reviewsResponse = reviewsData as {
            reviews?: Review[];
            pagination?: unknown;
          };
          if (reviewsResponse?.reviews) {
            setReviews(reviewsResponse.reviews);
          }

          const ratingData = await reviewApi.getAverageRating(
            itemId,
            restaurantId,
          );
          const ratingResponse = ratingData as {
            averageRating?: number;
            totalReviews?: number;
          };
          if (ratingResponse?.averageRating !== undefined) {
            setAverageRating(ratingResponse.averageRating);
            setTotalReviews(ratingResponse.totalReviews || 0);
          }
        }
      } catch (err) {
        console.error("Failed to refresh reviews:", err);
      }
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to update review",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!authToken) {
      setReviewError("Not authenticated");
      return;
    }

    if (!currentToken) {
      setReviewError("No valid session token found.");
      return;
    }

    setSubmittingReview(true);

    try {
      await reviewApi.deleteReview(reviewId, authToken);

      setDeletingReviewId(null);
      setReviewsRefreshKey((prev) => prev + 1);

      // Refresh reviews
      try {
        const response = (await menuApi.getMenu(currentToken)) as MenuResponse;
        const menuItem = response.menu.items.find((item) => item.id === itemId);
        const restaurantId = menuItem?.restaurantId || "";

        if (restaurantId) {
          const reviewsData = await reviewApi.getItemReviews(
            itemId,
            restaurantId,
            { limit: 5 },
          );
          const reviewsResponse = reviewsData as {
            reviews?: Review[];
            pagination?: unknown;
          };
          if (reviewsResponse?.reviews) {
            setReviews(reviewsResponse.reviews);
          }

          const ratingData = await reviewApi.getAverageRating(
            itemId,
            restaurantId,
          );
          const ratingResponse = ratingData as {
            averageRating?: number;
            totalReviews?: number;
          };
          if (ratingResponse?.averageRating !== undefined) {
            setAverageRating(ratingResponse.averageRating);
            setTotalReviews(ratingResponse.totalReviews || 0);
          }
        }
      } catch (err) {
        console.error("Failed to refresh reviews:", err);
      }
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to delete review",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!item?.photos || item.photos.length <= 1) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setSelectedPhotoIndex((prev) =>
        prev === item.photos!.length - 1 ? 0 : prev + 1,
      );
    }
    if (isRightSwipe) {
      setSelectedPhotoIndex((prev) =>
        prev === 0 ? item.photos!.length - 1 : prev - 1,
      );
    }
  };

  const getStatusInfo = () => {
    if (!item) return null;

    switch (item.status) {
      case "available":
        return { text: "Available", class: "status-available", canOrder: true };
      case "unavailable":
        return {
          text: "Unavailable",
          class: "status-unavailable",
          canOrder: false,
        };
      case "sold_out":
        return { text: "Sold Out", class: "status-sold-out", canOrder: false };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  // Prevent hydration mismatch by checking mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold mb-2">Item not found</h2>
        <p className="text-gray-500 text-center mb-4">{error}</p>
        <Link
          href={`/menu?token=${currentToken}`}
          className="px-6 py-3 bg-[#fa4a0c] text-white rounded-full"
        >
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-25">
      {/* Enhanced Header with Glass Effect */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-orange-100/50 shadow-sm">
        <div className="flex justify-between items-center p-6">
          <button
            onClick={() => router.back()}
            className="group w-12 h-12 bg-white/90 hover:bg-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100/50"
          >
            <svg
              className="w-6 h-6 text-gray-700 group-hover:text-orange-600 transition-colors duration-300"
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

          <div className="flex items-center gap-3">
            <Link
              href={`/cart?token=${currentToken}`}
              className="group relative w-12 h-12 bg-white/90 hover:bg-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100/50"
            >
              <svg
                className="w-6 h-6 text-gray-700 group-hover:text-orange-600 transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {getTotalItems() > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {getTotalItems() > 99 ? "99+" : getTotalItems()}
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Image Section with Enhanced Design */}
      <div className="relative">
        <div className="h-80 bg-gradient-to-br from-orange-100 via-orange-50 to-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-300 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Main Product Image with Enhanced Styling */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4">
          <div className="relative">
            <div
              className="w-72 h-72 rounded-full overflow-hidden bg-white shadow-2xl ring-8 ring-white/50 backdrop-blur-sm cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {item.photos &&
              item.photos.length > 0 &&
              item.photos[selectedPhotoIndex]?.data ? (
                <Image
                  src={item.photos[selectedPhotoIndex].data}
                  alt={`${item.name} - Photo ${selectedPhotoIndex + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  priority
                />
              ) : item.primaryPhotoUrl ? (
                <Image
                  src={item.primaryPhotoUrl}
                  alt={item.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-9xl bg-gradient-to-br from-orange-50 to-orange-100">
                  🍽️
                </div>
              )}
            </div>

            {/* Image Glow Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/20 to-orange-600/20 blur-xl scale-110 -z-10"></div>

            {/* Photo Gallery Indicators */}
            {item.photos && item.photos.length > 1 && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                {item.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === selectedPhotoIndex
                        ? "bg-orange-500 w-8"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`View photo ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Container with Enhanced Spacing */}
      <div className="mt-48 px-6 pb-32">
        {/* Status Badges with Premium Design */}
        <div className="flex items-center gap-3 mb-4">
          {statusInfo && (
            <div
              className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm border backdrop-blur-sm ${statusInfo.class}`}
            >
              <span className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    statusInfo.canOrder
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                ></div>
                {statusInfo.text}
              </span>
            </div>
          )}
          {item.isChefRecommended && (
            <div className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full shadow-sm border border-amber-200/50 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                👨‍🍳 Chef&apos;s Recommendation
              </span>
            </div>
          )}
        </div>

        {/* Product Title and Price with Enhanced Typography */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
            {item.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-orange-600">
              ${item.price.toFixed(2)}
            </span>
            {item.prepTimeMinutes > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                {item.prepTimeMinutes} min
              </div>
            )}
          </div>
        </div>

        {/* Description with Better Formatting */}
        {item.description && (
          <div className="mb-8 p-6 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50">
            <h2 className="font-bold text-lg mb-3 text-gray-900">
              About this dish
            </h2>
            <p className="text-gray-700 leading-relaxed">{item.description}</p>
          </div>
        )}

        {/* Enhanced Modifiers Section */}
        {item.modifierGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-xl mb-6 text-gray-900">
              Customize your order
            </h2>
            <div className="space-y-6">
              {item.modifierGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-6 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-lg text-gray-900">
                      {group.name}
                    </span>
                    {group.isRequired && (
                      <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium border border-red-200">
                        Required
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className="group flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white rounded-2xl cursor-pointer transition-all duration-300 border border-transparent hover:border-orange-200 hover:shadow-sm"
                        onClick={() =>
                          handleModifierChange(
                            group.id,
                            option.id,
                            group.selectionType,
                          )
                        }
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`relative w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                              selectedModifiers[group.id]?.includes(option.id)
                                ? "border-orange-500 bg-orange-500"
                                : "border-gray-300 group-hover:border-orange-300"
                            }`}
                          >
                            {selectedModifiers[group.id]?.includes(
                              option.id,
                            ) && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {option.name}
                          </span>
                        </div>
                        {option.priceAdjustment > 0 && (
                          <span className="text-orange-600 font-bold">
                            +${option.priceAdjustment.toFixed(2)}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Special Instructions */}
        <div className="mb-8 p-6 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50">
          <h2 className="font-bold text-lg mb-4 text-gray-900">
            Special instructions
          </h2>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any allergies, dietary restrictions, or special requests?"
            className="w-full p-4 bg-gray-50/50 rounded-2xl border-none resize-none h-24 focus:ring-2 focus:ring-orange-500/50 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
          />
        </div>

        {/* Enhanced Quantity Selector */}
        <div className="mb-8 p-6 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg text-gray-900">Quantity</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 font-bold text-gray-700"
              >
                −
              </button>
              <div className="w-16 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                <span className="text-xl font-bold text-orange-600">
                  {quantity}
                </span>
              </div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 font-bold text-white"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Reviews Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-xl text-gray-900">
                Customer reviews
              </h2>
              <div className="flex items-center gap-3 mt-2">
                {totalReviews > 0 && (
                  <>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(averageRating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {averageRating.toFixed(1)} ({totalReviews} reviews)
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setShowReviewForm(!showReviewForm);
                setReviewError("");
              }}
              className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors duration-300 border border-orange-200"
            >
              {showReviewForm ? "Cancel" : "Write Review"}
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="p-6 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50 mb-6">
              <h3 className="font-bold text-lg mb-4 text-gray-900">
                Share your experience
              </h3>

              {/* Rating Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Rating
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="transition-transform duration-300 hover:scale-110"
                    >
                      <svg
                        className={`w-8 h-8 ${
                          star <= reviewRating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        } cursor-pointer`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Comment (optional)
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this dish..."
                  maxLength={500}
                  className="w-full p-4 bg-gray-50/50 rounded-2xl border-none resize-none h-24 focus:ring-2 focus:ring-orange-500/50 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {reviewComment.length}/500 characters
                </p>
              </div>

              {/* Error message */}
              {reviewError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
                  {reviewError}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className={`w-full py-3 rounded-2xl font-bold text-white transition-all duration-300 ${
                  submittingReview
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                }`}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          )}

          {/* Success message */}
          {reviewSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Thank you! Your review has been posted successfully.
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 && (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-6 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50"
                >
                  {editingReviewId === review.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setEditingRating(i + 1)}
                            className="transition-all duration-300"
                          >
                            <svg
                              className={`w-6 h-6 ${
                                i < editingRating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={editingComment}
                        onChange={(e) => setEditingComment(e.target.value)}
                        placeholder="Update your review..."
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingReviewId(null)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                          disabled={submittingReview}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditReview(review.id)}
                          disabled={submittingReview}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          {submittingReview ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : deletingReviewId === review.id ? (
                    // Delete Confirmation
                    <div className="space-y-4">
                      <p className="text-gray-700">
                        Are you sure you want to delete this review?
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setDeletingReviewId(null)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                          disabled={submittingReview}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={submittingReview}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {submittingReview ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Review Display
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                            {review.customerName.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-900">
                            {review.customerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                          </div>
                          {customer?.id === review.customerId && (
                            <div className="flex gap-2 ml-2">
                              <button
                                onClick={() => {
                                  setEditingReviewId(review.id);
                                  setEditingRating(review.rating);
                                  setEditingComment(review.comment || "");
                                }}
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                                  <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeletingReviewId(review.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {reviews.length === 0 && !showReviewForm && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-3">No reviews yet. Be the first to review!</p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-6 py-2 bg-orange-100 text-orange-700 rounded-full font-medium hover:bg-orange-200 transition-colors duration-300"
              >
                Write a Review
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Related Items */}
        {relatedItems.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-xl mb-6 text-gray-900">
              You might also like
            </h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
              {relatedItems.map((relatedItem) => (
                <Link
                  key={relatedItem.id}
                  href={`/menu/${relatedItem.id}?token=${currentToken}`}
                  className="flex-shrink-0 w-40 group"
                >
                  <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50 p-4 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-3 group-hover:shadow-lg transition-shadow">
                      {relatedItem.primaryPhotoUrl ? (
                        <Image
                          src={relatedItem.primaryPhotoUrl}
                          alt={relatedItem.name}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 leading-tight">
                      {relatedItem.name}
                    </p>
                    <p className="text-orange-600 font-bold text-lg">
                      ${relatedItem.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Bottom CTA with Premium Design */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-xl border-t border-white/50">
        <div className="max-w-md mx-auto">
          <div className="flex gap-4">
            {/* Quantity Preview */}
            <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Total</div>
                <div className="text-2xl font-bold text-orange-600">
                  ${calculateTotalPrice().toFixed(2)}
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!item.canOrder || addedToCart}
              className={`flex-1 h-16 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 ${
                addedToCart
                  ? "bg-green-500 text-white shadow-green-200"
                  : item.canOrder
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-orange-200 hover:shadow-xl hover:scale-105"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {addedToCart ? (
                <span className="flex items-center justify-center gap-2">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Added!
                </span>
              ) : item.canOrder ? (
                <span className="flex items-center justify-center gap-2">
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
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Add to Cart
                </span>
              ) : (
                "Unavailable"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
        </div>
      }
    >
      <ItemDetailContent itemId={id} />
    </Suspense>
  );
}
