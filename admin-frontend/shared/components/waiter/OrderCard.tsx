"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  ShoppingBag,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Trash2,
  Receipt,
} from "lucide-react";
import type { Order } from "../../types/order";
import { Button } from "../ui/Button";

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  onAccept?: (order: Order) => void;
  onReject?: (orderId: string) => void;
  onServe?: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
  onPrintBill?: (order: Order) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  isServing?: boolean;
  isDeleting?: boolean;
}

export function OrderCard({
  order,
  onClick,
  onAccept,
  onReject,
  onServe,
  onDelete,
  onPrintBill,
  isAccepting = false,
  isRejecting = false,
  isServing = false,
  isDeleting = false,
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
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">
                Order #{order.orderId.slice(-6)}
              </p>
              {order.status !== "pending_acceptance" && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    order.status === "ready"
                      ? "bg-green-100 text-green-700 animate-pulse"
                      : order.status === "preparing"
                        ? "bg-orange-100 text-orange-700"
                        : order.status === "served"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {order.status}
                </span>
              )}
              {order.isPaid && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-green-500 text-white shadow-sm">
                  PAID
                </span>
              )}
            </div>
          </div>
        </div>
        {order.billRequestedAt && !order.isPaid && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrintBill && onPrintBill(order);
            }}
            className="bg-red-50 text-red-600 p-1.5 rounded-lg flex items-center gap-1 animate-bounce shadow-sm border border-red-100 hover:bg-red-100 transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">BILL!</span>
          </button>
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
        {(() => {
          const baseTotal =
            typeof order.total === "number"
              ? order.total
              : parseFloat(String(order.total)) || 0;

          // Check for auto-discount (10% if > 100) or if backend already provides finalTotal
          const hasDiscount =
            baseTotal > 100 ||
            (order.finalTotal && order.finalTotal < baseTotal);
          const displayTotal =
            order.finalTotal ?? (baseTotal > 100 ? baseTotal * 0.9 : baseTotal);

          return (
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-black text-gray-900">
                ${displayTotal.toFixed(2)}
              </p>
              {hasDiscount && (
                <p className="text-xs text-gray-400 line-through">
                  ${baseTotal.toFixed(2)}
                </p>
              )}
              {hasDiscount && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">
                  10% OFF
                </span>
              )}
            </div>
          );
        })()}
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
        {order.status === "pending_acceptance" ? (
          <>
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
          </>
        ) : order.status === "ready" ? (
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black h-12 shadow-lg shadow-green-100"
            onClick={(e) => {
              e.stopPropagation();
              onServe && onServe(order.orderId);
            }}
            disabled={isServing}
          >
            <Check className="w-5 h-5 mr-2" />
            {isServing ? "Delivering..." : "MARK AS DELIVERED"}
          </Button>
        ) : order.status === "served" ? (
          <div className="flex gap-2 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrintBill && onPrintBill(order);
              }}
              className="flex-1 py-3 bg-green-50 rounded-xl border border-green-200 flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
            >
              <Receipt className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-700 uppercase tracking-widest">
                Print Bill
              </span>
            </button>
            <Button
              variant="ghost"
              className="px-3 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(order.orderId);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </Button>
          </div>
        ) : (
          <div className="w-full py-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Kitchen: {order.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
