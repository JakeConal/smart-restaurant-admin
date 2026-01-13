"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Badge } from "@/shared/components/ui";
import {
  Crown,
  ImageIcon,
  DollarSign,
  Clock,
  Grid3x3,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import type { MenuItem, ModifierGroup } from "@/shared/types/menu";
import { menuApi } from "@/shared/lib/api/menu";

export interface MenuItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
}

const statusVariants = {
  available: "active" as const,
  unavailable: "inactive" as const,
  sold_out: "inactive" as const,
};

const statusColors = {
  available: "text-green-600",
  unavailable: "text-red-600",
  sold_out: "text-orange-600",
};

export const MenuItemDetailModal: React.FC<MenuItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [loading, setLoading] = useState(false);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [fullItem, setFullItem] = useState<MenuItem | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      loadItemDetails();
    } else if (!isOpen) {
      // Cleanup photo URL when modal closes
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
        setPhotoUrl(null);
      }
      setFullItem(null);
      setModifierGroups([]);
    }
  }, [isOpen, item]);

  const loadItemDetails = async () => {
    if (!item) return;

    try {
      setLoading(true);

      // Load full item details including modifier groups
      const detailedItem = await menuApi.getItemById(item.id);
      setFullItem(detailedItem);

      // Load modifier groups attached to this item
      const attachedGroups = await menuApi.getItemModifierGroups(item.id);
      setModifierGroups(attachedGroups);

      // Load photo if available
      if (detailedItem.primaryPhoto) {
        try {
          const blob = await menuApi.getPhotoData(
            detailedItem.id,
            detailedItem.primaryPhoto,
          );
          const url = URL.createObjectURL(blob);
          setPhotoUrl(url);
        } catch (error) {
          console.error("Failed to load photo:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load item details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  const displayItem = fullItem || item;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Menu Item Details"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500">Loading item details...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Header Section */}
            <div className="flex gap-6">
              {/* Image */}
              <div className="flex-shrink-0">
                {photoUrl ? (
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={photoUrl}
                      alt={displayItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {displayItem.name}
                      {displayItem.isChefRecommended && (
                        <Crown className="w-5 h-5 text-orange-500 fill-orange-500" />
                      )}
                    </h2>
                    <p className="text-gray-500">
                      {displayItem.categoryName || "Uncategorized"}
                    </p>
                  </div>
                  <Badge variant={statusVariants[displayItem.status]}>
                    {displayItem.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-xl font-bold text-gray-900">
                      {Number(displayItem.price).toFixed(2)}
                    </span>
                  </div>
                  {displayItem.prepTimeMinutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {displayItem.prepTimeMinutes} min prep time
                      </span>
                    </div>
                  )}
                </div>

                {displayItem.description && (
                  <p className="text-gray-600 leading-relaxed">
                    {displayItem.description}
                  </p>
                )}
              </div>
            </div>

            {/* Modifier Groups Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Grid3x3 className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Modifier Groups ({modifierGroups.length})
                </h3>
              </div>

              {modifierGroups.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No modifier groups attached to this item
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modifierGroups.map((group) => (
                    <div
                      key={group.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {group.name}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              {group.selectionType === "single" ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              {group.selectionType === "single"
                                ? "Single Choice"
                                : "Multiple Choice"}
                            </span>
                            <span>•</span>
                            <span>
                              {group.isRequired ? "Required" : "Optional"}
                            </span>
                            {group.minSelections > 0 && (
                              <>
                                <span>•</span>
                                <span>Min: {group.minSelections}</span>
                              </>
                            )}
                            {group.maxSelections > 0 && (
                              <>
                                <span>•</span>
                                <span>Max: {group.maxSelections}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            group.status === "active" ? "active" : "inactive"
                          }
                        >
                          {group.status}
                        </Badge>
                      </div>

                      {/* Modifier Options */}
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Options ({group.options?.length || 0})
                        </h5>
                        {group.options && group.options.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {group.options.map((option) => (
                              <div
                                key={option.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <span className="font-medium text-gray-900">
                                  {option.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  {option.priceAdjustment !== 0 && (
                                    <span
                                      className={`text-sm font-medium ${
                                        option.priceAdjustment > 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {option.priceAdjustment > 0 ? "+" : ""}$
                                      {Number(option.priceAdjustment).toFixed(
                                        2,
                                      )}
                                    </span>
                                  )}
                                  <Badge
                                    variant={
                                      option.status === "active"
                                        ? "active"
                                        : "inactive"
                                    }
                                    className="text-xs"
                                  >
                                    {option.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No options configured
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created</span>
                  <p className="font-medium">
                    {new Date(displayItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated</span>
                  <p className="font-medium">
                    {new Date(displayItem.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <p
                    className={`font-medium ${statusColors[displayItem.status]}`}
                  >
                    {displayItem.status.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Chef Recommended</span>
                  <p className="font-medium">
                    {displayItem.isChefRecommended ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};
