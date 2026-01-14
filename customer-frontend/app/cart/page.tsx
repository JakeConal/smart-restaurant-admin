"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { useCart } from "@/lib/cart-context";
import { orderApi } from "@/lib/api";
import { Order } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import OrderInfoModal from "../../components/OrderInfoModal";

function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, tableId, tableNumber, authToken, customer } =
    useApp();
  const { items, updateItemQuantity, removeItem, clearCart, getTotalPrice } =
    useCart();

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const currentToken = searchParams.get("token") || token;
  const orderId = searchParams.get("orderId");

  // Load active order from sessionStorage on mount
  useEffect(() => {
    setMounted(true);
    // Try to load order from orderId in URL first
    if (orderId) {
      try {
        const savedOrderJson = sessionStorage.getItem(`order-${orderId}`);
        if (savedOrderJson) {
          const order = JSON.parse(savedOrderJson) as Order;
          if (!order.isPaid) {
            setActiveOrder(order);
          }
        }
      } catch (err) {
        console.error("Failed to load order:", err);
      }
      return;
    }

    // No orderId in URL - search for any unpaid order
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("order-")) {
          const orderJson = sessionStorage.getItem(key);
          if (orderJson) {
            const order = JSON.parse(orderJson) as Order;
            if (!order.isPaid) {
              setActiveOrder(order);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to search for active orders:", err);
    }
  }, [orderId]);

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

  const handleOpenOrderModal = () => {
    if (!tableId || items.length === 0) {
      setError("Please add items before placing an order");
      return;
    }
    setShowOrderModal(true);
  };

  const handleConfirmOrder = async (
    guestName: string,
    specialInstructions: string,
  ) => {
    if (!tableId || items.length === 0) return;

    setPlacingOrder(true);
    setError("");

    try {
      // Always create a new order - don't add to existing orders
      // This ensures each order is independent and tracked separately

      // Create new order
      const simulatedOrder: Order = {
        id: `order-${Date.now()}`,
        tableId,
        tableNumber: tableNumber || "Unknown",
        status: "pending_acceptance",
        items: items.map((item) => {
          // Ensure price values are valid (not 0 or undefined)
          const price = item.menuItem.price || 0;
          const adjustedTotalPrice =
            price > 0 ? item.totalPrice : item.totalPrice;

          return {
            id: item.id,
            menuItemId: item.menuItem.id,
            menuItemName: item.menuItem.name,
            quantity: item.quantity,
            unitPrice: price,
            totalPrice: adjustedTotalPrice,
            modifiers: item.modifiers.map((mod) => ({
              id: mod.optionId,
              modifierOptionId: mod.optionId,
              modifierOptionName: mod.optionName,
              price: mod.priceAdjustment,
            })) as any, // Backend expects this format for modifier storage
            specialInstructions: item.specialInstructions,
          };
        }) as any,
        subtotal: getTotalPrice(),
        tax: getTotalPrice() * 0.1,
        total: getTotalPrice() * 1.1,
        guestName,
        specialRequests: specialInstructions,
        isPaid: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save order to session storage
      sessionStorage.setItem(
        `order-${simulatedOrder.id}`,
        JSON.stringify(simulatedOrder),
      );

      console.log(`Creating new order ${simulatedOrder.id}:`, {
        items: simulatedOrder.items.length,
        total: simulatedOrder.total,
      });

      // Try to save to database
      try {
        // Build payload - only include table_id and customer_id if they're valid UUIDs
        const payload: any = {
          orderId: simulatedOrder.id,
          tableNumber: simulatedOrder.tableNumber,
          guestName: simulatedOrder.guestName,
          items: simulatedOrder.items,
          specialRequests: simulatedOrder.specialRequests,
          subtotal: simulatedOrder.subtotal,
          tax: simulatedOrder.tax,
          total: simulatedOrder.total,
          // Note: Do NOT send status - backend will set it to PENDING_ACCEPTANCE
          isPaid: false,
        };

        // Only add table_id if it exists (it's already a UUID string from context)
        if (tableId) {
          payload.table_id = tableId;
        }

        // Add customer_id if user is authenticated and has a customer ID (UUID string)
        if (customer && customer.id) {
          payload.customer_id = customer.id;
        }

        console.log("📤 Sending order payload:", payload);

        await orderApi.createOrder(payload);
        console.log(`Order ${simulatedOrder.id} saved to database`);
      } catch (dbErr) {
        console.error("Failed to save order to database - DETAILED ERROR:", {
          error: dbErr,
          errorMessage: dbErr instanceof Error ? dbErr.message : String(dbErr),
          orderId: simulatedOrder.id,
          table_id: tableId,
        });
      }

      setActiveOrder(simulatedOrder);
      clearCart();
      setShowOrderModal(false);

      // Redirect to order tracking page
      router.push(
        `/order-tracking?token=${currentToken}&orderId=${simulatedOrder.id}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Empty cart view
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="w-32 h-32 bg-white rounded-[48px] flex items-center justify-center mx-auto shadow-sm border border-slate-100">
            <div className="text-5xl">🥡</div>
          </div>

          <div className="space-y-4">
            <h1 className="text-h1">Hungry?</h1>
            <p className="text-body text-slate-500">
              Your cart is waiting to be filled with <br />something delicious.
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

  // Cart with items view
  return (
    <div className="min-h-screen bg-ivory-100 pb-[240px]">
      {/* Dynamic Header */}
      <div className="sticky top-0 z-30 bg-ivory-100/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:border-slate-900 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-h2">My Selection</h1>
          </div>

          {tableNumber && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-900/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Table {tableNumber}</span>
            </div>
          )}
        </div>
      </div>

      <main className="px-6 pt-8 space-y-6">
        {/* Error Feedback */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-3 animate-fade-in">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Categories Breakdown (Grouped items if needed, but for now simple list) */}
        <div className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Items</span>
            <button onClick={clearCart} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors">Clear All</button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bento-card p-4 group transition-all">
                <div className="flex gap-4">
                  {/* Item Image */}
                  <div className="w-24 h-24 rounded-[20px] overflow-hidden bg-slate-50 border border-slate-100 relative shadow-inner flex-shrink-0">
                    {item.menuItem.primaryPhotoUrl ? (
                      <Image
                        src={item.menuItem.primaryPhotoUrl}
                        alt={item.menuItem.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-slate-600 transition-colors">
                          {item.menuItem.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      {/* Modifiers Pill View */}
                      {item.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.modifiers.map((modifier) => (
                            <span
                              key={`${item.id}-${modifier.optionId}`}
                              className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-full border border-slate-200"
                            >
                              {modifier.optionName}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Special Note */}
                      {item.specialInstructions && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <svg className="w-3 h-3 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          <p className="text-[10px] text-slate-400 italic font-medium truncate">
                            {item.specialInstructions}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-black text-slate-900">${item.totalPrice.toFixed(2)}</span>

                      {/* Compact Quantity Controls */}
                      <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
                        <button
                          onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-sm active:scale-90"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-sm active:scale-90"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note: Order Summary and Security info integrated into the bottom action bar */}
      </main>

      <BottomNav
        token={currentToken || ""}
        action={{
          label: "Complete Order",
          count: items.reduce((acc, i) => acc + i.quantity, 0),
          amount: getTotalPrice() * 1.1,
          tax: getTotalPrice() * 0.1,
          onClick: handleOpenOrderModal,
          disabled: placingOrder || !tableId || items.length === 0,
          isLoading: placingOrder
        }}
      />

      {/* Order Information Modal */}
      <OrderInfoModal
        isOpen={showOrderModal}
        items={items}
        tableNumber={tableNumber || undefined}
        onClose={() => setShowOrderModal(false)}
        onConfirm={handleConfirmOrder}
        isLoading={placingOrder}
      />
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
