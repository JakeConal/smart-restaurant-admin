"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { orderApi, vnpayApi } from "@/lib/api";
import { Order } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useApp();

  const currentToken = searchParams.get("token") || "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "vnpay">(
    "vnpay",
  );
  const [billRequested, setBillRequested] = useState(false);

  // Calculate total from orders
  const baseTotal = orders.reduce((sum, order) => sum + order.total, 0);

  // Auto apply 10% discount if total > 100
  const isAutoDiscount = baseTotal > 100;
  const discountAmount = isAutoDiscount ? (baseTotal * 10) / 100 : 0;
  const finalTotal = Math.max(0, baseTotal - discountAmount);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
      return;
    }

    // Load unpaid orders from sessionStorage
    try {
      const unpaidOrders: Order[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("order-")) {
          const orderJson = sessionStorage.getItem(key);
          if (orderJson) {
            const parsedOrder = JSON.parse(orderJson) as Order;
            if (!parsedOrder.isPaid) {
              unpaidOrders.push(parsedOrder);
            }
          }
        }
      }

      if (unpaidOrders.length > 0) {
        setOrders(unpaidOrders);
        console.log("Payment page loaded orders:", unpaidOrders);
        // Check if any order already has billRequestedAt
        if (unpaidOrders.some((o) => o.billRequestedAt)) {
          setBillRequested(true);
        }
      } else {
        console.warn("No unpaid orders found in sessionStorage");
        setError("No orders to pay for");
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Failed to load orders");
    }
    setLoading(false);
  }, [isAuthenticated, currentToken, router]);

  const handleRequestBill = async () => {
    if (!orders || orders.length === 0) return;

    setProcessing(true);
    try {
      await Promise.all(
        orders.map((order) => {
          const orderId = order.orderId || String(order.id);
          return orderApi.requestBill(orderId);
        }),
      );
      setBillRequested(true);

      // Update local storage
      orders.forEach((order) => {
        const key = order.orderId
          ? `order-${order.orderId}`
          : `order-${order.id}`;
        const updated = { ...order, billRequestedAt: new Date().toISOString() };
        sessionStorage.setItem(key, JSON.stringify(updated));
      });

      console.log("Bill requested for all orders");
    } catch (err) {
      console.error("Failed to request bill:", err);
      setError("Failed to request bill");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!orders || orders.length === 0) return;

    setProcessing(true);
    setError("");
    try {
      if (paymentMethod === "vnpay") {
        // VNPay integration
        // 1. Use numeric IDs for VNPay (Short, digits only, reliable)
        const orderIds = orders.map((o) => String(o.id));

        // 2. Persist order info because VNPay ReturnURL/TxnRef has strict limits
        localStorage.setItem("vnpay_token", currentToken);
        localStorage.setItem("vnpay_order_ids", JSON.stringify(orderIds));

        // 3. Prepare amount (VNPay expects VND)
        const totalVnd = Math.round(finalTotal * 25000);

        // 4. Use a clean return URL
        // Prefer explicit env variable for production stability, fallback to current origin
        const frontendBaseUrl = process.env.NEXT_PUBLIC_CUSTOMER_FRONTEND_URL || window.location.origin;
        const returnUrl = `${frontendBaseUrl}/payment/vnpay-return`;

        const response = await vnpayApi.createPayment({
          orderIds,
          totalAmount: totalVnd,
          returnUrl,
        });

        if (response.success && response.paymentUrl) {
          window.location.href = response.paymentUrl;
          return; // Redirecting, so we don't need to do anything else
        } else {
          throw new Error("Failed to create VNPay payment URL");
        }
      }

      // Simulate payment processing for other methods
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mark all orders as paid
      try {
        await Promise.all(
          orders.map((order) => {
            const orderId = order.orderId || String(order.id);

            // Calculate per-order discount if total > 100
            const perOrderDiscountAmount = isAutoDiscount
              ? order.total * 0.1
              : 0;
            const perOrderFinalTotal = order.total - perOrderDiscountAmount;

            const perOrderPaymentData = {
              paymentMethod,
              discountPercentage: isAutoDiscount ? 10 : 0,
              discountAmount: perOrderDiscountAmount,
              finalTotal: perOrderFinalTotal,
            };

            // Update session storage
            const orderKey = order.orderId
              ? `order-${order.orderId}`
              : `order-${order.id}`;
            const updatedOrder = {
              ...order,
              isPaid: true,
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...perOrderPaymentData,
            };
            sessionStorage.setItem(orderKey, JSON.stringify(updatedOrder));

            return orderApi.markAsPaid(orderId, perOrderPaymentData);
          }),
        );
        console.log("All orders marked as paid in database");
      } catch (dbErr) {
        console.warn(
          "Failed to save orders to database, but payment processed locally:",
          dbErr,
        );
      }

      // Redirect back to order tracking
      router.push(`/order-tracking?token=${currentToken}`);
    } catch (err) {
      setError("Payment failed. Please try again.");
      console.error("Payment failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated || loading) return null;

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{error || "No orders to pay for"}</p>
          <Link
            href={`/order-tracking?token=${currentToken}`}
            className="text-orange-600 hover:text-orange-700 font-semibold mt-4 inline-block"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-ivory-100/90 border-b border-slate-200/50 px-6 pt-6 pb-4 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex flex-col">
            <h1 className="text-h2 !text-xl !leading-tight">Checkout</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Gateway</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pt-10 pb-20 space-y-10">
        {/* Error Message */}
        {error && (
          <div className="p-5 bg-red-50 border border-red-100 rounded-[28px] text-red-700 text-xs font-bold flex items-center gap-4 animate-fade-in shadow-sm">
            <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bento-card !p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-h3">Order Summary</h2>
            <span className="badge badge-info tracking-widest !text-[9px]">
              {orders.length} {orders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>

          <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
            {orders.map((order) =>
              order.items.map((item) => (
                <div
                  key={`${order.id}-${item.id}`}
                  className="flex justify-between items-center group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-ivory-200 transition-colors">
                      <span className="text-[10px] font-black text-slate-400">×{item.quantity}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {item.menuItemName}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider pt-0.5">Item Detail</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-slate-900">
                    ${item.totalPrice.toFixed(2)}
                  </p>
                </div>
              )),
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>${baseTotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center bg-green-50/50 p-3 rounded-2xl border border-green-100">
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">10% Off Applied</span>
                <span className="text-xs font-black text-green-600">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-4 border-t border-slate-100">
              <span className="text-h3 !text-lg">Final Total</span>
              <span className="text-2xl font-black text-slate-900">
                ${finalTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Bill Request Section */}
        {!billRequested ? (
          <div className="bento-card !bg-slate-900 !border-none !p-8 group">
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-white font-bold text-base tracking-tight">Need a bill?</h3>
                <p className="text-slate-400 text-xs leading-relaxed">Request a physical copy for your records</p>
              </div>
              <button
                onClick={handleRequestBill}
                disabled={processing}
                className="btn-secondary !bg-white !text-slate-900 !px-6 !py-3 whitespace-nowrap !rounded-[20px] shadow-xl group-hover:scale-110 active:scale-95 transition-all"
              >
                {processing ? "..." : "Request"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bento-card !bg-green-50/50 !border-green-100 !p-6 flex items-center gap-5">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-green-700 uppercase tracking-wider">Bill Requested</p>
              <p className="text-xs text-green-600/80 font-medium">Our staff will deliver your bill shortly. Feel free to pay online now.</p>
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-h3">Select Method</h2>
            <p className="text-caption !text-[10px]">Level 1 Encrypted</p>
          </div>

          <div className="space-y-3">
            {[
              { id: "vnpay", label: "VNPay QR", sub: "Local Banks & Wallets", icon: "🇻🇳" },
              { id: "card", label: "Credit Card", sub: "Global Cards", icon: "💳" },
              { id: "cash", label: "Table Cash", sub: "Pay with Staff", icon: "💵" }
            ].map((method) => (
              <label
                key={method.id}
                className={`bento-card !p-4 flex items-center justify-between cursor-pointer group transition-all duration-500 relative overflow-hidden ${paymentMethod === method.id
                  ? "ring-2 ring-slate-900 shadow-xl scale-[1.02]"
                  : "bg-white/50 border-slate-100 opacity-70 hover:opacity-100"
                  }`}
              >
                {paymentMethod === method.id && (
                  <div className="absolute inset-0 bg-slate-900/5 -z-10 animate-fade-in" />
                )}
                <div className="flex items-center gap-5">
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="hidden"
                  />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${paymentMethod === method.id ? "bg-slate-900 scale-110 rotate-3 shadow-lg" : "bg-slate-100 group-hover:scale-105"}`}>
                    {method.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-black transition-colors ${paymentMethod === method.id ? "text-slate-900" : "text-slate-500"}`}>
                      {method.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{method.sub}</span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${paymentMethod === method.id ? "border-slate-900 bg-slate-900" : "border-slate-200 group-hover:border-slate-400"}`}>
                  {paymentMethod === method.id && (
                    <div className="w-2 h-2 bg-white rounded-full animate-scale-in" />
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Dynamic Payment Info */}
        <div className="animate-fade-in">
          {paymentMethod === "vnpay" && (
            <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-[28px] flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-xl">🛡️</span>
              </div>
              <p className="text-xs text-orange-800 leading-relaxed pt-1">
                You will be redirected to <span className="font-bold">VNPay Portal</span>. Supports VietQR, domestic banks, and international cards.
              </p>
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="p-5 bg-blue-50/40 border border-blue-100 rounded-[28px] flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-xl">🧪</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed pt-1 font-medium">
                Testing Module: Complete payment simulation will be triggered. No real charges will be applied.
              </p>
            </div>
          )}

          {paymentMethod === "cash" && (
            <div className="p-5 bg-purple-50/40 border border-purple-100 rounded-[28px] flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-xl">🏃</span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed pt-1 font-medium">
                Our staff member will be at your table momentarily to assist with cash payment.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-4">
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black text-base shadow-2xl hover:shadow-slate-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-10 transition-opacity" />
            <div className="flex items-center justify-center gap-3">
              {processing && (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{processing ? "AUTHENTICATING..." : "AUTHORIZE PAYMENT"}</span>
            </div>
          </button>

          <button
            onClick={() => router.push(`/order-tracking?token=${currentToken}`)}
            className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>

      <BottomNav token={currentToken} />
    </div>
  );
}

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
