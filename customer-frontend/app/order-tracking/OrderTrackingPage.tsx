"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Order, OrderStatus } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

interface OrderTrackingPageProps {
  order: Order;
  onAddMoreItems: () => void;
  onRequestBill: () => void;
  onContinue?: () => void;
  tableId?: string;
  currentToken?: string;
}

export default function OrderTrackingPage({
  order,
  onAddMoreItems,
  onRequestBill,
  onContinue,
  currentToken,
}: OrderTrackingPageProps) {
  const [displayOrder, setDisplayOrder] = useState(order);
  const [requestingBill, setRequestingBill] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

  // Update sessionStorage whenever displayOrder changes
  useEffect(() => {
    sessionStorage.setItem(`order-${order.id}`, JSON.stringify(displayOrder));
  }, [displayOrder, order.id]);

  // Check if order is paid and redirect
  useEffect(() => {
    if (displayOrder.isPaid) {
      // Order is paid, we can optionally keep showing it or redirect after a delay
      // For now, we'll keep showing it with paid status
      console.log("Order is paid:", displayOrder.id);
    }
  }, [displayOrder.isPaid, displayOrder.id]);

  useEffect(() => {
    // Simulate status progression
    const statusProgression: OrderStatus[] = ["received", "preparing", "ready"];
    const currentIndex = statusProgression.indexOf(order.status);

    if (currentIndex < statusProgression.length - 1) {
      const timers = statusProgression
        .slice(currentIndex + 1)
        .map((status, i) => {
          return setTimeout(
            () => {
              setDisplayOrder((prev) => ({ ...prev, status }));
            },
            (i + 1) * 15000, // Each status takes 15 seconds
          );
        });

      return () => timers.forEach((t) => clearTimeout(t));
    }
  }, [order.status]);

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case "pending_acceptance":
        return {
          label: "Waiting for Waiter",
          description: "Your order is being reviewed by our waiter",
          icon: "⏳",
          color: "from-blue-400 to-blue-500",
          progress: 10,
        };
      case "accepted":
        return {
          label: "Order Accepted",
          description: "Your waiter has accepted your order",
          icon: "✓",
          color: "from-green-400 to-green-500",
          progress: 25,
        };
      case "rejected":
        return {
          label: "Order Rejected",
          description: "Unfortunately, this order cannot be fulfilled. Please contact staff for assistance.",
          icon: "✕",
          color: "from-red-400 to-red-500",
          progress: 0,
        };
      case "received":
        return {
          label: "Order Received",
          description: "Your order has been received by the kitchen",
          icon: "📝",
          color: "from-blue-400 to-blue-500",
          progress: 33,
        };
      case "preparing":
        return {
          label: "Preparing",
          description: "Your order is being prepared",
          icon: "👨‍🍳",
          color: "from-yellow-400 to-yellow-500",
          progress: 66,
        };
      case "ready":
        return {
          label: "Ready to Serve",
          description: "Your order is ready! A server will bring it soon",
          icon: "✅",
          color: "from-green-400 to-green-500",
          progress: 100,
        };
      case "completed":
        return {
          label: "Order Completed",
          description: "Thank you for your order",
          icon: "🎉",
          color: "from-purple-400 to-purple-500",
          progress: 100,
        };
      default:
        return {
          label: "Unknown",
          description: "Unknown status",
          icon: "❓",
          color: "from-gray-400 to-gray-500",
          progress: 0,
        };
    }
  };

  const statusInfo = getStatusInfo(displayOrder.status);

  const handleRequestBill = async () => {
    setRequestingBill(true);
    try {
      // Simulate bill request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setBillRequested(true);
      onRequestBill();
    } finally {
      setRequestingBill(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-25 via-white to-orange-50 pb-24 safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-orange-100/50 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
          <Link
            href={`/menu?token=${currentToken}`}
            className="text-orange-600 hover:text-orange-700 font-semibold text-sm"
          >
            Back to Menu
          </Link>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Order ID and Table */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Order ID
            </p>
            <p className="text-lg font-bold text-gray-900">
              #{displayOrder.id.slice(-6).toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Table
            </p>
            <p className="text-lg font-bold text-orange-600">
              {displayOrder.tableNumber}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-8 p-6 bg-white rounded-3xl border border-orange-100/50 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Order Details
          </h3>

          {/* Items List with Individual Progress */}
          <div className="space-y-4 mb-4">
            {displayOrder.items.map((item) => {
              // Calculate progress for each item based on order status
              const getItemProgress = () => {
                switch (displayOrder.status) {
                  case "received":
                    return 33;
                  case "preparing":
                    return 66;
                  case "ready":
                  case "completed":
                    return 100;
                  default:
                    return 0;
                }
              };

              const itemProgress = getItemProgress();

              return (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  {/* Item Info */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {item.menuItemName}
                      </p>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.modifiers.map((m) => m.optionName).join(", ")}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {item.specialInstructions}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">
                        × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900">
                      ${item.totalPrice?.toFixed(2) || "0.00"}
                    </span>
                  </div>

                  {/* Individual Item Progress Bar */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-1.5 flex-1 bg-gray-300 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${statusInfo.color} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${itemProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-8 text-right">
                        {itemProgress}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {displayOrder.status === "received"
                        ? "Order Received"
                        : displayOrder.status === "preparing"
                          ? "Preparing"
                          : "Ready"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price Summary */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>${displayOrder.subtotal?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (10%):</span>
              <span>${displayOrder.tax?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span className="text-orange-600">
                ${displayOrder.total?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {!displayOrder.isPaid && (
            <button
              onClick={onAddMoreItems}
              className="py-3 bg-white border-2 border-orange-500 text-orange-600 font-semibold rounded-2xl hover:bg-orange-50 transition-all"
            >
              + Add Items
            </button>
          )}
          <button
            onClick={handleRequestBill}
            disabled={requestingBill || billRequested || displayOrder.isPaid}
            className={`py-3 font-semibold rounded-2xl transition-all ${
              displayOrder.isPaid
                ? "bg-gray-100 text-gray-600"
                : billRequested
                  ? "bg-green-100 text-green-700"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg"
            } disabled:opacity-50`}
          >
            {displayOrder.isPaid
              ? "✓ Paid"
              : billRequested
                ? "✓ Bill Requested"
                : "Request Bill"}
          </button>
        </div>

        {/* Bill Requested Message */}
        {billRequested && !displayOrder.isPaid && (
          <div className="p-4 bg-green-50 rounded-2xl border border-green-200 mb-4">
            <p className="text-sm text-green-800">
              ✓ Bill request sent! A server will bring your bill shortly.
            </p>
          </div>
        )}

        {/* Paid Message */}
        {displayOrder.isPaid && (
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 mb-4">
            <p className="text-sm text-blue-800">
              ✓ Payment completed! Thank you for your order.
            </p>
          </div>
        )}

        {/* Continue to Payment (if order is ready and not paid) */}
        {displayOrder.status === "ready" &&
          !displayOrder.isPaid &&
          onContinue && (
            <button
              onClick={onContinue}
              className="w-full py-3 mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-all"
            >
              Proceed to Payment
            </button>
          )}
      </div>

      <BottomNav token={currentToken || ""} />
    </div>
  );
}
