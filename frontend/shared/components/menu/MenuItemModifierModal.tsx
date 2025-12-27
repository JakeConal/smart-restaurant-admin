"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Checkbox } from "@/shared/components/ui";
import { Grid3x3, Loader2 } from "lucide-react";
import type { MenuItem, ModifierGroup } from "@/shared/types/menu";
import { menuApi } from "@/shared/lib/api/menu";

export interface MenuItemModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
}

export const MenuItemModifierModal: React.FC<MenuItemModifierModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Load available modifier groups and current attachments
  useEffect(() => {
    if (isOpen && item) {
      // Reset state when modal opens
      setSelectedGroupIds([]);
      setModifierGroups([]);
      loadData();
    } else if (!isOpen) {
      // Reset state when modal closes
      setSelectedGroupIds([]);
      setModifierGroups([]);
    }
  }, [isOpen, item?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading modifier data for item:", item.id);

      // Load all available modifier groups
      const allGroups = await menuApi.getModifierGroups();
      console.log("All modifier groups:", allGroups);

      // Load currently attached groups for this item
      const attachedGroups = await menuApi.getItemModifierGroups(item.id);
      console.log("Attached modifier groups:", attachedGroups);

      setModifierGroups(allGroups);
      setSelectedGroupIds(attachedGroups.map((g) => g.id));
      console.log(
        "Selected group IDs:",
        attachedGroups.map((g) => g.id),
      );
    } catch (error) {
      console.error("Failed to load modifier data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await menuApi.attachModifierGroups(item.id, {
        groupIds: selectedGroupIds,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save modifier groups:", error);
    } finally {
      setSaving(false);
    }
  };

  const getSelectionTypeLabel = (type: string) => {
    return type === "single" ? "Single Choice" : "Multiple Choice";
  };

  const getRequiredLabel = (isRequired: boolean) => {
    return isRequired ? "Required" : "Optional";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Modifiers - ${item?.name}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Grid3x3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Modifier Groups</h3>
            <p className="text-sm text-gray-500">
              Select which modifier groups to attach to this menu item
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500">
              Loading modifier groups...
            </span>
          </div>
        )}

        {/* Modifier Groups List */}
        {!loading && modifierGroups.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {modifierGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => handleToggleGroup(group.id)}
                  disabled={saving}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {group.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        group.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {group.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{getSelectionTypeLabel(group.selectionType)}</span>
                    <span>•</span>
                    <span>{getRequiredLabel(group.isRequired)}</span>
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
                    <span>•</span>
                    <span>{group.options?.length || 0} options</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && modifierGroups.length === 0 && (
          <div className="text-center py-8">
            <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No modifier groups available
            </h3>
            <p className="text-gray-500">
              Create modifier groups first before attaching them to menu items.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="min-w-[100px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
