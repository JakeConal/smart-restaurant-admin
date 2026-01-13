"use client";

import React, { useState, useEffect, useRef } from "react";
import { ClipboardList, RefreshCw, WifiOff, Wifi } from "lucide-react";
import { DashboardLayout } from "../../../shared/components/layout";
import { OrderCard } from "../../../shared/components/waiter/OrderCard";
import { OrderDetailModal } from "../../../shared/components/waiter/OrderDetailModal";
import { RejectOrderModal } from "../../../shared/components/waiter/RejectOrderModal";
import { Button } from "../../../shared/components/ui/Button";
import { useToast } from "../../../shared/components/ui/Toast";
import { useOrderPolling } from "../../../shared/lib/hooks/useOrderPolling";
import {
  getMyPendingOrders,
  acceptOrder,
} from "../../../shared/lib/api/waiter";
import { initializeOfflineQueueProcessor } from "../../../shared/lib/offlineQueueProcessor";
import { getOrderWebSocketClient } from "../../../shared/lib/orderWebSocket";
import type { Order } from "../../../shared/types/order";

export default function WaiterOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());

  // Use polling hook for notifications
  const { count, isOnline, refetch } = useOrderPolling({
    enabled: true,
    onNewOrder: async () => {
      // Refresh orders when new order comes in
      await loadOrders();
      setIsLoading(false);
    },
  });

  const loadOrders = async () => {
    try {
      const data = await getMyPendingOrders();
      setOrders(data);

      // Subscribe to WebSocket updates for each order
      data.forEach((order) => {
        subscribeToOrder(order.orderId);
      });
    } catch (error) {
      console.error("Failed to load orders:", error);
      if (isLoading) {
        toast.error("Failed to load orders");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToOrder = async (orderId: string) => {
    try {
      const client = getOrderWebSocketClient();

      // Check if already connected, otherwise connect
      if (!client.isConnected()) {
        await client.connect();
        setWsConnected(true);
      }

      // Skip if already subscribed
      if (unsubscribesRef.current.has(orderId)) {
        return;
      }

      // Subscribe to order updates
      const unsubscribe = client.subscribeToOrder(orderId, (data) => {
        console.log("[WaiterOrders] Received WebSocket update:", data);

        if (data.type === "order:rejected") {
          // Order was rejected - remove from list
          console.log("[WaiterOrders] Order rejected, removing from list");
          setOrders((prev) => prev.filter((o) => o.orderId !== orderId));

          if (selectedOrder?.orderId === orderId) {
            setSelectedOrder(null);
          }
        } else if (data.type === "order:progress") {
          // Order status progressed - check if moved away from pending_acceptance
          console.log(
            "[WaiterOrders] Order status progressed:",
            data.newStatus,
          );
          if (data.newStatus === "received") {
            // Order was accepted and sent to kitchen - remove from waiter orders list
            console.log(
              "[WaiterOrders] Order accepted and sent to kitchen, removing from list",
            );
            setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
            if (selectedOrder?.orderId === orderId) {
              setSelectedOrder(null);
            }
          }
        } else if (data.type === "order:updated" && data.order) {
          // General order update
          console.log("[WaiterOrders] Order updated");
          setOrders((prev) =>
            prev.map((o) => (o.orderId === orderId ? data.order : o)),
          );
          if (selectedOrder?.orderId === orderId) {
            setSelectedOrder(data.order);
          }
        }
      });

      unsubscribesRef.current.set(orderId, unsubscribe);
    } catch (error) {
      console.error("[WaiterOrders] Failed to subscribe to order:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      unsubscribesRef.current.clear();
    };
  }, []);

  // Initialize offline queue processor
  useEffect(() => {
    const cleanup = initializeOfflineQueueProcessor();

    // Listen for processed queue events
    const handleQueueProcessed = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { results } = customEvent.detail;

      if (results.success > 0) {
        toast.success(
          `${results.success} queued rejection${results.success > 1 ? "s" : ""} processed successfully`,
        );
        // Refresh orders after processing queue
        loadOrders();
      }

      if (results.failed > 0) {
        toast.error(
          `Failed to process ${results.failed} queued rejection${results.failed > 1 ? "s" : ""}`,
        );
      }
    };

    // Listen for new orders from WebSocket
    const handleNewOrder = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { orderId } = customEvent.detail;
      console.log("[WaiterOrders] New order from WebSocket:", orderId);
      toast.info("New order received!");
      loadOrders();
    };

    window.addEventListener("offline-queue-processed", handleQueueProcessed);
    window.addEventListener("waiter:neworder", handleNewOrder);

    return () => {
      cleanup();
      window.removeEventListener(
        "offline-queue-processed",
        handleQueueProcessed,
      );
      window.removeEventListener("waiter:neworder", handleNewOrder);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadOrders();
    await refetch();
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleAccept = async (order: Order) => {
    if (acceptingOrderId) return; // Prevent multiple clicks

    setAcceptingOrderId(order.orderId);
    try {
      const updatedOrder = await acceptOrder(order.orderId, {
        version: order.version,
      });
      toast.success("Order accepted and sent to kitchen!");
      // Remove order from list immediately (optimistic update)
      setOrders(orders.filter((o) => o.orderId !== order.orderId));
      if (selectedOrder?.orderId === order.orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept order";
      toast.error(message);
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleReject = (orderId: string) => {
    const order = orders.find((o) => o.orderId === orderId);
    if (order) {
      setSelectedOrder(null);
      setRejectingOrderId(orderId);
    }
  };

  const handleRejectSuccess = () => {
    // Remove from list
    setOrders(orders.filter((o) => o.orderId !== rejectingOrderId));
    setRejectingOrderId(null);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 sm:p-3 rounded-xl">
              <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Pending Orders
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                {count} order{count !== 1 ? "s" : ""} waiting for review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Online status indicator */}
            <div
              className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>

            {/* Refresh button */}
            <Button
              onClick={handleRefresh}
              variant="secondary"
              disabled={isLoading}
              className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-slate-700 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 text-sm font-medium">
                Loading orders...
              </p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No pending orders
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              New orders will appear here automatically
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onClick={() => handleOrderClick(order)}
                onAccept={handleAccept}
                onReject={handleReject}
                isAccepting={acceptingOrderId === order.orderId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          isOnline={isOnline}
        />
      )}

      {rejectingOrderId && (
        <RejectOrderModal
          orderId={rejectingOrderId}
          tableNumber={
            orders.find((o) => o.orderId === rejectingOrderId)?.tableNumber || 0
          }
          isOpen={!!rejectingOrderId}
          onClose={() => setRejectingOrderId(null)}
          onSuccess={handleRejectSuccess}
          isOnline={isOnline}
        />
      )}
    </DashboardLayout>
  );
}
