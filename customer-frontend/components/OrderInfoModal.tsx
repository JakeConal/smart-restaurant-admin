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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in safe-bottom p-4">
      <div className="w-full max-w-lg bg-ivory-100 rounded-[40px] shadow-2xl overflow-hidden animate-slide-up border border-white/50">
        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-slate-200/50 bg-white/50 backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-h2 leading-none">
              {step === "info" ? "Guest Details" : "Review Order"}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {step === "info" ? "Step 1 of 2" : "Final Step"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:border-slate-900 transition-all active:scale-90"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-8 py-8 scrollbar-hidden">
          {step === "info" ? (
            <div className="space-y-8">
              {/* Guest Name Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-caption !text-[10px]">Your Name</label>
                  {errors.guestName && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.guestName}</span>}
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (errors.guestName) {
                        setErrors({ ...errors, guestName: "" });
                      }
                    }}
                    placeholder="E.g. John Doe"
                    className={`w-full bg-white border ${errors.guestName ? "border-red-300 ring-4 ring-red-50" : "border-slate-200 focus:border-slate-900"} rounded-[20px] py-4 px-6 text-sm font-medium transition-all shadow-sm`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-4">
                <label className="text-caption !text-[10px] px-1">Notes for the kitchen</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Allergies, extra spicy, or special requests..."
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-6 text-sm font-medium focus:border-slate-900 transition-all shadow-sm resize-none"
                />
              </div>

              {/* Info Card */}
              <div className="bento-card bg-slate-100 p-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-lg shadow-sm">🍽️</div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Table Information</span>
                </div>
                <p className="text-lg font-black text-slate-900 ml-1">Table {tableNumber || "N/A"}</p>
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="btn-primary w-full h-16 shadow-slate-200"
              >
                Continue Selection
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Order Summary Recap */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Selected Flavors</span>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bento-card bg-white p-4 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-black text-slate-900">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.menuItem.name}</p>
                          {item.modifiers.length > 0 && (
                            <p className="text-[10px] text-slate-400 font-medium">
                              {item.modifiers.map(m => m.optionName).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bento-card bg-slate-900 p-8 text-white space-y-4">
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-xs font-black uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-xs font-black uppercase tracking-widest">Tax (10%)</span>
                  <span className="text-sm font-bold">${tax.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">Grand Total</span>
                    <h3 className="text-3xl font-black">${total.toFixed(2)}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep("info")}
                  className="flex-1 h-16 rounded-[24px] bg-white border border-slate-200 text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all active:scale-95 shadow-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-[2] btn-primary h-16 shadow-slate-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Placing...</span>
                    </div>
                  ) : "Confirm Order"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
