"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, RefreshCw, WifiOff, Wifi } from "lucide-react";
import { DashboardLayout } from "../../../shared/components/layout";
import { OrderCard } from "../../../shared/components/waiter/OrderCard";
import { OrderDetailModal } from "../../../shared/components/waiter/OrderDetailModal";
import { RejectOrderModal } from "../../../shared/components/waiter/RejectOrderModal";
import { BillModal } from "../../../shared/components/waiter/BillModal";
import { Button } from "../../../shared/components/ui/Button";
import { useToast } from "../../../shared/components/ui/Toast";
import { useAuth } from "../../../shared/components/auth/AuthContext";
import { useOrderPolling } from "../../../shared/lib/hooks/useOrderPolling";
import {
  getMyPendingOrders,
  acceptOrder,
  serveOrder,
  markAsPaid,
  deleteOrder,
} from "../../../shared/lib/api/waiter";
import { initializeOfflineQueueProcessor } from "../../../shared/lib/offlineQueueProcessor";
import { getOrderWebSocketClient } from "../../../shared/lib/orderWebSocket";
import type { Order } from "../../../shared/types/order";

export default function WaiterOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [billOrder, setBillOrder] = useState<Order | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [servingOrderId, setServingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());

  // Auth check - only allow WAITER and ADMIN roles
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (
      !authLoading &&
      user?.role?.toUpperCase() !== "ADMIN" &&
      user?.role?.toUpperCase() !== "WAITER"
    ) {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

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
        const restaurantId = user?.restaurantId;
        console.log(
          `[WaiterOrders] Connecting with restaurantId: ${restaurantId}`,
        );
        await client.connect(restaurantId);
        setWsConnected(true);
      }

      // Skip if already subscribed
      if (unsubscribesRef.current.has(orderId)) {
        return;
      }

      // Subscribe to order updates with restaurantId
      const restaurantId = user?.restaurantId;
      console.log(
        `[WaiterOrders] Subscribing to order ${orderId} with restaurantId: ${restaurantId}`,
      );
      const unsubscribe = client.subscribeToOrder(
        orderId,
        (data) => {
          console.log("[WaiterOrders] Received WebSocket update:", data);

          if (data.type === "order:rejected") {
            // Order was rejected - remove from list
            console.log("[WaiterOrders] Order rejected, removing from list");
            setOrders((prev) => prev.filter((o) => o.orderId !== orderId));

            if (selectedOrder?.orderId === orderId) {
              setSelectedOrder(null);
            }
          } else if (data.type === "order:progress") {
            // Order status progressed
            console.log(
              "[WaiterOrders] Order status progressed:",
              data.newStatus,
            );

            // If the order has been completed or cancelled, remove it from the list
            // Note: We keep 'served' orders for manual deletion by the waiter
            if (["completed", "cancelled"].includes(data.newStatus)) {
              console.log(
                `[WaiterOrders] Order ${data.newStatus}, removing from list`,
              );
              setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
              if (selectedOrder?.orderId === orderId) {
                setSelectedOrder(null);
              }
            } else {
              // Otherwise, update the order in the list with the new status
              setOrders((prev) =>
                prev.map((o) =>
                  o.orderId === orderId ? { ...o, status: data.newStatus } : o,
                ),
              );
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
        },
        user?.restaurantId, // Pass restaurantId to filter socket broadcasts
      );

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

  const handlePrintBill = (order: Order) => {
    setBillOrder(order);
  };

  const handleAccept = async (order: Order) => {
    if (acceptingOrderId) return; // Prevent multiple clicks

    setAcceptingOrderId(order.orderId);
    try {
      const updatedOrder = await acceptOrder(order.orderId, {
        version: order.version,
      });
      toast.success("Order accepted and sent to kitchen!");
      // Update order status in list instead of removing it
      setOrders(
        orders.map((o) => (o.orderId === order.orderId ? updatedOrder : o)),
      );
      if (selectedOrder?.orderId === order.orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept order";
      toast.error(message);
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleServe = async (orderId: string) => {
    if (servingOrderId) return;

    setServingOrderId(orderId);
    try {
      const updatedOrder = await serveOrder(orderId);
      toast.success("Order marked as delivered!");
      // Update order status in list instead of removing it
      setOrders(orders.map((o) => (o.orderId === orderId ? updatedOrder : o)));
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to mark as delivered";
      toast.error(message);
    } finally {
      setServingOrderId(null);
    }
  };

  const handlePay = async (orderId: string, paymentData: any) => {
    if (payingOrderId) return;

    setPayingOrderId(orderId);
    try {
      await markAsPaid(orderId, paymentData);
      toast.success("Order marked as paid and completed!");
      // Remove completed order from the list
      setOrders(orders.filter((o) => o.orderId !== orderId));
      setBillOrder(null);
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process payment";
      toast.error(message);
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (deletingOrderId) return;

    if (!confirm("Remove this order card?")) return;

    setDeletingOrderId(orderId);
    try {
      await deleteOrder(orderId);
      toast.success("Order card removed");
      setOrders(orders.filter((o) => o.orderId !== orderId));
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove order card";
      toast.error(message);
    } finally {
      setDeletingOrderId(null);
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
                My Orders
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                {orders.length} active order{orders.length !== 1 ? "s" : ""}
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
            {[...orders]
              .sort((a, b) => {
                // Keep READY orders at the top
                if (a.status === "ready" && b.status !== "ready") return -1;
                if (a.status !== "ready" && b.status === "ready") return 1;
                // Otherwise sort by creation time (ascending)
                return (
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
                );
              })
              .map((order) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  onClick={() => handleOrderClick(order)}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onServe={handleServe}
                  onDelete={handleDelete}
                  onPrintBill={handlePrintBill}
                  isAccepting={acceptingOrderId === order.orderId}
                  isServing={servingOrderId === order.orderId}
                  isDeleting={deletingOrderId === order.orderId}
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
          onPrintBill={handlePrintBill}
          isOnline={isOnline}
        />
      )}

      {rejectingOrderId && (
        <RejectOrderModal
          orderId={rejectingOrderId}
          tableNumber={
            Number(
              orders.find((o) => o.orderId === rejectingOrderId)?.tableNumber,
            ) || 0
          }
          isOpen={!!rejectingOrderId}
          onClose={() => setRejectingOrderId(null)}
          onSuccess={handleRejectSuccess}
          isOnline={isOnline}
        />
      )}

      {billOrder && (
        <BillModal
          isOpen={!!billOrder}
          onClose={() => setBillOrder(null)}
          orders={[billOrder]}
          onPay={handlePay}
          isPaying={!!payingOrderId}
        />
      )}
    </DashboardLayout>
  );
}
