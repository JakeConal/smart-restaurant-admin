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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in p-4 sm:p-6">
      <div
        className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[48px] shadow-[0_32px_80px_rgba(0,0,0,0.3)] overflow-hidden animate-slide-in-up border border-white/50 ring-1 ring-slate-900/5"
      >
        {/* Header */}
        <div className="px-10 py-8 flex justify-between items-center border-b border-slate-100/50 bg-white/50 backdrop-blur-sm">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              {step === "info" ? "Guest Details" : "Review Batch"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black uppercase tracking-wider text-slate-500">
                {step === "info" ? "Step 1 of 2" : "Step 2 of 2"}
              </div>
              <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 transition-all duration-500 ease-out"
                  style={{ width: step === "info" ? "50%" : "100%" }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-[20px] bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-10 py-10 scrollbar-hide">
          {step === "info" ? (
            <div className="space-y-10">
              {/* Input Fields Group */}
              <div className="space-y-8">
                {/* Guest Name Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Full Name</label>
                    {errors.guestName && (
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-wider animate-pulse">
                        {errors.guestName}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        if (errors.guestName) setErrors({ ...errors, guestName: "" });
                      }}
                      placeholder="e.g. John Doe"
                      className={`w-full h-16 bg-white border-2 ${errors.guestName ? "border-red-200 ring-4 ring-red-50" : "border-slate-100 focus:border-slate-900 shadow-sm"} rounded-[24px] px-7 text-sm font-bold text-slate-900 placeholder:text-slate-400/60 transition-all duration-300 outline-none`}
                    />
                    <div className={`absolute right-6 top-1/2 -translate-y-1/2 transition-colors ${guestName ? "text-slate-900" : "text-slate-300"}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                  </div>
                </div>

                {/* Special Instructions Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">Special Requests</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any allergies or special requests for the chef?"
                    rows={3}
                    className="w-full bg-white border-2 border-slate-100 focus:border-slate-900 rounded-[24px] p-7 text-sm font-bold text-slate-900 placeholder:text-slate-400/60 transition-all duration-300 outline-none resize-none shadow-sm"
                  />
                </div>
              </div>

              {/* Table Status Card */}
              <div className="p-7 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[18px] bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm">
                    📍
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Table Status</h4>
                    <p className="text-base font-black text-slate-900">Table {tableNumber || "Verified"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                </div>
              </div>

              {/* Primary Action */}
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="w-full h-18 bg-slate-900 text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 group"
              >
                <span>Review Selection</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Order Recap list */}
              <div className="space-y-5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Items Batch</span>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="p-5 bg-slate-50 rounded-[28px] border border-slate-100 flex justify-between items-center transition-all hover:bg-white hover:shadow-md">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-sm font-black text-slate-900 shadow-sm">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{item.menuItem.name}</p>
                          {item.modifiers.length > 0 && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                              {item.modifiers.map(m => m.optionName).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-900 tracking-tight">
                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Dashboard Card */}
              <div className="p-8 bg-slate-900 rounded-[40px] text-white space-y-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />

                <div className="space-y-3 opacity-60">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                    <span className="text-xs font-bold font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">Service Tax (10%)</span>
                    <span className="text-xs font-bold font-mono">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 block mb-1">Total Amount</span>
                    <h3 className="text-4xl font-black tracking-tighter">${total.toFixed(2)}</h3>
                  </div>
                  <div className="w-14 h-14 rounded-[22px] bg-white/10 flex items-center justify-center border border-white/10 text-emerald-400">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                </div>
              </div>

              {/* Dual Action Grid */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep("info")}
                  className="flex-1 h-18 rounded-[28px] bg-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                >
                  Edit
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-[2] h-18 bg-emerald-500 text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_40px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="animate-pulse">Processing...</span>
                    </div>
                  ) : (
                    <>
                      <span>Submit Batch</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
