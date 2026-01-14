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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [billRequested, setBillRequested] = useState(false);

  // Calculate total from orders
  const baseTotal = orders.reduce((sum, order) => sum + order.total, 0);

  // Auto apply 10% discount if total > 100
  const isAutoDiscount = baseTotal > 100;
  const discountAmount = isAutoDiscount ? (baseTotal * 10) / 100 : 0;
  const finalTotal = Math.max(0, baseTotal - discountAmount);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
      return;
    }

    // Load unpaid orders from sessionStorage
    try {
      const unpaidOrders: Order[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("order-")) {
          const orderJson = sessionStorage.getItem(key);
          if (orderJson) {
            const parsedOrder = JSON.parse(orderJson) as Order;
            if (!parsedOrder.isPaid) {
              unpaidOrders.push(parsedOrder);
            }
          }
        }
      }

      if (unpaidOrders.length > 0) {
        setOrders(unpaidOrders);
        console.log("Payment page loaded orders:", unpaidOrders);
        // Check if any order already has billRequestedAt
        if (unpaidOrders.some((o) => o.billRequestedAt)) {
          setBillRequested(true);
        }
      } else {
        console.warn("No unpaid orders found in sessionStorage");
        setError("No orders to pay for");
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Failed to load orders");
    }
    setLoading(false);
  }, [isAuthenticated, currentToken, router]);

  const handleRequestBill = async () => {
    if (!orders || orders.length === 0) return;

    setProcessing(true);
    try {
      await Promise.all(
        orders.map((order) => {
          const orderId = order.orderId || String(order.id);
          return orderApi.requestBill(orderId);
        }),
      );
      setBillRequested(true);

      // Update local storage
      orders.forEach((order) => {
        const key = order.orderId
          ? `order-${order.orderId}`
          : `order-${order.id}`;
        const updated = { ...order, billRequestedAt: new Date().toISOString() };
        sessionStorage.setItem(key, JSON.stringify(updated));
      });

      console.log("Bill requested for all orders");
    } catch (err) {
      console.error("Failed to request bill:", err);
      setError("Failed to request bill");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!orders || orders.length === 0) return;

    setProcessing(true);
    setError("");
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mark all orders as paid
      try {
        await Promise.all(
          orders.map((order) => {
            const orderId = order.orderId || String(order.id);

            // Calculate per-order discount if total > 100
            const perOrderDiscountAmount = isAutoDiscount
              ? order.total * 0.1
              : 0;
            const perOrderFinalTotal = order.total - perOrderDiscountAmount;

            const perOrderPaymentData = {
              paymentMethod,
              discountPercentage: isAutoDiscount ? 10 : 0,
              discountAmount: perOrderDiscountAmount,
              finalTotal: perOrderFinalTotal,
            };

            // Update session storage
            const orderKey = order.orderId
              ? `order-${order.orderId}`
              : `order-${order.id}`;
            const updatedOrder = {
              ...order,
              isPaid: true,
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...perOrderPaymentData,
            };
            sessionStorage.setItem(orderKey, JSON.stringify(updatedOrder));

            return orderApi.markAsPaid(orderId, perOrderPaymentData);
          }),
        );
        console.log("All orders marked as paid in database");
      } catch (dbErr) {
        console.warn(
          "Failed to save orders to database, but payment processed locally:",
          dbErr,
        );
      }

      // Redirect back to order tracking
      router.push(`/order-tracking?token=${currentToken}`);
    } catch (err) {
      setError("Payment failed. Please try again.");
      console.error("Payment failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated || loading) return null;

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{error || "No orders to pay for"}</p>
          <Link
            href={`/order-tracking?token=${currentToken}`}
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
            onClick={() => router.push(`/order-tracking?token=${currentToken}`)}
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
            Order Summary ({orders.length}{" "}
            {orders.length === 1 ? "order" : "orders"})
          </h2>

          <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
            {orders.map((order) =>
              order.items.map((item) => (
                <div
                  key={`${order.id}-${item.id}`}
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
              )),
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${baseTotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount (10% Off):</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Final Total:</span>
              <span className="text-orange-600">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bill Request Section */}
        {!billRequested ? (
          <div className="mb-6 p-6 bg-orange-50 rounded-3xl border border-orange-200 shadow-sm text-center">
            <p className="text-sm font-semibold text-orange-800 mb-3">
              Need a physical bill ?
            </p>
            <button
              onClick={handleRequestBill}
              disabled={processing}
              className="w-full py-3 bg-white border-2 border-orange-500 text-orange-600 rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
            >
              {processing ? "Processing..." : "Request Bill"}
            </button>
          </div>
        ) : (
          <div className="mb-6 p-6 bg-green-50 rounded-3xl border border-green-200 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">✅</span>
              <p className="font-bold text-green-800">Bill Requested</p>
            </div>
            <p className="text-xs text-green-700">
              Our staff is coming with your bill. You can still complete payment
              online below.
            </p>
          </div>
        )}

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
            : `Complete Payment - $${finalTotal.toFixed(2)}`}
        </button>

        {/* Back Button */}
        <button
          onClick={() => router.push(`/order-tracking?token=${currentToken}`)}
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
