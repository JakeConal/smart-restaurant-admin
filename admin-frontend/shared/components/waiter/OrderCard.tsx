"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShoppingBag, AlertCircle, Check, X } from "lucide-react";
import type { Order } from "../../types/order";
import { Button } from "../ui/Button";

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  onAccept?: (order: Order) => void;
  onReject?: (orderId: string) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

export function OrderCard({
  order,
  onClick,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}: OrderCardProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    // Initial calculation
    const calculateElapsed = () => {
      const now = new Date().getTime();
      // Use acceptedAt if order has been accepted, otherwise use createdAt
      const referenceTime = order.acceptedAt || order.createdAt;
      const timeToUse =
        typeof referenceTime === "number"
          ? referenceTime
          : new Date(referenceTime).getTime();
      const elapsed = Math.floor((now - timeToUse) / 60000);
      setElapsedMinutes(Math.max(0, elapsed)); // Ensure non-negative
    };

    calculateElapsed();

    // Update every second for live countdown
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt, order.acceptedAt]);

  // Color code based on elapsed time
  const getTimeColor = () => {
    if (elapsedMinutes < 2)
      return "text-green-600 bg-green-50 border-green-200";
    if (elapsedMinutes < 4)
      return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getCardBorder = () => {
    if (order.isEscalated) return "border-red-500 border-2 shadow-lg";
    if (elapsedMinutes < 2) return "border-green-200 border";
    if (elapsedMinutes < 4) return "border-orange-200 border";
    return "border-red-200 border-2";
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
          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
        </p>
        <p className="text-lg font-bold text-gray-900">
          $
          {typeof order.total === "number"
            ? order.total.toFixed(2)
            : (parseFloat(String(order.total)) || 0).toFixed(2)}
        </p>
      </div>

      {/* Elapsed time */}
      <div
        className={`${getTimeColor()} flex items-center gap-2 px-3 py-2 rounded-lg border mb-3`}
      >
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">
          {elapsedMinutes} minute{elapsedMinutes !== 1 ? "s" : ""} ago
        </span>
      </div>

      {/* Special instructions indicator */}
      {order.specialInstructions && (
        <div className="mt-2 mb-3 text-xs text-gray-500 italic">
          Has special instructions
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {onAccept && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAccept(order);
            }}
            disabled={isAccepting}
            variant="secondary"
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            {isAccepting ? "Accepting..." : "Accept"}
          </Button>
        )}
        {onReject && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onReject(order.orderId);
            }}
            disabled={isRejecting}
            variant="secondary"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-1" />
            {isRejecting ? "Rejecting..." : "Decline"}
          </Button>
        )}
      </div>
    </div>
  );
}
