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
    <div className="min-h-screen pb-48 safe-bottom">
      {/* Header */}
      <div className="pt-8 px-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()}>
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
          <h1 className="text-2xl font-bold flex-1 text-center pr-6">Cart</h1>
        </div>

        {tableNumber && (
          <div className="text-center text-gray-500 mb-4">
            Table {tableNumber}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
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
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          <span>swipe on an item to delete</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Cart items */}
      <div className="px-6 mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 relative overflow-hidden group"
          >
            {/* Item image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {item.menuItem.primaryPhotoUrl ? (
                <Image
                  src={item.menuItem.primaryPhotoUrl}
                  alt={item.menuItem.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  🍽️
                </div>
              )}
            </div>

            {/* Item details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-1">
                {item.menuItem.name}
              </h3>
              <p className="text-[#fa4a0c] font-semibold mt-1">
                ${item.totalPrice.toFixed(2)}
              </p>
              {item.modifiers.length > 0 && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                  {item.modifiers.map((m) => m.optionName).join(", ")}
                </p>
              )}

              {/* Quantity controls */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 bg-[#fa4a0c] text-white rounded-full flex items-center justify-center text-sm"
                >
                  -
                </button>
                <span className="font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 bg-[#fa4a0c] text-white rounded-full flex items-center justify-center text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Delete button (visible on hover/swipe) */}
            <button
              onClick={() => removeItem(item.id)}
              className="absolute right-0 top-0 bottom-0 w-16 bg-red-500 text-white flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Special requests */}
      <div className="px-6 mt-6">
        <h2 className="font-semibold mb-2">Special Requests</h2>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Any allergies, dietary restrictions, or special requests for the kitchen?"
          className="w-full p-4 bg-white rounded-xl border-none resize-none h-24 shadow-sm"
        />
      </div>

      {/* Order summary */}
      <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-[#f2f2f2] via-[#f2f2f2] to-transparent pt-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
            <div className="flex justify-between text-gray-500 mb-2">
              <span>Subtotal</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 mb-2">
              <span>Tax (10%)</span>
              <span>${(getTotalPrice() * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-[#fa4a0c]">
                ${(getTotalPrice() * 1.1).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || !tableId}
            className="w-full h-14 bg-[#fa4a0c] text-white rounded-full font-semibold btn-press hover:bg-[#e04009] transition-colors disabled:opacity-50"
          >
            {placingOrder ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner"></div>
                Placing Order...
              </span>
            ) : (
              "Complete Order"
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
