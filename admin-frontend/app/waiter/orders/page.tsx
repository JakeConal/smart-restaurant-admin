'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw, WifiOff, Wifi } from 'lucide-react';
import { DashboardLayout } from '../../../shared/components/layout';
import { OrderCard } from '../../../shared/components/waiter/OrderCard';
import { OrderDetailModal } from '../../../shared/components/waiter/OrderDetailModal';
import { RejectOrderModal } from '../../../shared/components/waiter/RejectOrderModal';
import { Button } from '../../../shared/components/ui/Button';
import { useToast } from '../../../shared/components/ui/Toast';
import { useOrderPolling } from '../../../shared/lib/hooks/useOrderPolling';
import { getMyPendingOrders } from '../../../shared/lib/api/waiter';
import { initializeOfflineQueueProcessor } from '../../../shared/lib/offlineQueueProcessor';
import type { Order } from '../../../shared/types/order';

export default function WaiterOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);

  // Use polling hook for notifications
  const { count, isOnline, refetch } = useOrderPolling({
    enabled: true,
    onNewOrder: () => {
      // Refresh orders when new order comes in
      loadOrders();
    },
  });

  const loadOrders = async () => {
    try {
      const data = await getMyPendingOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      if (isLoading) {
        toast.error('Failed to load orders');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          `${results.success} queued rejection${results.success > 1 ? 's' : ''} processed successfully`
        );
        // Refresh orders after processing queue
        loadOrders();
      }
      
      if (results.failed > 0) {
        toast.error(
          `Failed to process ${results.failed} queued rejection${results.failed > 1 ? 's' : ''}`
        );
      }
    };

    window.addEventListener('offline-queue-processed', handleQueueProcessed);

    return () => {
      cleanup();
      window.removeEventListener('offline-queue-processed', handleQueueProcessed);
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

  const handleAccept = (updatedOrder: Order) => {
    // Remove from list since it's no longer pending
    setOrders(orders.filter((o) => o.orderId !== updatedOrder.orderId));
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

  const handleSendToKitchen = (updatedOrder: Order) => {
    // Remove from list since it's no longer pending
    setOrders(orders.filter((o) => o.orderId !== updatedOrder.orderId));
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
                {count} order{count !== 1 ? 's' : ''} waiting for review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Online status indicator */}
            <div
              className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                isOnline
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
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
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
              <p className="text-gray-600 text-sm font-medium">Loading orders...</p>
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
          onSendToKitchen={handleSendToKitchen}
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
