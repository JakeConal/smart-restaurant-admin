"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, Badge } from "@/shared/components/ui";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Crown,
  ImageIcon,
  DollarSign,
  Clock,
  Grid3x3,
  Zap,
  Eye,
} from "lucide-react";
import type { MenuItem } from "@/shared/types/menu";
import { menuApi } from "@/shared/lib/api/menu";

export interface MenuItemCardProps {
  item: MenuItem;
  onView: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onManagePhotos: (item: MenuItem) => void;
  onManageModifiers: (item: MenuItem) => void;
  onToggleStatus: (item: MenuItem) => void;
}

const statusVariants = {
  available: "active" as const,
  unavailable: "inactive" as const,
  sold_out: "inactive" as const,
};

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onView,
  onEdit,
  onDelete,
  onManagePhotos,
  onManageModifiers,
  onToggleStatus,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAvailable = item.status === "available";

  // Fetch photo data when primaryPhotoId is available
  useEffect(() => {
    if (item.primaryPhotoId) {
      menuApi
        .getPhotoData(item.id, item.primaryPhotoId)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setPhotoUrl(url);
          return url;
        })
        .catch((error) => {
          console.error("Failed to load photo:", error);
        });
    }

    // Cleanup
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [item.primaryPhotoId, item.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <Card
      className={`p-6 flex flex-col gap-4 group cursor-pointer relative overflow-visible ${
        !isAvailable ? "opacity-75 hover:opacity-100" : ""
      }`}
    >
      {/* Image */}
      {photoUrl ? (
        <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-100">
          <img
            src={photoUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-40 rounded-xl bg-slate-100 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-slate-300" />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
            {item.name}
            {item.isChefRecommended && (
              <Crown className="w-4 h-4 text-orange-500 fill-orange-500 flex-shrink-0" />
            )}
          </h4>
          <span className="text-gray-400 text-sm font-medium">
            {item.categoryName || "Uncategorized"}
          </span>
        </div>
        <Badge variant={statusVariants[item.status]}>
          {item.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-6 my-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Price
          </span>
          <span
            className={`text-lg font-bold ${!isAvailable ? "text-gray-500" : ""}`}
          >
            ${Number(item.price).toFixed(2)}
          </span>
        </div>
        {item.prepTimeMinutes !== undefined && (
          <>
            <div className="h-8 w-px bg-gray-100"></div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Prep
              </span>
              <span
                className={`text-lg font-bold ${!isAvailable ? "text-gray-500" : ""}`}
              >
                {item.prepTimeMinutes}m
              </span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManagePhotos(item);
          }}
          className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
        >
          Photos
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(item);
          }}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
        >
          View
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
        >
          Edit
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`px-3 h-full rounded-xl transition-colors ${
              showMenu ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 transition-all">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onManageModifiers(item);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Grid3x3 className="w-4 h-4 text-purple-600" />
                </div>
                Modifiers
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onToggleStatus(item);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                {isAvailable ? "Mark Unavailable" : "Mark Available"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(item);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
