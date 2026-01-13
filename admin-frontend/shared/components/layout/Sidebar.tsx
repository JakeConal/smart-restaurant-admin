"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Layers,
  Utensils,
  Users2,
  Settings2,
  ChefHat,
  ClipboardList,
  AlertCircle,
  Table2,
  Soup,
} from "lucide-react";
import { useAuth } from "@/shared/components/auth/AuthContext";
import { useEscalationPolling } from "../../lib/hooks/useEscalationPolling";

const menuItems = [
  { icon: LayoutGrid, label: "Overview", href: "/" },
  { icon: Layers, label: "Tables", href: "/tables" },
  { icon: Users2, label: "Waiters", href: "/waiters" },
  { icon: Utensils, label: "Menu", href: "/menu" },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  // Poll for escalated orders count (only for managers)
  const { count: escalatedCount } = useEscalationPolling({
    enabled: user?.role?.toUpperCase() === "ADMIN",
  });

  return (
    <aside className="w-24 lg:w-64 bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md flex flex-col h-full py-6 px-4">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-8 justify-center lg:justify-start">
        <div className="w-10 h-10 bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-lg">
          <ChefHat className="w-6 h-6" />
        </div>
        <div className="hidden lg:block">
          <span className="font-extrabold text-xl tracking-tight block leading-tight">
            Smart
          </span>
          <span className="text-gray-400 font-medium text-sm capitalize">
            {user?.role?.toLowerCase() || "Admin"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 flex flex-col items-center lg:items-stretch">
        {/* Admin menu items - only show for ADMIN role */}
        {user?.role?.toUpperCase() === "ADMIN" &&
          menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                  isActive
                    ? "bg-slate-800 text-white shadow-lg shadow-slate-200"
                    : "text-gray-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? "" : "group-hover:scale-110 transition-transform"
                  }`}
                />
                <span
                  className={`font-${isActive ? "bold" : "semibold"} hidden lg:block`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

        {/* Waiter Orders - visible to WAITER role only */}
        {user?.role?.toUpperCase() === "WAITER" && (
          <Link
            href="/waiter/orders"
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
              pathname === "/waiter/orders"
                ? "bg-slate-800 text-white shadow-lg shadow-slate-200"
                : "text-gray-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <ClipboardList
              className={`w-6 h-6 ${
                pathname === "/waiter/orders"
                  ? ""
                  : "group-hover:scale-110 transition-transform"
              }`}
            />
            <span
              className={`font-${pathname === "/waiter/orders" ? "bold" : "semibold"} hidden lg:block`}
            >
              Waiter Orders
            </span>
          </Link>
        )}

        {/* Waiter Tables - visible to WAITER role only */}
        {user?.role?.toUpperCase() === "WAITER" && (
          <Link
            href="/waiter/tables"
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
              pathname === "/waiter/tables"
                ? "bg-slate-800 text-white shadow-lg shadow-slate-200"
                : "text-gray-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Table2
              className={`w-6 h-6 ${
                pathname === "/waiter/tables"
                  ? ""
                  : "group-hover:scale-110 transition-transform"
              }`}
            />
            <span
              className={`font-${pathname === "/waiter/tables" ? "bold" : "semibold"} hidden lg:block`}
            >
              My Tables
            </span>
          </Link>
        )}

        {/* Kitchen Display - visible to ADMIN role */}
        {user?.role?.toUpperCase() === "ADMIN" && (
          <Link
            href="/kitchen"
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
              pathname === "/kitchen"
                ? "bg-slate-800 text-white shadow-lg shadow-slate-200"
                : "text-gray-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Soup
              className={`w-6 h-6 ${
                pathname === "/kitchen"
                  ? ""
                  : "group-hover:scale-110 transition-transform"
              }`}
            />
            <span
              className={`font-${pathname === "/kitchen" ? "bold" : "semibold"} hidden lg:block`}
            >
              Kitchen
            </span>
          </Link>
        )}

        {/* Manager Escalated Orders - visible only to ADMIN role */}
        {user?.role?.toUpperCase() === "ADMIN" && (
          <Link
            href="/manager/escalated-orders"
            className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
              pathname === "/manager/escalated-orders"
                ? "bg-slate-800 text-white shadow-lg shadow-slate-200"
                : "text-gray-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-4">
              <AlertCircle
                className={`w-6 h-6 ${
                  pathname === "/manager/escalated-orders"
                    ? ""
                    : "group-hover:scale-110 transition-transform"
                }`}
              />
              <span
                className={`font-${pathname === "/manager/escalated-orders" ? "bold" : "semibold"} hidden lg:block`}
              >
                Escalated
              </span>
            </div>
            {escalatedCount > 0 && (
              <span
                className={`hidden lg:flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${
                  pathname === "/manager/escalated-orders"
                    ? "bg-red-500 text-white"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {escalatedCount}
              </span>
            )}
          </Link>
        )}

        <div className="mt-auto"></div>

        <Link
          href="/settings"
          className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-slate-800 hover:bg-slate-50 rounded-2xl transition-all group"
        >
          <Settings2 className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          <span className="font-semibold hidden lg:block">Settings</span>
        </Link>
      </nav>
    </aside>
  );
};
