"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { orderApi } from "@/lib/api";
import { Order } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useApp();

  const currentToken = searchParams.get("token") || "";
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
      return;
    }

    // Load order from session storage
    try {
      console.log(`Payment page loading order-${orderId}`);
      const savedOrderJson = sessionStorage.getItem(`order-${orderId}`);
      if (savedOrderJson) {
        const parsedOrder = JSON.parse(savedOrderJson);
        console.log("Payment page loaded order:", parsedOrder);
        setOrder(parsedOrder);
      } else {
        console.warn(`Order order-${orderId} not found in sessionStorage`);
      }
    } catch (err) {
      console.error("Failed to load order:", err);
    }
    setLoading(false);
  }, [isAuthenticated, currentToken, orderId, router]);

  const handlePayment = async () => {
    if (!order || !orderId) return;

    setProcessing(true);
    setError("");
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mark order as paid
      const paidOrder: Order = {
        ...order,
        isPaid: true,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to session storage with correct key
      const orderKey = `order-${orderId}`;
      sessionStorage.setItem(orderKey, JSON.stringify(paidOrder));
      console.log("Order saved to sessionStorage:", orderKey, paidOrder);

      // Save to database
      try {
        await orderApi.markAsPaid(orderId);
        console.log("Order marked as paid in database");
      } catch (dbErr) {
        console.warn(
          "Failed to save order to database, but payment processed locally:",
          dbErr,
        );
      }

      // Redirect back to order tracking
      router.push(`/order-tracking?token=${currentToken}&orderId=${orderId}`);
    } catch (err) {
      setError("Payment failed. Please try again.");
      console.error("Payment failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated || loading) return null;

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
          <Link
            href={`/menu?token=${currentToken}`}
            className="text-orange-600 hover:text-orange-700 font-semibold mt-4 inline-block"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-25 via-white to-orange-50 pb-24 safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-orange-100/50 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
          <button
            onClick={() =>
              router.push(
                `/order-tracking?token=${currentToken}&orderId=${orderId}`,
              )
            }
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Order Summary */}
        <div className="mb-6 p-6 bg-white rounded-3xl border border-orange-100/50 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Order Summary
          </h2>

          <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start text-sm"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {item.menuItemName}
                  </p>
                  <p className="text-gray-500 text-xs">× {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  ${item.totalPrice.toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (10%):</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span className="text-orange-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6 p-6 bg-white rounded-3xl border border-orange-100/50 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Payment Method
          </h2>

          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 border-orange-300 rounded-2xl cursor-pointer bg-orange-50">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === "card"}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "card" | "cash")
                }
                className="w-4 h-4"
              />
              <span className="ml-3 font-semibold text-gray-900">
                💳 Card Payment
              </span>
            </label>

            <label className="flex items-center p-4 border-2 border-gray-200 rounded-2xl cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "card" | "cash")
                }
                className="w-4 h-4"
              />
              <span className="ml-3 font-semibold text-gray-900">
                💵 Cash Payment
              </span>
            </label>
          </div>
        </div>

        {/* Payment Info */}
        {paymentMethod === "card" && (
          <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-blue-800">
              💳 Demo mode: Click &quot;Complete Payment&quot; to simulate
              payment
            </p>
          </div>
        )}

        {paymentMethod === "cash" && (
          <div className="mb-6 p-4 bg-purple-50 rounded-2xl border border-purple-200">
            <p className="text-sm text-purple-800">
              💵 Cash payment: A staff member will collect payment at your table
            </p>
          </div>
        )}

        {/* Complete Payment Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
        >
          {processing
            ? "Processing..."
            : `Complete Payment - $${order.total.toFixed(2)}`}
        </button>

        {/* Back Button */}
        <button
          onClick={() =>
            router.push(
              `/order-tracking?token=${currentToken}&orderId=${orderId}`,
            )
          }
          className="w-full py-3 mt-3 bg-white border border-gray-200 text-gray-900 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      <BottomNav token={currentToken} />
    </div>
  );
}

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
