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
} from "lucide-react";

const menuItems = [
  { icon: LayoutGrid, label: "Overview", href: "/admin" },
  { icon: Layers, label: "Tables", href: "/admin/tables" },
  { icon: Utensils, label: "Menu", href: "/admin/menu" },
  { icon: Users2, label: "Staff", href: "/admin/staff" },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

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
          <span className="text-gray-400 font-medium text-sm">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 flex flex-col items-center lg:items-stretch">
        {menuItems.map((item) => {
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

        <div className="mt-auto"></div>

        <Link
          href="/admin/settings"
          className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-slate-800 hover:bg-slate-50 rounded-2xl transition-all group"
        >
          <Settings2 className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          <span className="font-semibold hidden lg:block">Settings</span>
        </Link>
      </nav>
    </aside>
  );
};
