"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { Order } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import OrderTrackingPage from "./OrderTrackingPage";

function OrderTrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, tableId } = useApp();

  const currentToken = searchParams.get("token") || token;
  const orderId = searchParams.get("orderId");

  // Use initializer function to compute initial order state
  const [order, setOrder] = useState<Order | null>(() => {
    // If orderId is provided in URL, load that specific order
    if (orderId) {
      try {
        const savedOrderJson = sessionStorage.getItem(`order-${orderId}`);
        if (savedOrderJson) {
          return JSON.parse(savedOrderJson);
        }
      } catch (err) {
        console.error("Failed to parse saved order:", err);
      }
      return null;
    }

    // No orderId in URL - search for any active unpaid order
    try {
      // Search through sessionStorage for any unpaid order
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("order-")) {
          const orderJson = sessionStorage.getItem(key);
          if (orderJson) {
            const parsedOrder = JSON.parse(orderJson) as Order;
            if (!parsedOrder.isPaid) {
              return parsedOrder; // Return first unpaid order
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to search for active orders:", err);
    }

    return null;
  });

  // Redirect to include orderId in URL if we found an order without orderId
  useEffect(() => {
    if (order && !orderId) {
      router.replace(
        `/order-tracking?token=${currentToken}&orderId=${order.id}`,
      );
    }
  }, [order, orderId, currentToken, router]);

  // Reload order from sessionStorage when orderId changes
  useEffect(() => {
    if (!orderId) return;

    const loadOrder = () => {
      try {
        const savedOrderJson = sessionStorage.getItem(`order-${orderId}`);
        console.log(
          `Attempting to load order-${orderId}:`,
          savedOrderJson ? "Found" : "Not found",
        );
        if (savedOrderJson) {
          const parsedOrder = JSON.parse(savedOrderJson);
          console.log("Loaded order:", parsedOrder);
          setOrder(parsedOrder);
        }
      } catch (err) {
        console.error("Failed to reload order:", err);
      }
    };

    // Load immediately
    loadOrder();

    // Also poll for updates every 2 seconds
    const interval = setInterval(loadOrder, 2000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
    }
  }, [isAuthenticated, currentToken, router]);

  const handleAddMoreItems = () => {
    router.push(`/menu?token=${currentToken}&orderId=${orderId}`);
  };

  const handleRequestBill = () => {
    // Could integrate with real API here
    console.log("Bill requested for order:", orderId);
  };

  const handleContinuePayment = () => {
    // Redirect to payment page
    router.push(`/payment?token=${currentToken}&orderId=${orderId}`);
  };

  if (!isAuthenticated) return null;

  if (!order) {
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
          <h1 className="text-2xl font-bold text-center">Orders</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold mb-2">No active orders</h2>
          <p className="text-gray-500 text-center mb-6">
            Start placing an order from the menu
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

  return (
    <OrderTrackingPage
      order={order}
      onAddMoreItems={handleAddMoreItems}
      onRequestBill={handleRequestBill}
      onContinue={handleContinuePayment}
      tableId={tableId || undefined}
      currentToken={currentToken || ""}
    />
  );
}

export default function OrderTrackingPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
