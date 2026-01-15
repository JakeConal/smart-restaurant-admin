"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { vnpayApi } from "@/lib/api";

function VNPayReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<"success" | "error" | "verifying">("verifying");
    const [message, setMessage] = useState("Verifying your payment...");

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Pass all query parameters to the backend for verification
                const queryParams = searchParams.toString();
                const response = await vnpayApi.verifyReturn(queryParams);

                if (response.success) {
                    setStatus("success");
                    setMessage("Payment successful! Your orders have been updated.");

                    // Clear payment-related local data if needed
                    // For this app, we might want to clear specific session storage items if we know which ones were paid
                    if (response.orderIds) {
                        response.orderIds.forEach(id => {
                            const orderData = sessionStorage.getItem(`order-${id}`);
                            if (orderData) {
                                const parsed = JSON.parse(orderData);
                                parsed.isPaid = true;
                                parsed.paidAt = new Date().toISOString();
                                sessionStorage.setItem(`order-${id}`, JSON.stringify(parsed));
                            }
                        });
                    }
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-25 via-white to-orange-50 p-6">
            <div className="w-full max-w-md bg-white rounded-3xl border border-orange-100/50 shadow-xl p-8 text-center">
                {status === "verifying" && (
                    <div className="space-y-4">
                        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <h2 className="text-xl font-bold text-gray-900">Processing Payment</h2>
                        <p className="text-gray-500">{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-4xl">✅</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">Payment Success!</h2>
                            <p className="text-gray-600">{message}</p>
                        </div>
                        <p className="text-sm text-gray-400">
                            Redirecting to your orders in a few seconds...
                        </p>
                        <Link
                            href={`/order-tracking?token=${token}`}
                            className="block w-full py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:bg-orange-700 transition-all"
                        >
                            Back to Menu
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-4xl">❌</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
                            <p className="text-gray-600">{message}</p>
                        </div>
                        <Link
                            href={`/payment?token=${token}`}
                            className="block w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:bg-red-700 transition-all"
                        >
                            Try Again
                        </Link>
                        <Link
                            href={`/order-tracking?token=${token}`}
                            className="block text-gray-500 font-semibold"
                        >
                            Cancel and Return
                        </Link>
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
