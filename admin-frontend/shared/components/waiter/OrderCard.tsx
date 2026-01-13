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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [referenceTime] = useState(() => {
    // Use the current time as reference (when component mounted)
    // This ensures new orders start from 00:00:00
    return new Date().getTime();
  });

  useEffect(() => {
    // Initial calculation
    const calculateElapsed = () => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - referenceTime) / 1000);
      setElapsedSeconds(Math.max(0, elapsed)); // Ensure non-negative
    };

    calculateElapsed();

    // Update every second for live countdown
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [referenceTime]);

  // Color code based on elapsed time
  const getTimeColor = () => {
    if (elapsedSeconds < 120)
      return "text-green-600 bg-green-50 border-green-200";
    if (elapsedSeconds < 240)
      return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getCardBorder = () => {
    if (order.isEscalated) return "border-red-500 border-2 shadow-lg";
    if (elapsedSeconds < 120) return "border-green-200 border";
    if (elapsedSeconds < 240) return "border-orange-200 border";
    return "border-red-200 border-2";
  };

  const formatElapsedTime = () => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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

      {/* Items list preview */}
      <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
        {order.items.map((item, idx) => (
          <div key={idx} className="text-sm">
            <div className="flex items-center gap-1.5">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded min-w-fit">
                {item.quantity}x
              </span>
              <span className="text-gray-800 font-medium flex-1">
                {item.menuItemName}
              </span>
            </div>
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="ml-4 space-y-0.5">
                {item.modifiers.map((mod, modIdx) => (
                  <p key={modIdx} className="text-xs text-blue-600">
                    + {mod.modifierOptionName}
                    {mod.price > 0 && ` (+$${Number(mod.price).toFixed(2)})`}
                  </p>
                ))}
              </div>
            )}
            {item.specialInstructions && (
              <p className="text-xs text-orange-600 ml-4 italic">
                📝 {item.specialInstructions}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Price */}
      <div className="mb-3">
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
        <span className="text-sm font-medium font-mono">
          {formatElapsedTime()}
        </span>
      </div>

      {/* Special requests indicator */}
      {(order.specialRequests || order.specialInstructions) && (
        <div className="mb-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-700 font-medium">
            📝 {order.specialRequests || order.specialInstructions}
          </p>
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
