'use client';

import React from 'react';
import { Clock, ShoppingBag, AlertCircle } from 'lucide-react';
import type { Order } from '../../types/order';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const getElapsedMinutes = () => {
    const now = new Date().getTime();
    const created = new Date(order.createdAt).getTime();
    return Math.floor((now - created) / 60000);
  };

  const elapsedMinutes = getElapsedMinutes();

  // Color code based on elapsed time
  const getTimeColor = () => {
    if (elapsedMinutes < 2) return 'text-green-600 bg-green-50 border-green-200';
    if (elapsedMinutes < 4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getCardBorder = () => {
    if (order.isEscalated) return 'border-red-500 border-2 shadow-lg';
    if (elapsedMinutes < 2) return 'border-green-200 border';
    if (elapsedMinutes < 4) return 'border-orange-200 border';
    return 'border-red-200 border-2';
  };

  return (
    <div
      className={`${getCardBorder()} rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow bg-white`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Table {order.tableNumber}
            </h3>
            <p className="text-sm text-gray-500">Order #{order.orderId}</p>
          </div>
        </div>

        {order.isEscalated && (
          <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            ESCALATED
          </div>
        )}
      </div>

      {/* Items count */}
      <div className="mb-3">
        <p className="text-sm text-gray-600">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </p>
        <p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p>
      </div>

      {/* Elapsed time */}
      <div className={`${getTimeColor()} flex items-center gap-2 px-3 py-2 rounded-lg border`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">
          {elapsedMinutes} minute{elapsedMinutes !== 1 ? 's' : ''} ago
        </span>
      </div>

      {/* Special instructions indicator */}
      {order.specialInstructions && (
        <div className="mt-2 text-xs text-gray-500 italic">
          Has special instructions
        </div>
      )}
    </div>
  );
}
