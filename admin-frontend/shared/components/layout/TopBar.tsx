"use client";

import React from "react";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui";
import { useAuth } from "@/shared/components/auth/AuthContext";

export interface TopBarProps {
  title: string;
  subtitle?: string;
  onAddClick?: () => void;
  showViewToggle?: boolean;
  currentView?: "list" | "map";
  onViewChange?: (view: "list" | "map") => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  onAddClick,
  showViewToggle = false,
  currentView = "list",
  onViewChange,
}) => {
  const { user } = useAuth();

  return (
    <header className="h-20 flex items-center justify-between px-2">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-400 font-medium mt-1">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-800 transition-all">
          <Bell className="w-5 h-5" />
        </button>

        {onAddClick && (
          <button
            onClick={onAddClick}
            className="w-12 h-12 bg-slate-800 text-white rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    </header>
  );
};
