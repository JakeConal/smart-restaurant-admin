"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/shared/components/auth/AuthContext";

const menuItems = [
  { icon: LayoutGrid, label: "Overview", href: "/" },
  { icon: Layers, label: "Tables", href: "/tables" },
  { icon: Users2, label: "Waiters", href: "/waiters" },
  { icon: ChefHat, label: "Kitchen Staff", href: "/kitchen-staff" },
  { icon: Utensils, label: "Menu", href: "/menu" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Super Admin uses a different layout without sidebar
  if (user?.role?.toUpperCase() === "SUPER_ADMIN") {
    return null;
  }

  return (
    <aside className="w-24 lg:w-64 bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md flex flex-col h-full py-6 px-4 overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-8 justify-center lg:justify-start shrink-0">
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

      {/* Navigation - Scrollable context */}
      <nav className="flex-1 space-y-2 flex flex-col items-center lg:items-stretch overflow-y-auto no-scrollbar pb-4">
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

        {/* Waiter Orders - visible to WAITER and ADMIN roles */}
        {(user?.role?.toUpperCase() === "WAITER" ||
          user?.role?.toUpperCase() === "ADMIN") && (
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

        {/* Waiter Tables - visible to WAITER and ADMIN roles */}
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
      </nav>

      {/* Footer Actions - Fixed at bottom */}
      <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col items-center lg:items-stretch shrink-0">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-all group"
        >
          <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="font-semibold hidden lg:block">Logout</span>
        </button>
      </div>
    </aside>
  );
};
