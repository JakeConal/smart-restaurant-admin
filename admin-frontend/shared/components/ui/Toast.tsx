"use client";

import React from "react";
import toast, { Toaster, Toast as HotToast } from "react-hot-toast";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

export const useToast = () => {
  return {
    success: (message: React.ReactNode, duration?: number) =>
      toast.custom(
        (t) => <ToastContent type="success" message={message} toast={t} />,
        { duration: duration || 5000 },
      ),
    error: (message: React.ReactNode, duration?: number) =>
      toast.custom(
        (t) => <ToastContent type="error" message={message} toast={t} />,
        { duration: duration || 5000 },
      ),
    warning: (message: React.ReactNode, duration?: number) =>
      toast.custom(
        (t) => <ToastContent type="warning" message={message} toast={t} />,
        { duration: duration || 5000 },
      ),
    info: (message: React.ReactNode, duration?: number) =>
      toast.custom(
        (t) => <ToastContent type="info" message={message} toast={t} />,
        { duration: duration || 5000 },
      ),
  };
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "",
          style: {
            background: "transparent",
            boxShadow: "none",
            padding: 0,
          },
        }}
      />
    </>
  );
};

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastContentProps {
  type: ToastType;
  message: React.ReactNode;
  toast: HotToast;
}

const ToastContent: React.FC<ToastContentProps> = ({
  type,
  message,
  toast: t,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const variants = {
    success: {
      icon: CheckCircle,
      bg: "bg-green-50",
      border: "border-green-200",
      iconColor: "text-green-600",
      textColor: "text-green-900",
    },
    error: {
      icon: AlertCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-600",
      textColor: "text-red-900",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-orange-50",
      border: "border-orange-200",
      iconColor: "text-orange-600",
      textColor: "text-orange-900",
    },
    info: {
      icon: Info,
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconColor: "text-blue-600",
      textColor: "text-blue-900",
    },
  };

  const variant = variants[type];
  const Icon = variant.icon;

  return (
    <div
      className={`${variant.bg} ${variant.border} border rounded-2xl shadow-xl p-4 min-w-[320px] max-w-md transition-all duration-300 ${
        t.visible && mounted
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${variant.iconColor} shrink-0 mt-0.5`} />
        <div className={`flex-1 text-sm font-medium ${variant.textColor}`}>
          {message}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`${variant.iconColor} hover:opacity-70 transition-opacity shrink-0 cursor-pointer`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
