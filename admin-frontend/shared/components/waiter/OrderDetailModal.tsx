"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  XCircle,
  Clock,
  ShoppingBag,
  AlertCircle,
  WifiOff,
  Receipt,
} from "lucide-react";
import type { Order } from "../../types/order";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { acceptOrder } from "../../lib/api/waiter";

interface OrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (order: Order) => void;
  onReject: (orderId: string) => void;
  onPrintBill?: (order: Order) => void;
  isOnline: boolean;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onPrintBill,
  isOnline,
}: OrderDetailModalProps) {
  const toast = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [referenceTime] = useState(() => {
    // Use the current time as reference (when modal opened)
    // This ensures orders show correct elapsed time
    return new Date().getTime();
  });

  if (!isOpen) return null;

  // Update elapsed time every second
  React.useEffect(() => {
    const calculateElapsed = () => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - referenceTime) / 1000);
      setElapsedSeconds(Math.max(0, elapsed)); // Ensure non-negative
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [referenceTime]);

  const formatElapsedTime = () => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleAccept = async () => {
    if (!isOnline) {
      toast.error(
        "Cannot accept orders while offline. Please check your connection.",
      );
      return;
    }

    setIsAccepting(true);
    try {
      const updatedOrder = await acceptOrder(order.orderId, {
        version: order.version,
      });
      toast.success("Order accepted successfully!");
      onAccept(updatedOrder);
      onClose();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message?.includes("modified by another user")
      ) {
        toast.error(
          "Order was modified by another user. Please refresh and try again.",
          7000,
        );
      } else {
        const message =
          error instanceof Error ? error.message : "Failed to accept order";
        toast.error(message);
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = () => {
    onReject(order.orderId);
  };

  const canAccept = order.status === "pending_acceptance";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Table {order.tableNumber}
                </h2>
                <p className="text-sm text-gray-500">Order #{order.orderId}</p>
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
          <div className="p-6 space-y-6">
            {/* Status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatElapsedTime()}</span>
              </div>
              {!isOnline && (
                <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                  <WifiOff className="w-4 h-4" />
                  Offline
                </div>
              )}
            </div>

            {/* Order items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Order Items
              </h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {item.quantity}x
                        </span>
                        <span className="text-gray-900">
                          {item.menuItemName}
                        </span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="mt-1 ml-8 space-y-1">
                          {item.modifiers.map((mod, modIndex) => (
                            <p key={modIndex} className="text-sm text-gray-600">
                              + {mod.modifierOptionName}
                              {mod.price > 0 &&
                                ` (+$${Number(mod.price).toFixed(2)})`}
                            </p>
                          ))}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <p className="mt-1 ml-8 text-sm text-orange-600 italic">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">
                      $
                      {typeof (item.totalPrice || item.subtotal) === "number"
                        ? (
                            (item.totalPrice || item.subtotal) as number
                          ).toFixed(2)
                        : Number(item.totalPrice || item.subtotal || 0).toFixed(
                            2,
                          )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special requests */}
            {(order.specialRequests || order.specialInstructions) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-orange-900 mb-1">
                  Special Requests
                </h3>
                <p className="text-sm text-orange-700">
                  {order.specialRequests || order.specialInstructions}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${Number(order.tax).toFixed(2)}</span>
              </div>
              {(() => {
                const baseTotal = Number(order.total);
                const finalTotal =
                  order.finalTotal !== undefined && order.finalTotal !== null
                    ? typeof order.finalTotal === "number"
                      ? order.finalTotal
                      : parseFloat(String(order.finalTotal)) || 0
                    : undefined;
                const hasDiscount =
                  baseTotal > 100 ||
                  (finalTotal !== undefined && finalTotal < baseTotal);
                const displayTotal =
                  finalTotal ?? (baseTotal > 100 ? baseTotal * 0.9 : baseTotal);
                const discountAmount = baseTotal - displayTotal;

                return (
                  <>
                    {hasDiscount && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Discount (10% OFF)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-2xl font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                      <span>Final Total</span>
                      <span className="text-orange-600">
                        ${displayTotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                );
              })()}
              {onPrintBill && (
                <button
                  onClick={() => onPrintBill(order)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  <Receipt className="w-5 h-5" />
                  Preview & Print Invoice
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              {canAccept && (
                <>
                  <Button
                    onClick={handleAccept}
                    disabled={isAccepting || !isOnline}
                    variant="primary"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {isAccepting ? "Accepting..." : "Accept Order"}
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="danger"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Order
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
