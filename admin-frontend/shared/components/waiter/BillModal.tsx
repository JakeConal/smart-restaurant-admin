"use client";

import React from "react";
import { X, Printer, Download, Receipt } from "lucide-react";
import type { Order } from "../../types/order";

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onPay?: (orderId: string, paymentData: any) => Promise<void>;
  isPaying?: boolean;
}

export function BillModal({
  isOpen,
  onClose,
  orders,
  onPay,
  isPaying,
}: BillModalProps) {
  if (!isOpen || orders.length === 0) return null;

  // Calculate totals
  const baseTotal = orders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0,
  );
  const subtotal = orders.reduce(
    (sum, order) => sum + (Number(order.subtotal) || 0),
    0,
  );
  const tax = orders.reduce((sum, order) => sum + (Number(order.tax) || 0), 0);

  // Auto apply 10% discount if total > 100
  const isAutoDiscount = baseTotal > 100;

  // Use stored discount if paid, otherwise use auto-calculated discount
  const isPaid = orders.every((o) => o.isPaid);
  const firstOrder = orders[0];

  const discountType = isPaid
    ? firstOrder.discountPercentage
      ? "percentage"
      : firstOrder.discountAmount
        ? "fixed"
        : "none"
    : isAutoDiscount
      ? "percentage"
      : "none";

  const discountValue = isPaid
    ? firstOrder.discountPercentage || firstOrder.discountAmount || 0
    : isAutoDiscount
      ? 10
      : 0;

  const discountAmount =
    discountType === "percentage"
      ? (baseTotal * discountValue) / 100
      : discountType === "fixed"
        ? discountValue
        : 0;

  const finalTotal = Math.max(0, baseTotal - discountAmount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Preview Invoice</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto" id="printable-bill">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 border-b-2 border-orange-100 pb-2 uppercase tracking-tight">
              Receipt
            </h2>
            <div className="mt-4 flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <span>Table {orders[0]?.tableNumber || "N/A"}</span>
              <span>
                {new Date().toLocaleDateString()}{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {orders.map((order, oIdx) => (
              <div
                key={oIdx}
                className="border-b border-dashed border-gray-200 pb-4 last:border-0"
              >
                <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase">
                  Order #{order.orderId?.slice(-6) || order.id}
                </div>
                {order.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="flex justify-between text-sm mb-1.5"
                  >
                    <div className="flex-1 pr-4">
                      <span className="text-gray-800 font-medium">
                        {item.quantity}x {item.menuItemName}
                      </span>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="ml-4">
                          {item.modifiers.map((mod, mIdx) => (
                            <p
                              key={mIdx}
                              className="text-[10px] text-gray-500 italic"
                            >
                              + {mod.modifierOptionName}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-gray-900">
                      $
                      {(
                        Number(item.unitPrice || item.price || 0) *
                        item.quantity
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-4 bg-gray-50/50 p-4 rounded-2xl">
            <div className="flex justify-between text-sm text-gray-600 font-medium">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 font-medium">
              <span>Tax:</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-bold">
                <span>
                  Discount (
                  {discountType === "percentage"
                    ? `${discountValue}%`
                    : "Fixed"}
                  ):
                </span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-100 mt-2">
              <span>Total Due:</span>
              <span className="text-slate-900">
                ${(finalTotal || baseTotal).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Thank you for dining with us!
            </p>
            <div className="mt-4 flex justify-center grayscale opacity-30">
              <div className="w-12 h-12 border border-gray-300 rounded flex items-center justify-center text-[8px] text-gray-400">
                LOGO
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              <span>Print</span>
            </button>
          </div>

          {!isPaid && onPay && (
            <button
              onClick={() =>
                onPay(firstOrder.orderId, {
                  paymentMethod: "cash",
                  discountPercentage:
                    discountType === "percentage" ? discountValue : 0,
                  discountAmount: discountAmount,
                  finalTotal: finalTotal,
                })
              }
              disabled={isPaying}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-wider text-sm"
            >
              {isPaying ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Receipt className="w-5 h-5" />
              )}
              <span>Complete Payment & Close Order</span>
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bill,
          #printable-bill * {
            visibility: visible;
          }
          #printable-bill {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm;
          }
        }
      `}</style>
    </div>
  );
}
