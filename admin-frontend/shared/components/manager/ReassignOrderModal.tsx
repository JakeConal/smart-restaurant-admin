'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Loader2 } from 'lucide-react';
import type { Order } from '../../types/order';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { tablesApi } from '../../lib/api/tables';
import { reassignOrder } from '../../lib/api/manager';

interface ReassignOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

interface Waiter {
  userId: string;
  full_name: string;
  email: string;
  role: string;
}

export function ReassignOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: ReassignOrderModalProps) {
  const toast = useToast();
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWaiters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadWaiters = async () => {
    setIsLoading(true);
    try {
      const data = await tablesApi.getWaiters();
      // Map the response to match our Waiter interface
      const mappedWaiters = data.map(w => ({
        userId: w.id,
        full_name: w.full_name,
        email: w.email,
        role: 'WAITER'
      }));
      setWaiters(mappedWaiters);
    } catch (error) {
      console.error('Failed to load waiters:', error);
      toast.error('Failed to load waiters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedWaiterId) {
      toast.error('Please select a waiter');
      return;
    }

    setIsReassigning(true);
    try {
      const updatedOrder = await reassignOrder(order.orderId, {
        new_waiter_id: selectedWaiterId,
      });
      toast.success('Order reassigned successfully!');
      onSuccess(updatedOrder);
      onClose();
      setSelectedWaiterId('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reassign order';
      toast.error(message);
    } finally {
      setIsReassigning(false);
    }
  };

  if (!isOpen) return null;

  const currentWaiterName = order.waiter?.full_name || 'Unassigned';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="border-b border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Reassign Order
                </h2>
                <p className="text-sm text-gray-500">
                  Table {order.tableNumber} • Order #{order.orderId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Current waiter */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Currently assigned to</p>
              <p className="font-semibold text-gray-900">{currentWaiterName}</p>
            </div>

            {/* Waiter selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reassign to waiter <span className="text-red-500">*</span>
              </label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <select
                  value={selectedWaiterId}
                  onChange={(e) => setSelectedWaiterId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a waiter</option>
                  {waiters.map((waiter) => (
                    <option key={waiter.userId} value={waiter.userId}>
                      {waiter.full_name} ({waiter.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Escalation info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              This order has been escalated. Reassigning will clear the escalation flag
              and reset the timer.
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onClose}
                variant="secondary"
                className="flex-1"
                disabled={isReassigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassign}
                variant="primary"
                className="flex-1"
                disabled={isReassigning || !selectedWaiterId}
              >
                {isReassigning ? 'Reassigning...' : 'Reassign Order'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
