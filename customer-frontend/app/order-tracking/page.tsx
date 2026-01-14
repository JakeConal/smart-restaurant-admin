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
  const { token, isAuthenticated, tableId, restaurantId } = useApp();

  const currentToken = searchParams.get("token") || token;

  // Load all unpaid orders from sessionStorage
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const unpaidOrders: Order[] = [];
      // Search through sessionStorage for all unpaid orders
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
      return unpaidOrders;
    } catch (err) {
      console.error("Failed to search for active orders:", err);
    }
    return [];
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
    }
  }, [isAuthenticated, currentToken, router]);

  const [paymentOrders, setPaymentOrders] = useState<Order[]>([]);
  const [paymentTotal, setPaymentTotal] = useState(0);

  const handleAddMoreItems = () => {
    router.push(`/menu?token=${currentToken}`);
  };

  const handleContinuePayment = (
    unpaidOrders: Order[],
    totalAmount: number,
  ) => {
    // Save payment data
    setPaymentOrders(unpaidOrders);
    setPaymentTotal(totalAmount);
    // Redirect to payment page
    router.push(`/payment?token=${currentToken}`);
  };

  if (!isAuthenticated) return null;

  if (!orders || orders.length === 0) {
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
      orders={orders}
      onAddMoreItems={handleAddMoreItems}
      onContinue={handleContinuePayment}
      tableId={tableId || undefined}
      currentToken={currentToken || ""}
      restaurantId={restaurantId || undefined}
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
