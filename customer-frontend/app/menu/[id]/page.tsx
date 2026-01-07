"use client";

import { useState, useEffect, Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { useCart } from "@/lib/cart-context";
import { menuApi } from "@/lib/api";
import { MenuItem, MenuResponse, Review } from "@/lib/types";

function ItemDetailContent({ itemId }: { itemId: string }) {
  // NEW MODERN DESIGN
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated } = useApp();
  const { addItem } = useCart();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >({});
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);

  const currentToken = searchParams.get("token") || token;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
    }
  }, [isAuthenticated, currentToken, router]);

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

  // Fetch reviews (placeholder - would need backend implementation)
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // const reviewsData = await reviewApi.getItemReviews(itemId);
        // setReviews(reviewsData);
        // Placeholder reviews
        setReviews([
          {
            id: "1",
            customerId: "1",
            customerName: "John D.",
            menuItemId: itemId,
            orderId: "1",
            rating: 5,
            comment: "Absolutely delicious! Will order again.",
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            customerId: "2",
            customerName: "Sarah M.",
            menuItemId: itemId,
            orderId: "2",
            rating: 4,
            comment: "Great taste, portion could be bigger.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    };

    fetchReviews();
  }, [itemId]);

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
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <Link
          href={`/cart?token=${currentToken}`}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md"
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
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </Link>
      </div>

      {/* Image */}
      <div className="relative h-80 bg-gradient-to-b from-orange-50 to-[#f2f2f2]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 w-64 h-64 rounded-full overflow-hidden bg-white shadow-2xl">
          {item.primaryPhotoUrl ? (
            <Image
              src={item.primaryPhotoUrl}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">
              🍽️
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mt-24 px-6">
        {/* Status and chef recommended badges */}
        <div className="flex items-center gap-2 mb-2">
          {statusInfo && (
            <span
              className={`px-3 py-1 text-sm rounded-full ${statusInfo.class}`}
            >
              {statusInfo.text}
            </span>
          )}
          {item.isChefRecommended && (
            <span className="px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-full">
              👨‍🍳 Chef&apos;s Pick
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-2">{item.name}</h1>
        <p className="text-[#fa4a0c] text-xl font-bold mb-4">
          ${item.price.toFixed(2)}
        </p>

        {item.prepTimeMinutes > 0 && (
          <p className="text-gray-500 mb-4">
            ⏱️ Prep time: ~{item.prepTimeMinutes} minutes
          </p>
        )}

        {item.description && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-gray-600">{item.description}</p>
          </div>
        )}

        {/* Modifiers */}
        {item.modifierGroups.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-4">Customize Your Order</h2>
            {item.modifierGroups.map((group) => (
              <div key={group.id} className="mb-4 p-4 bg-white rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">{group.name}</span>
                  {group.isRequired && (
                    <span className="text-xs text-red-500">Required</span>
                  )}
                </div>
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type={
                            group.selectionType === "single"
                              ? "radio"
                              : "checkbox"
                          }
                          name={group.id}
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
                          className="w-5 h-5 accent-[#fa4a0c]"
                        />
                        <span>{option.name}</span>
                      </div>
                      {option.priceAdjustment > 0 && (
                        <span className="text-gray-500">
                          +${option.priceAdjustment.toFixed(2)}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Special instructions */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Special Instructions</h2>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any allergies or special requests?"
            className="w-full p-4 bg-white rounded-xl border-none resize-none h-24"
          />
        </div>

        {/* Quantity selector */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-semibold">Quantity</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
            >
              -
            </button>
            <span className="text-lg font-semibold w-8 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 bg-[#fa4a0c] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-[#e04009]"
            >
              +
            </button>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-4">Reviews ({reviews.length})</h2>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-white rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{review.customerName}</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < review.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related items */}
        {relatedItems.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-4">You might also like</h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {relatedItems.map((relatedItem) => (
                <Link
                  key={relatedItem.id}
                  href={`/menu/${relatedItem.id}?token=${currentToken}`}
                  className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-sm p-3 text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-100 mb-2">
                    {relatedItem.primaryPhotoUrl ? (
                      <Image
                        src={relatedItem.primaryPhotoUrl}
                        alt={relatedItem.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium line-clamp-1">
                    {relatedItem.name}
                  </p>
                  <p className="text-[#fa4a0c] text-sm font-bold">
                    ${relatedItem.price.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add to cart button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f2f2f2] via-[#f2f2f2] to-transparent pt-12">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleAddToCart}
            disabled={!item.canOrder || addedToCart}
            className={`w-full h-14 rounded-full font-semibold btn-press transition-all ${
              addedToCart
                ? "bg-green-500 text-white"
                : item.canOrder
                  ? "bg-[#fa4a0c] text-white hover:bg-[#e04009]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {addedToCart ? (
              <span className="flex items-center justify-center gap-2">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Added to Cart!
              </span>
            ) : item.canOrder ? (
              `Add to Cart - $${calculateTotalPrice().toFixed(2)}`
            ) : (
              "Currently Unavailable"
            )}
          </button>
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
