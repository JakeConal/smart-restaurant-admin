"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { useCart } from "@/lib/cart-context";
import { menuApi } from "@/lib/api";
import { Order, OrderStatus } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, tableId, tableNumber, authToken } = useApp();
  const { items, updateItemQuantity, removeItem, clearCart, getTotalPrice } =
    useCart();

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);

  const currentToken = searchParams.get("token") || token;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
    }
  }, [isAuthenticated, currentToken, router]);

  // Poll for order status updates
  useEffect(() => {
    if (!activeOrder) return;

    const pollInterval = setInterval(async () => {
      try {
        // const updatedOrder = await orderApi.getOrder(activeOrder.id, authToken || undefined);
        // setActiveOrder(updatedOrder);

        // Simulate order status progression for demo
        if (activeOrder.status === "received") {
          setTimeout(() => {
            setActiveOrder((prev) =>
              prev ? { ...prev, status: "preparing" } : null,
            );
          }, 10000);
        } else if (activeOrder.status === "preparing") {
          setTimeout(() => {
            setActiveOrder((prev) =>
              prev ? { ...prev, status: "ready" } : null,
            );
          }, 20000);
        }
      } catch (err) {
        console.error("Failed to fetch order status:", err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [activeOrder, authToken]);

  const handlePlaceOrder = async () => {
    if (!tableId || items.length === 0) return;

    setPlacingOrder(true);
    setError("");

    try {
      // TODO: Use actual API when backend is ready
      // const orderPayload = {
      //   tableId,
      //   items: items.map(item => ({
      //     menuItemId: item.menuItem.id,
      //     quantity: item.quantity,
      //     modifiers: item.modifiers.map(m => ({ optionId: m.optionId })),
      //     specialInstructions: item.specialInstructions,
      //   })),
      //   specialRequests: specialRequests || undefined,
      // };
      // const order = await orderApi.createOrder(authToken, orderPayload);

      // Simulate order creation for demo
      const simulatedOrder: Order = {
        id: `order-${Date.now()}`,
        tableId,
        tableNumber: tableNumber || "Unknown",
        status: "received",
        items: items.map((item) => ({
          id: item.id,
          menuItemId: item.menuItem.id,
          menuItemName: item.menuItem.name,
          quantity: item.quantity,
          unitPrice: item.menuItem.price,
          totalPrice: item.totalPrice,
          modifiers: item.modifiers,
          specialInstructions: item.specialInstructions,
        })),
        subtotal: getTotalPrice(),
        tax: getTotalPrice() * 0.1,
        total: getTotalPrice() * 1.1,
        specialRequests,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setActiveOrder(simulatedOrder);
      clearCart();
      setShowOrderConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleRequestBill = async () => {
    if (!activeOrder) return;

    setRequestingBill(true);
    try {
      // await orderApi.requestBill(activeOrder.id, authToken || undefined);
      alert("Bill requested! A staff member will bring your bill shortly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request bill");
    } finally {
      setRequestingBill(false);
    }
  };

  const getOrderStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case "received":
        return {
          label: "Order Received",
          color: "order-received",
          icon: "📝",
          progress: 33,
        };
      case "preparing":
        return {
          label: "Preparing",
          color: "order-preparing",
          icon: "👨‍🍳",
          progress: 66,
        };
      case "ready":
        return {
          label: "Ready",
          color: "order-ready",
          icon: "✅",
          progress: 100,
        };
      case "completed":
        return {
          label: "Completed",
          color: "bg-green-500",
          icon: "🎉",
          progress: 100,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "bg-red-500",
          icon: "❌",
          progress: 0,
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-500",
          icon: "❓",
          progress: 0,
        };
    }
  };

  if (!isAuthenticated) return null;

  // Order confirmation view
  if (showOrderConfirmation && activeOrder) {
    return (
      <div className="min-h-screen pb-24 safe-bottom">
        <div className="pt-8 px-6 text-center">
          <div className="text-6xl mb-4 fade-in">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-gray-600 mb-6">
            Your order has been received and is being prepared.
          </p>

          <button
            onClick={() => setShowOrderConfirmation(false)}
            className="px-6 py-3 bg-[#fa4a0c] text-white rounded-full font-semibold"
          >
            Track Order
          </button>
        </div>
        <BottomNav token={currentToken || ""} />
      </div>
    );
  }

  // Active order tracking view
  if (activeOrder) {
    const statusInfo = getOrderStatusInfo(activeOrder.status);

    return (
      <div className="min-h-screen pb-24 safe-bottom">
        {/* Header */}
        <div className="pt-8 px-6">
          <h1 className="text-2xl font-bold text-center mb-2">Order Status</h1>
          <p className="text-gray-500 text-center mb-6">
            Table {activeOrder.tableNumber}
          </p>
        </div>

        {/* Status progress */}
        <div className="px-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{statusInfo.icon}</span>
              <span
                className={`px-4 py-2 rounded-full text-white ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${statusInfo.color} transition-all duration-500`}
                style={{ width: `${statusInfo.progress}%` }}
              />
            </div>

            {/* Status steps */}
            <div className="flex justify-between mt-4 text-sm">
              <div
                className={`text-center ${activeOrder.status === "received" || activeOrder.status === "preparing" || activeOrder.status === "ready" ? "text-[#fa4a0c]" : "text-gray-400"}`}
              >
                <div className="mb-1">📝</div>
                <div>Received</div>
              </div>
              <div
                className={`text-center ${activeOrder.status === "preparing" || activeOrder.status === "ready" ? "text-[#fa4a0c]" : "text-gray-400"}`}
              >
                <div className="mb-1">👨‍🍳</div>
                <div>Preparing</div>
              </div>
              <div
                className={`text-center ${activeOrder.status === "ready" ? "text-[#fa4a0c]" : "text-gray-400"}`}
              >
                <div className="mb-1">✅</div>
                <div>Ready</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order details */}
        <div className="px-6">
          <h2 className="font-semibold mb-4">Order Details</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {activeOrder.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-3 border-b last:border-b-0"
              >
                <div>
                  <p className="font-medium">{item.menuItemName}</p>
                  <p className="text-gray-500 text-sm">x{item.quantity}</p>
                  {item.modifiers.length > 0 && (
                    <p className="text-gray-400 text-xs">
                      {item.modifiers.map((m) => m.optionName).join(", ")}
                    </p>
                  )}
                </div>
                <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
              </div>
            ))}

            <div className="pt-4 mt-4 border-t border-dashed">
              <div className="flex justify-between text-gray-500 mb-2">
                <span>Subtotal</span>
                <span>${activeOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 mb-2">
                <span>Tax (10%)</span>
                <span>${activeOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[#fa4a0c]">
                  ${activeOrder.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 mt-6 space-y-3">
          <Link
            href={`/menu?token=${currentToken}`}
            className="block w-full py-4 text-center bg-white border border-gray-200 rounded-full font-semibold hover:bg-gray-50 transition-colors"
          >
            Add More Items
          </Link>

          {activeOrder.status === "ready" && (
            <button
              onClick={handleRequestBill}
              disabled={requestingBill}
              className="w-full py-4 bg-[#fa4a0c] text-white rounded-full font-semibold hover:bg-[#e04009] transition-colors disabled:opacity-50"
            >
              {requestingBill ? "Requesting..." : "Request Bill"}
            </button>
          )}
        </div>

        <BottomNav token={currentToken || ""} />
      </div>
    );
  }

  // Empty cart view
  if (items.length === 0) {
    return (
      <div className="min-h-screen pb-24 safe-bottom flex flex-col">
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
          <h1 className="text-2xl font-bold text-center">Cart</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-center mb-6">
            Add some delicious items from the menu
          </p>
          <Link
            href={`/menu?token=${currentToken}`}
            className="px-8 py-3 bg-[#fa4a0c] text-white rounded-full font-semibold hover:bg-[#e04009] transition-colors"
          >
            Browse Menu
          </Link>
        </div>

        <BottomNav token={currentToken || ""} />
      </div>
    );
  }

  // Cart with items view
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-25 via-white to-orange-50 pb-24 safe-bottom">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-orange-100/50 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 flex items-center justify-center hover:bg-white transition-all"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold flex-1 text-center pr-10">
              Your Order
            </h1>
          </div>

          {tableNumber && (
            <p className="text-center text-gray-600 font-medium text-sm">
              🍽️ Table {tableNumber}
            </p>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Cart Items */}
      <div className="px-6 mt-6 space-y-3 mb-6">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex gap-4">
              {/* Item Image */}
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 relative">
                {item.menuItem.primaryPhotoUrl ? (
                  <Image
                    src={item.menuItem.primaryPhotoUrl}
                    alt={item.menuItem.name}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2">
                    {item.menuItem.name}
                  </h3>

                  {/* Modifiers */}
                  {item.modifiers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.modifiers.map((modifier) => (
                        <div
                          key={`${item.id}-${modifier.optionId}`}
                          className="flex items-center gap-2 text-xs text-gray-600"
                        >
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                          <span className="line-clamp-1">
                            {modifier.optionName}
                            {modifier.priceAdjustment > 0 && (
                              <span className="text-orange-600 font-medium ml-1">
                                +${modifier.priceAdjustment.toFixed(2)}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Special Instructions */}
                  {item.specialInstructions && (
                    <div className="mt-3 p-2.5 bg-blue-50/80 rounded-lg border border-blue-200/50">
                      <p className="text-xs font-medium text-blue-700 mb-1">
                        📌 Special Note:
                      </p>
                      <p className="text-xs text-blue-600 line-clamp-2">
                        {item.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Price and Quantity Controls */}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      ${item.menuItem.price.toFixed(2)} × {item.quantity}
                    </p>
                    <p className="text-lg font-bold text-orange-600">
                      ${item.totalPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateItemQuantity(
                          item.id,
                          Math.max(1, item.quantity - 1),
                        )
                      }
                      className="w-8 h-8 rounded-lg bg-white/70 backdrop-blur-sm border border-white/50 flex items-center justify-center hover:bg-white hover:scale-110 transition-all text-orange-600 font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateItemQuantity(item.id, item.quantity + 1)
                      }
                      className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white flex items-center justify-center hover:shadow-lg hover:scale-110 transition-all font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 hover:scale-110 transition-all ml-2"
                      title="Remove item"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary - Below Items */}
      <div className="px-6 mt-8 mb-8">
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg">
          {/* Summary Header */}
          <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <span>💳</span> Order Summary
          </h2>

          {/* Summary Items */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                Subtotal ({items.length} items)
              </span>
              <span className="font-semibold text-gray-900">
                ${getTotalPrice().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Tax (10%)</span>
              <span className="font-semibold text-gray-900">
                ${(getTotalPrice() * 0.1).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-orange-200/0 via-orange-300 to-orange-200/0 mb-4"></div>

          {/* Total */}
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-gray-900 text-lg">Total</span>
            <span className="text-3xl font-bold text-orange-600">
              ${(getTotalPrice() * 1.1).toFixed(2)}
            </span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || !tableId || items.length === 0}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {placingOrder ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Placing Order...
              </>
            ) : (
              <>
                <span>✓</span> Complete Order
              </>
            )}
          </button>
        </div>
      </div>

      <BottomNav token={currentToken || ""} />
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
