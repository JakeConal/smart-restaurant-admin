'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { EscalatedOrderCard } from "@/shared/components/manager/EscalatedOrderCard";
import { EscalatedOrderDetailModal } from "@/shared/components/manager/EscalatedOrderDetailModal";
import { ReassignOrderModal } from "@/shared/components/manager/ReassignOrderModal";
import { Button } from "@/shared/components/ui/Button";
import { useToast } from "@/shared/components/ui/Toast";
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout";
import { TopBar } from "@/shared/components/layout/TopBar";
import { useEscalationPolling } from "@/shared/lib/hooks/useEscalationPolling";
import { getEscalatedOrders } from "@/shared/lib/api/manager";
import type { Order } from "@/shared/types/order";

export default function EscalatedOrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reassigningOrder, setReassigningOrder] = useState<Order | null>(null);

  // Use polling hook for notifications
  const { count, isOnline, refetch } = useEscalationPolling({
    enabled: true,
    onNewEscalation: () => {
      // Refresh orders when new escalation occurs
      loadOrders();
    },
  });

  const loadOrders = async () => {
    try {
      const data = await getEscalatedOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load escalated orders:', error);
      if (error instanceof Error && error.message.includes('Only managers')) {
        toast.error('Access denied. This page is for managers only.');
        router.push('/');
      } else if (isLoading) {
        toast.error('Failed to load escalated orders');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
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

  const handleReassign = () => {
    if (selectedOrder) {
      setReassigningOrder(selectedOrder);
      setSelectedOrder(null);
    }
  };

  const handleReassignSuccess = (updatedOrder: Order) => {
    // Remove from escalated list since it's been reassigned
    setOrders(orders.filter((o) => o.orderId !== updatedOrder.orderId));
    toast.success('Order has been reassigned and escalation cleared');
  };

  return (
    <DashboardLayout>
      <TopBar 
        title="Escalated Orders" 
        subtitle={`${count} order${count !== 1 ? 's' : ''} require immediate attention`}
      />

      <div className="flex-1 overflow-y-auto px-2 pb-8">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all ${
              isOnline 
                ? 'bg-green-50 text-green-700 border-green-100' 
                : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {isOnline ? 'System Live' : 'System Offline'}
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-100">
              <Shield className="w-3.5 h-3.5" />
              Manager Access
            </div>
          </div>

          <Button
            onClick={handleRefresh}
            variant="secondary"
            disabled={isLoading}
            className="rounded-2xl flex items-center gap-2 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all h-10 px-6"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-slate-800 font-bold text-sm tracking-tight">Refresh</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-[2rem] border border-slate-100/50 backdrop-blur-sm">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
              <AlertCircle className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Scanning for escalations...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
              <Shield className="w-12 h-12 text-slate-200" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
              All Clear
            </h2>
            <p className="text-gray-400 font-medium max-w-xs text-center">
              There are currently no orders that require manager intervention. Keep up the great work!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Warning banner - Compact Bento style */}
            <div className="bg-red-500 rounded-[1.75rem] p-5 text-white shadow-xl shadow-red-100/50 relative overflow-hidden group">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-all duration-700" />
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/30 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-black tracking-tight">
                      Critical Performance Alert
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-white text-red-600 text-[9px] font-black uppercase tracking-widest">
                      Urgent
                    </span>
                  </div>
                  <p className="text-xs font-bold text-red-50 opacity-90 max-w-3xl leading-snug">
                    Delayed orders impact customer satisfaction. Please reassign orders exceeding the 5-minute response window immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Orders grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <EscalatedOrderCard
                  key={order.orderId}
                  order={order}
                  onClick={() => handleOrderClick(order)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedOrder && (
        <EscalatedOrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onReassign={handleReassign}
        />
      )}

      {reassigningOrder && (
        <ReassignOrderModal
          order={reassigningOrder}
          isOpen={!!reassigningOrder}
          onClose={() => setReassigningOrder(null)}
          onSuccess={handleReassignSuccess}
        />
      )}
    </DashboardLayout>
  );
}
