"use client";

import { useState } from "react";
import { CartItem } from "@/lib/types";

interface OrderInfoModalProps {
  isOpen: boolean;
  items: CartItem[];
  tableNumber?: string;
  onClose: () => void;
  onConfirm: (guestName: string, specialInstructions: string) => void;
  isLoading?: boolean;
}

export default function OrderInfoModal({
  isOpen,
  items,
  tableNumber,
  onClose,
  onConfirm,
  isLoading,
}: OrderInfoModalProps) {
  const [guestName, setGuestName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [step, setStep] = useState<"info" | "confirmation">("info");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    if (!guestName.trim()) {
      newErrors.guestName = "Please enter your name";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep("confirmation");
  };

  const handleConfirm = () => {
    onConfirm(guestName, specialInstructions);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 animate-fade-in safe-bottom">
      <div className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100/50 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {step === "info" ? "Order Information" : "Order Confirmation"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6">
          {step === "info" ? (
            // Step 1: Guest Information
            <div className="space-y-6">
              {/* Guest Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (errors.guestName) {
                      setErrors({ ...errors, guestName: "" });
                    }
                  }}
                  placeholder="Enter your name"
                  className={`w-full px-4 py-3 bg-white border rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.guestName
                      ? "border-red-300 focus:ring-red-500/50"
                      : "border-gray-200 focus:ring-orange-500/50"
                  }`}
                />
                {errors.guestName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.guestName}
                  </p>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., No onions, extra spicy, allergies, etc."
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
                />
              </div>

              {/* Table Info */}
              {tableNumber && (
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100/50">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Table Number:</span>{" "}
                    <span className="text-lg font-bold text-orange-600">
                      {tableNumber}
                    </span>
                  </p>
                </div>
              )}

              {/* Order Items Summary */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Order Items ({items.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span>
                        {item.menuItem.name} × {item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                Review Order
              </button>
            </div>
          ) : (
            // Step 2: Confirmation
            <div className="space-y-6">
              {/* Guest Info Display */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100/50">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Guest Name:</span>{" "}
                  <span className="text-lg font-bold text-blue-600">
                    {guestName}
                  </span>
                </p>
              </div>

              {/* Table Info */}
              {tableNumber && (
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100/50">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Table:</span>{" "}
                    <span className="text-lg font-bold text-orange-600">
                      {tableNumber}
                    </span>
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Order Items
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start p-3 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.menuItem.name}
                        </p>
                        {item.modifiers.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.modifiers.map((m) => m.optionName).join(", ")}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            {item.specialInstructions}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          × {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900">
                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {specialInstructions && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100/50">
                  <p className="text-xs font-semibold text-purple-600 mb-1">
                    SPECIAL INSTRUCTIONS
                  </p>
                  <p className="text-sm text-gray-700">{specialInstructions}</p>
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax (10%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-orange-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("info")}
                  className="flex-1 py-3 bg-gray-100 text-gray-900 font-semibold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
