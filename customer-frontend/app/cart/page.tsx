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

  const currentToken = searchParams.get("token") || token;
  const orderId = searchParams.get("orderId");

  // Load active order from sessionStorage on mount
  useEffect(() => {
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
      // Check if there's an active unpaid order
      const existingOrderId = orderId || activeOrder?.id;

      // Check if adding to existing order
      if (existingOrderId) {
        const existingOrderJson = sessionStorage.getItem(
          `order-${existingOrderId}`,
        );
        if (existingOrderJson) {
          const existingOrder = JSON.parse(existingOrderJson) as Order;

          // Only add if order is not paid
          if (!existingOrder.isPaid) {
            // Add new items to existing order
            const newOrderItems = items.map((item) => ({
              id: item.id,
              menuItemId: item.menuItem.id,
              menuItemName: item.menuItem.name,
              quantity: item.quantity,
              unitPrice: item.menuItem.price,
              totalPrice: item.totalPrice,
              modifiers: item.modifiers,
              specialInstructions: item.specialInstructions,
            }));

            // Calculate total price of new items from cart
            const cartTotal = getTotalPrice();

            // Recalculate totals
            const newSubtotal = existingOrder.subtotal + cartTotal;
            const newTax = newSubtotal * 0.1;
            const newTotal = newSubtotal + newTax;

            const updatedOrder: Order = {
              ...existingOrder,
              items: [...existingOrder.items, ...newOrderItems],
              subtotal: newSubtotal,
              tax: newTax,
              total: newTotal,
              updatedAt: new Date().toISOString(),
            };

            sessionStorage.setItem(
              `order-${existingOrderId}`,
              JSON.stringify(updatedOrder),
            );

            console.log(`Updating order ${existingOrderId}:`, {
              items: updatedOrder.items.length,
              subtotal: newSubtotal,
              total: newTotal,
            });

            // Try to update in database
            try {
              await orderApi.updateOrderByOrderId(existingOrderId, {
                items: updatedOrder.items,
                subtotal: newSubtotal,
                tax: newTax,
                total: newTotal,
                updatedAt: new Date().toISOString(),
              });
              console.log(
                `Order ${existingOrderId} updated successfully in database`,
              );
            } catch (dbErr) {
              console.warn("Failed to update order in database:", dbErr);
            }

            clearCart();
            setShowOrderModal(false);
            setActiveOrder(updatedOrder);

            router.push(
              `/order-tracking?token=${currentToken}&orderId=${existingOrderId}`,
            );
            return;
          }
        }
      }

      // Create new order
      const simulatedOrder: Order = {
        id: `order-${Date.now()}`,
        tableId,
        tableNumber: tableNumber || "Unknown",
        status: "received",
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
            modifiers: item.modifiers,
            specialInstructions: item.specialInstructions,
          };
        }),
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
          status: simulatedOrder.status,
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

  if (!isAuthenticated) return null;

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
        {items.map((item) => (
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
            onClick={handleOpenOrderModal}
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
