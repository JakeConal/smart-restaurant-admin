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
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen bg-ivory-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="w-32 h-32 bg-white rounded-[48px] flex items-center justify-center mx-auto shadow-sm border border-slate-100">
            <div className="text-5xl">📦</div>
          </div>

          <div className="space-y-4">
            <h1 className="text-h1">No Active Orders</h1>
            <p className="text-body text-slate-500">
              Your kitchen is quiet. Time to add <br />some flavors to your table?
            </p>
          </div>

          <Link
            href={`/menu?token=${currentToken}`}
            className="btn-primary block w-full shadow-slate-200"
          >
            Explore Menu
          </Link>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            Smart Restaurant Experience
          </p>
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}
