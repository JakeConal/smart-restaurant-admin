"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { useCart } from "@/lib/cart-context";
import { menuApi, reviewApi } from "@/lib/api";
import { MenuItem, Review } from "@/lib/types";

interface ItemDetailClientProps {
  itemId: string;
  initialItem: MenuItem | null;
  initialRelatedItems: MenuItem[];
  initialReviews: Review[];
  initialAverageRating: number;
  initialTotalReviews: number;
  initialToken: string | null;
}

export default function ItemDetailClient({
  itemId,
  initialItem,
  initialRelatedItems,
  initialReviews,
  initialAverageRating,
  initialTotalReviews,
  initialToken,
}: ItemDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, authToken } = useApp();
  const { addItem, getTotalItems } = useCart();

  const [item, setItem] = useState<MenuItem | null>(initialItem);
  const [relatedItems, setRelatedItems] =
    useState<MenuItem[]>(initialRelatedItems);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [totalReviews, setTotalReviews] = useState(initialTotalReviews);
  const [loading, setLoading] = useState(!initialItem);
  const [error, setError] = useState(initialItem ? "" : "Item not found");
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >(() => {
    const initialModifiers: Record<string, string[]> = {};
    initialItem?.modifierGroups.forEach((group) => {
      initialModifiers[group.id] = [];
    });
    return initialModifiers;
  });
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

  const currentToken = initialToken || searchParams.get("token") || token;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated && !initialItem) {
      router.replace(`/login?token=${currentToken}`);
    }
  }, [isAuthenticated, currentToken, router, mounted, initialItem]);

  // Refresh reviews if key changes
  useEffect(() => {
    const fetchReviews = async () => {
      if (!currentToken || !item?.restaurantId) return;

      try {
        const [reviewsData, ratingData] = await Promise.all([
          reviewApi.getItemReviews(itemId, item.restaurantId, { limit: 5 }),
          reviewApi.getAverageRating(itemId, item.restaurantId),
        ]);

        const reviewsResponse = reviewsData as {
          reviews?: Review[];
        };
        if (reviewsResponse?.reviews) {
          setReviews(reviewsResponse.reviews);
        }

        const ratingResponse = ratingData as {
          averageRating?: number;
          totalReviews?: number;
        };
        if (ratingResponse?.averageRating !== undefined) {
          setAverageRating(ratingResponse.averageRating);
          setTotalReviews(ratingResponse.totalReviews || 0);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    };

    if (mounted && reviewsRefreshKey > 0) {
      fetchReviews();
    }
  }, [reviewsRefreshKey, currentToken, itemId, item?.restaurantId, mounted]);

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

    const missingRequired = item.modifierGroups
      .filter((g) => g.isRequired)
      .find((g) => !selectedModifiers[g.id]?.length);

    if (missingRequired) {
      alert(`Please select an option for "${missingRequired.name}"`);
      return;
    }

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

    setSubmittingReview(true);
    setReviewError("");

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
      setReviewsRefreshKey((prev) => prev + 1);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to submit review",
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

  const statusInfo = !item
    ? null
    : {
        available: {
          text: "Available",
          class: "bg-emerald-50 text-emerald-600 border-emerald-100",
          dot: "bg-emerald-400",
          canOrder: true,
        },
        unavailable: {
          text: "Unavailable",
          class: "bg-red-50 text-red-600 border-red-100",
          dot: "bg-red-400",
          canOrder: false,
        },
        sold_out: {
          text: "Sold Out",
          class: "bg-red-50 text-red-600 border-red-100",
          dot: "bg-red-400",
          canOrder: false,
        },
      }[item.status as "available" | "unavailable" | "sold_out"] || null;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin"></div>
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
          className="px-6 py-3 bg-slate-900 text-white rounded-full"
        >
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100 pb-40">
      {/* Dynamic Header */}
      <div className="sticky top-0 z-30 bg-ivory-100/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm active:scale-90 transition-all hover:border-slate-900"
          >
            <svg
              className="w-5 h-5 text-slate-600"
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
              className="group relative w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all hover:border-slate-900"
            >
              <svg
                className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {getTotalItems() > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg">
                  {getTotalItems() > 99 ? "99" : getTotalItems()}
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <section className="relative h-[45vh] bg-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-50 via-white to-white" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-[85vw] max-w-[320px] aspect-square rounded-[40px] overflow-hidden bg-slate-50 shadow-2xl relative cursor-grab active:cursor-grabbing group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {item.photos && item.photos.length > 0 ? (
              <Image
                src={menuApi.getPhotoUrl(
                  item.photos[selectedPhotoIndex]?.data ||
                    item.primaryPhotoUrl ||
                    "",
                )}
                alt={`${item.name} - Photo ${selectedPhotoIndex + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
                unoptimized
              />
            ) : item.primaryPhotoUrl ? (
              <Image
                src={menuApi.getPhotoUrl(item.primaryPhotoUrl)}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl bg-slate-50">
                🍽️
              </div>
            )}
          </div>
        </div>

        {item.photos && item.photos.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {item.photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedPhotoIndex(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === selectedPhotoIndex
                    ? "bg-slate-900 w-6"
                    : "bg-slate-200 w-2"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      <div className="px-6 py-8 space-y-8">
        {/* Core Info */}
        <section className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-h1 flex-1 text-left">{item.name}</h1>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                ${item.price.toFixed(2)}
              </span>
              {item.prepTimeMinutes > 0 && (
                <div className="flex items-center justify-end gap-1 mt-1 text-slate-400">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {item.prepTimeMinutes}m wait
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusInfo && (
              <div
                className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${statusInfo.class}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot} ${statusInfo.canOrder ? "animate-pulse" : ""}`}
                />
                {statusInfo.text}
              </div>
            )}
            {item.isChefRecommended && (
              <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                Chef Recommended
              </div>
            )}
          </div>
        </section>

        {/* Description */}
        {item.description && (
          <section className="bento-card p-8 bg-white space-y-3 text-left shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                About
              </span>
              <h2 className="text-h2">The Dish Profile</h2>
            </div>
            <p className="text-body text-slate-600 leading-relaxed font-medium">
              {item.description}
            </p>
          </section>
        )}

        {/* Customization */}
        {item.modifierGroups.length > 0 && (
          <section className="space-y-6 text-left">
            <div className="flex items-center gap-2 px-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Personalize
              </span>
              <h2 className="text-h2">Customize Recipe</h2>
            </div>
            <div className="space-y-4">
              {item.modifierGroups.map((group) => (
                <div
                  key={group.id}
                  className="bento-card bg-white p-6 space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                        {group.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {group.isRequired
                          ? "Required"
                          : `Limit: ${group.maxSelections || "∞"}`}
                      </p>
                    </div>
                    {group.isRequired && (
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-900 group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type={
                              group.selectionType === "single"
                                ? "radio"
                                : "checkbox"
                            }
                            className="hidden"
                            checked={selectedModifiers[group.id]?.includes(
                              option.id,
                            )}
                            onChange={() =>
                              handleModifierChange(
                                group.id,
                                option.id,
                                group.selectionType,
                              )
                            }
                          />
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedModifiers[group.id]?.includes(option.id)
                                ? "bg-slate-900 border-slate-900"
                                : "bg-white border-slate-200"
                            }`}
                          >
                            {selectedModifiers[group.id]?.includes(
                              option.id,
                            ) && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="font-bold text-sm text-slate-900 group-hover:text-white transition-colors">
                            {option.name}
                          </span>
                        </div>
                        {option.priceAdjustment > 0 && (
                          <span className="text-xs font-black text-slate-400 group-hover:text-white/60">
                            +${option.priceAdjustment.toFixed(2)}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Special Request */}
        <section className="bento-card p-6 bg-white space-y-4 text-left shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Notes
            </span>
            <h2 className="text-h2">Chef Special Request</h2>
          </div>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Dietary requests or allergies..."
            className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:bg-white h-32 resize-none transition-all placeholder:text-slate-300"
          />
        </section>

        {/* Quantity */}
        <section className="bento-card p-6 bg-slate-900 text-white text-left shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                Servings
              </span>
              <p className="font-black text-lg">Portion Count</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-full">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-all"
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
                    strokeWidth={3}
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <div className="w-10 text-center text-xl font-black">
                {quantity}
              </div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg active:scale-95 transition-all"
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
                    strokeWidth={3}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="space-y-6 text-left">
          <div className="flex items-end justify-between px-2">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Feedback
              </span>
              <h2 className="text-h2">Guest Reviews</h2>
              {totalReviews > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-900 text-sm">★</span>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    {averageRating.toFixed(1)} ({totalReviews})
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setShowReviewForm(!showReviewForm);
                setReviewError("");
              }}
              className="px-5 py-3 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-slate-900 transition-all font-bold"
            >
              {showReviewForm ? "Discard" : "Add Review"}
            </button>
          </div>

          {showReviewForm && (
            <div className="bento-card bg-ivory-200 p-8 space-y-6 animate-fade-in shadow-sm">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">
                  Overall Rating
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${star <= reviewRating ? "bg-slate-900 text-white shadow-lg" : "bg-white border border-slate-200 text-slate-300"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">
                  Your Review
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full p-4 bg-white rounded-2xl border border-slate-100 text-sm h-32 resize-none placeholder:text-slate-200"
                />
              </div>
              {reviewError && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                  {reviewError}
                </p>
              )}
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="btn-primary w-full h-14"
              >
                {submittingReview ? "Submitting..." : "Post Review"}
              </button>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bento-card bg-white p-6 space-y-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                      {review.customerName?.[0] || "G"}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-none">
                        {review.customerName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-[8px] text-slate-900">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < review.rating ? "opacity-100" : "opacity-20"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
            {reviews.length === 0 && !showReviewForm && (
              <div className="bento-card bg-white/50 border-dashed border border-slate-200 p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                No reviews yet
              </div>
            )}
          </div>
        </section>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <section className="space-y-6 text-left">
            <div className="flex items-center gap-2 px-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Explore
              </span>
              <h2 className="text-h2">Similar Flavors</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-4">
              {relatedItems.map((relItem) => (
                <Link
                  key={relItem.id}
                  href={`/menu/${relItem.id}?token=${currentToken}`}
                  className="flex-shrink-0 w-40 group"
                >
                  <div className="bento-card bg-white p-3 space-y-3 group-hover:bg-slate-900 transition-colors shadow-sm">
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 relative">
                      {relItem.primaryPhotoUrl ? (
                        <Image
                          src={menuApi.getPhotoUrl(relItem.primaryPhotoUrl)}
                          alt={relItem.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-[10px] font-black text-slate-900 group-hover:text-white uppercase truncate tracking-widest">
                        {relItem.name}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 group-hover:text-white/60">
                        ${relItem.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 z-40">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="flex-1 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total
            </h4>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">
              ${calculateTotalPrice().toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!item.canOrder || addedToCart}
            className={`flex-[2] h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all active:scale-95 ${
              addedToCart
                ? "bg-emerald-500 text-white"
                : item.canOrder
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-400"
            }`}
          >
            {addedToCart
              ? "Added to Cart"
              : item.canOrder
                ? "Add to Order"
                : "Sold Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
