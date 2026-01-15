"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { vnpayApi } from "@/lib/api";

function VNPayReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<"success" | "error" | "verifying">("verifying");
    const [message, setMessage] = useState("Verifying your payment...");

    useEffect(() => {
        // Priority: URL param > localStorage
        const urlToken = searchParams.get("token");
        const storedToken = localStorage.getItem("vnpay_token");
        const activeToken = urlToken || storedToken || "";
        setToken(activeToken);
    }, [searchParams]);

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Pass all query parameters to the backend for verification
                const queryParams = searchParams.toString();
                const response = await vnpayApi.verifyReturn(queryParams);

                if (response.success) {
                    setStatus("success");
                    setMessage("Payment successful! Your orders have been updated.");

                    // Update sessionStorage to mark orders as paid (Same as Cash logic)
                    const storedOrderIdsStr = localStorage.getItem("vnpay_order_ids");
                    const storedOrderIds: string[] = storedOrderIdsStr ? JSON.parse(storedOrderIdsStr) : [];
                    const backendOrderIds = response.orderIds || [];

                    const allPaidIds = Array.from(new Set([
                        ...backendOrderIds,
                        ...storedOrderIds
                    ])).map(id => id.toLowerCase().replace(/[^a-z0-9]/g, ''));

                    if (allPaidIds.length > 0) {
                        for (let i = 0; i < sessionStorage.length; i++) {
                            const key = sessionStorage.key(i);
                            if (key && key.startsWith("order-")) {
                                const orderData = sessionStorage.getItem(key);
                                if (orderData) {
                                    try {
                                        const parsed = JSON.parse(orderData);
                                        const orderId = (parsed.orderId || String(parsed.id)).toLowerCase().replace(/[^a-z0-9]/g, '');

                                        if (allPaidIds.includes(orderId)) {
                                            const updatedOrder = {
                                                ...parsed,
                                                isPaid: true,
                                                paidAt: new Date().toISOString(),
                                                updatedAt: new Date().toISOString()
                                            };
                                            sessionStorage.setItem(key, JSON.stringify(updatedOrder));
                                            console.log(`[VNPay] Marked as paid in session: ${key}`);
                                        }
                                    } catch (e) {
                                        console.error("Error updating order in session:", key, e);
                                    }
                                }
                            }
                        }
                    }

                    // Clear the temporary stores
                    localStorage.removeItem("vnpay_token");
                    localStorage.removeItem("vnpay_order_ids");
                } else {
                    setStatus("error");
                    setMessage(response.message || "Payment verification failed.");
                }
            } catch (err) {
                console.error("Error verifying VNPay payment:", err);
                setStatus("error");
                setMessage("An error occurred while verifying your payment.");
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [searchParams]);

    // Auto redirect after 5 seconds if successful
    useEffect(() => {
        if (status === "success") {
            const timer = setTimeout(() => {
                router.push(`/order-tracking?token=${token}`);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status, router, token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-ivory-100 p-6">
            <div className="w-full max-w-sm bento-card !p-12 text-center relative overflow-hidden">
                {status === "verifying" && (
                    <div className="space-y-8 py-4">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl">💳</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-h2">Verifying</h2>
                            <p className="text-body text-slate-500">{message}</p>
                        </div>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-8 pt-4">
                        <div className="w-20 h-20 bg-green-100 rounded-[32px] flex items-center justify-center mx-auto shadow-inner animate-scale-in">
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-h2 text-green-700">Payment Success</h2>
                            <p className="text-body text-slate-500">{message}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Redirecting to orders in 5s
                            </p>
                        </div>
                        <Link
                            href={`/order-tracking?token=${token}`}
                            className="btn-primary w-full shadow-slate-300 flex items-center justify-center gap-2"
                        >
                            <span>BACK TO MENU</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-8 pt-4">
                        <div className="w-20 h-20 bg-red-100 rounded-[32px] flex items-center justify-center mx-auto shadow-inner animate-shake">
                            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-h2 text-red-700">Verification Failed</h2>
                            <p className="text-body text-slate-500">{message}</p>
                        </div>
                        <div className="space-y-4">
                            <Link
                                href={`/payment?token=${token}`}
                                className="btn-primary !bg-red-600 hover:!bg-red-700 w-full shadow-red-200"
                            >
                                TRY AGAIN
                            </Link>
                            <Link
                                href={`/order-tracking?token=${token}`}
                                className="block text-caption hover:text-slate-900 transition-colors pt-2"
                            >
                                CANCEL AND RETURN
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VNPayReturnPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <VNPayReturnContent />
        </Suspense>
    );
}
