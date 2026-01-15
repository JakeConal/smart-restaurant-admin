"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Order, OrderStatus } from "@/lib/types";
import { getOrderWebSocketClient } from "@/lib/orderWebSocket";
import BottomNav from "@/components/BottomNav";

interface OrderTrackingPageProps {
  orders: Order[];
  onAddMoreItems: () => void;
  onContinue?: (unpaidOrders: Order[], totalAmount: number) => void;
  tableId?: string;
  currentToken?: string;
  restaurantId?: string;
}

export default function OrderTrackingPage({
  orders,
  onAddMoreItems,
  onContinue,
  currentToken,
  restaurantId,
}: OrderTrackingPageProps) {
  const [displayOrders, setDisplayOrders] = useState(orders);
  const [wsConnected, setWsConnected] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; message: string; type: "info" | "error" | "success" }[]
  >([]);
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());

  const addNotification = (
    message: string,
    type: "info" | "error" | "success" = "info",
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 8 seconds for errors, 5 for others
    setTimeout(
      () => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      },
      type === "error" ? 8000 : 5000,
    );
  };

  // Check if all orders are ready or served
  const allOrdersReady =
    displayOrders.length > 0 &&
    displayOrders.every((order) =>
      ["ready", "served", "completed"].includes(order.status),
    );

  // Get unpaid orders for bill/payment
  const unpaidOrders = displayOrders.filter((order) => !order.isPaid);
  const totalAmount = unpaidOrders.reduce((sum, order) => sum + order.total, 0);

  // Handle continue to payment for all unpaid orders
  const handleContinuePayment = () => {
    // Call onContinue with unpaid orders and total amount
    if (onContinue) {
      onContinue(unpaidOrders, totalAmount);
    }
  };

  // Debug: Log orders on mount to check orderId field
  useEffect(() => {
    console.log(
      "[OrderTracking] Orders loaded:",
      orders.map((o) => ({
        id: o.id,
        orderId: o.orderId,
        status: o.status,
      })),
    );
  }, []);

  // Update sessionStorage whenever displayOrders changes
  useEffect(() => {
    displayOrders.forEach((order) => {
      // Use orderId for storage key if available, otherwise use id
      const storageKey = order.orderId
        ? `order-${order.orderId}`
        : `order-${order.id}`;
      sessionStorage.setItem(storageKey, JSON.stringify(order));
    });
  }, [displayOrders]);

  // WebSocket setup for all orders - only run once on mount
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        const client = getOrderWebSocketClient();

        // Check if already connected, otherwise connect
        if (!client.isConnected()) {
          await client.connect(restaurantId);
        }

        setWsConnected(true);

        // Subscribe to updates for each order
        orders.forEach((order) => {
          // Use orderId for WebSocket subscription (backend uses orderId in room name)
          // If orderId not available, fallback to id
          const subscriptionId = order.orderId || String(order.id);

          // Skip if already subscribed
          if (unsubscribeRefs.current.has(subscriptionId)) {
            return;
          }

          const unsubscribe = client.subscribeToOrder(
            subscriptionId,
            (data) => {
              console.log(
                "[OrderTracking] Received WebSocket update for order",
                subscriptionId,
                ":",
                data,
              );

              setDisplayOrders((prev) =>
                prev.map((o) => {
                  // Match by orderId if available, otherwise by id
                  const orderSubId = o.orderId || String(o.id);
                  if (orderSubId !== subscriptionId) return o;

                  if (data.type === "order:accepted") {
                    addNotification(
                      `Order #${subscriptionId.slice(-6)} has been accepted!`,
                      "success",
                    );
                    return { ...o, status: "accepted" };
                  } else if (data.type === "order:rejected") {
                    addNotification(
                      `Order #${subscriptionId.slice(-6)} was rejected. Reason: ${data.reason || "Staff unavailable"}. Order will be removed in 5s.`,
                      "error",
                    );

                    // Auto-remove rejected order after 5 seconds
                    setTimeout(() => {
                      setDisplayOrders((prev) =>
                        prev.filter((item) => {
                          const itemId = item.orderId || String(item.id);
                          return itemId !== subscriptionId;
                        }),
                      );
                      // Also clear from sessionStorage
                      sessionStorage.removeItem(`order-${subscriptionId}`);
                      console.log(
                        `[OrderTracking] Auto-removed rejected order: ${subscriptionId}`,
                      );
                    }, 5000);

                    return {
                      ...o,
                      status: "rejected",
                      rejectionReason: data.reason,
                    };
                  } else if (data.type === "order:progress") {
                    if (data.newStatus === "ready") {
                      addNotification(
                        `Order #${subscriptionId.slice(-6)} is ready!`,
                        "success",
                      );
                    } else if (data.newStatus === "served") {
                      addNotification(
                        `Order #${subscriptionId.slice(-6)} has been served. Enjoy!`,
                        "success",
                      );
                    }
                    return { ...o, status: data.newStatus };
                  } else if (data.type === "order:updated" && data.order) {
                    return data.order;
                  }
                  return o;
                }),
              );
            },
          );

          unsubscribeRefs.current.set(subscriptionId, unsubscribe);
        });
      } catch (error) {
        console.error("[OrderTracking] Failed to setup WebSocket:", error);
        setWsConnected(false);
      }
    };

    if (orders.length > 0) {
      setupWebSocket();
    }

    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => {
        unsubscribe();
      });
      unsubscribeRefs.current.clear();
    };
  }, []); // Empty dependency - only run once on mount

  const getStatusInfo = (status: OrderStatus) => {
    const configs: Record<
      string,
      {
        label: string;
        description: string;
        color: string;
        progress: number;
        icon: string;
      }
    > = {
      pending_acceptance: {
        label: "Awaiting Waiter",
        description: "Staff will accept your order soon",
        color: "bg-amber-500",
        progress: 10,
        icon: "⏳",
      },
      accepted: {
        label: "Order Accepted",
        description: "Kitchen is about to start",
        color: "bg-blue-500",
        progress: 25,
        icon: "✓",
      },
      received: {
        label: "Received",
        description: "Sent to the kitchen team",
        color: "bg-blue-600",
        progress: 40,
        icon: "📝",
      },
      preparing: {
        label: "Cooking",
        description: "Chef is working on your flavors",
        color: "bg-orange-500",
        progress: 65,
        icon: "👨‍🍳",
      },
      ready: {
        label: "Ready to Serve",
        description: "Fresh and coming to your table",
        color: "bg-emerald-500",
        progress: 90,
        icon: "✨",
      },
      served: {
        label: "Served",
        description: "Enjoy your meal!",
        color: "bg-slate-900",
        progress: 100,
        icon: "🎉",
      },
      completed: {
        label: "Served",
        description: "Enjoy your meal!",
        color: "bg-slate-900",
        progress: 100,
        icon: "🎉",
      },
      rejected: {
        label: "Cancelled",
        description: "Something went wrong. Please ask staff.",
        color: "bg-red-500",
        progress: 0,
        icon: "✕",
      },
    };

    return configs[status] || configs.pending_acceptance;
  };

  return (
    <div className="min-h-screen bg-ivory-100 pb-[240px]">
      {/* Notifications Toast */}
      <div className="fixed top-24 left-0 right-0 z-[100] pointer-events-none px-6 space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`w-full max-w-sm mx-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-slide-in-up pointer-events-auto flex items-center gap-4 ${
              n.type === "error"
                ? "bg-red-500/90 border-red-400 text-white"
                : n.type === "success"
                  ? "bg-emerald-500/90 border-emerald-400 text-white"
                  : "bg-white/90 border-slate-200 text-slate-900"
            }`}
          >
            <div className="text-xl">
              {n.type === "error" ? "❌" : n.type === "success" ? "✅" : "ℹ️"}
            </div>
            <p className="text-sm font-bold flex-1">{n.message}</p>
            <button
              onClick={() =>
                setNotifications((prev) =>
                  prev.filter((notif) => notif.id !== n.id),
                )
              }
              className="opacity-50 hover:opacity-100 transition-opacity"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Dynamic Header */}
      <div className="sticky top-0 z-30 bg-ivory-100/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-h2">Timeline</h1>
            {wsConnected && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Live Updates
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/menu?token=${currentToken}`}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:border-slate-900 transition-all active:scale-95"
          >
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Link>
        </div>
      </div>

      <main className="px-6 pt-8 space-y-12">
        {/* Active Orders List */}
        <div className="space-y-12">
          {displayOrders.map((displayOrder) => {
            const statusInfo = getStatusInfo(displayOrder.status);

            return (
              <section key={displayOrder.id} className="space-y-6">
                {/* Order Meta */}
                <div className="flex items-end justify-between px-1">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Order Ref
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      #{String(displayOrder.id).slice(-6).toUpperCase()}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Station
                    </span>
                    <p className="font-bold text-slate-900">
                      Table {displayOrder.tableNumber}
                    </p>
                  </div>
                </div>

                {/* Status Bento Card */}
                <div className="bento-card bg-white p-8 space-y-8 relative overflow-hidden">
                  {/* Background Icon Watermark */}
                  <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] select-none pointer-events-none">
                    {statusInfo.icon}
                  </div>

                  <div className="flex items-center gap-6">
                    <div
                      className={`w-16 h-16 rounded-[24px] ${statusInfo.color} text-white flex items-center justify-center text-2xl shadow-lg border border-white/20`}
                    >
                      {statusInfo.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-slate-900 leading-none">
                        {statusInfo.label}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium">
                        {statusInfo.description}
                      </p>
                      {displayOrder.status === "rejected" &&
                        displayOrder.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-3 animate-pulse">
                            <span className="text-base">⚠️</span>
                            <div>
                              <p className="uppercase tracking-widest text-[9px] opacity-70 mb-0.5">
                                Rejection Reason
                              </p>
                              <p className="text-sm">
                                {displayOrder.rejectionReason}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Progress Visual */}
                  <div className="space-y-3">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                      <div
                        className={`h-full ${statusInfo.color} rounded-full transition-all duration-1000 ease-in-out relative`}
                        style={{ width: `${statusInfo.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Sent</span>
                      <span>Ready</span>
                    </div>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    Items in this Batch
                  </span>
                  <div className="grid grid-cols-1 gap-3">
                    {displayOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="bento-card bg-white/50 border-dashed p-4 flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-sm font-black text-slate-900 group-hover:scale-110 transition-transform">
                            {item.quantity}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {item.menuItemName}
                            </p>
                            {item.modifiers.length > 0 && (
                              <p className="text-[10px] text-slate-400 font-medium">
                                {item.modifiers
                                  .map((m) => m.optionName)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-400">
                          ${item.totalPrice?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Milestone */}
                {displayOrder.isPaid && (
                  <div className="bento-card bg-emerald-500 p-6 text-white flex items-center gap-4 shadow-emerald-200">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-white/80">
                        Milestone
                      </h5>
                      <p className="text-sm font-bold">Transaction Secured</p>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Global Summary & Checkout Prompt */}
        <section className="space-y-6 pb-12">
          <div className="bento-card bg-slate-900 p-8 text-white space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />

            <div className="flex justify-between items-start">
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">
                  Account Summary
                </h5>
                <p className="text-2xl font-black">${totalAmount.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-[18px] bg-white/10 flex items-center justify-center border border-white/10">
                <svg
                  className="w-6 h-6 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {allOrdersReady && unpaidOrders.length > 0 ? (
              <button
                onClick={handleContinuePayment}
                className="w-full h-16 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Settle Bill Now
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
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Pay after meal service enabled
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav token={currentToken || ""} />
    </div>
  );
}
