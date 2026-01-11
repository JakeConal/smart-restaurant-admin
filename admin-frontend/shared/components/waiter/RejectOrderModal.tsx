'use client';

import React, { useState } from 'react';
import { X, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { rejectOrder } from '../../lib/api/waiter';

interface RejectOrderModalProps {
  orderId: string;
  tableNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isOnline: boolean;
}

const OFFLINE_QUEUE_KEY = 'waiter_offline_rejection_queue';

interface QueuedRejection {
  orderId: string;
  reason: string;
  timestamp: number;
}

export function RejectOrderModal({
  orderId,
  tableNumber,
  isOpen,
  onClose,
  onSuccess,
  isOnline,
}: RejectOrderModalProps) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  const queueRejection = (orderId: string, reason: string) => {
    try {
      const queue: QueuedRejection[] = JSON.parse(
        localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'
      );
      queue.push({
        orderId,
        reason,
        timestamp: Date.now(),
      });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to queue rejection:', error);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsRejecting(true);

    // If offline, queue the rejection
    if (!isOnline) {
      queueRejection(orderId, reason);
      toast.warning(
        'You are offline. This rejection will be sent when connection is restored.',
        7000
      );
      onSuccess();
      onClose();
      setReason('');
      setIsRejecting(false);
      return;
    }

    // If online, send immediately
    try {
      await rejectOrder(orderId, { reason });
      toast.success('Order rejected successfully');
      onSuccess();
      onClose();
      setReason('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject order';
      toast.error(message);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="border-b border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reject Order</h2>
                <p className="text-sm text-gray-500">Table {tableNumber}</p>
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
            {!isOnline && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                You are offline. This rejection will be queued and sent when your connection
                is restored.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Item out of stock, Kitchen closed, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">
                {reason.length}/500 characters
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onClose}
                variant="secondary"
                className="flex-1"
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                variant="danger"
                className="flex-1"
                disabled={isRejecting || !reason.trim()}
              >
                {isRejecting ? 'Rejecting...' : 'Reject Order'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
