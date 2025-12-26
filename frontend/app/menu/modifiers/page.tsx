"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout, TopBar } from "@/components/layout";
import { ModifierGroupFormModal } from "@/components/menu";
import { Button, Card, Badge, useToast } from "@/components/ui";
import {
  RefreshCw,
  Grid3x3,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
} from "lucide-react";
import type {
  ModifierGroup,
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  CreateModifierOptionDto,
} from "@/types/menu";
import { menuApi } from "@/lib/api/menu";

export default function ModifiersPage() {
  const toast = useToast();
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<
    ModifierGroup | undefined
  >();

  // Stats
  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.status === "active").length;
  const totalOptions = groups.reduce(
    (sum, g) => sum + (g.options?.length || 0),
    0,
  );

  // Load modifier groups
  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await menuApi.getModifierGroups();
      setGroups(data);
    } catch (error) {
      console.error("Failed to load modifier groups:", error);
      toast.error("Failed to load modifier groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Create group
  const handleCreate = async (
    data: CreateModifierGroupDto | UpdateModifierGroupDto,
    options?: CreateModifierOptionDto[],
  ) => {
    const group = await menuApi.createModifierGroup(
      data as CreateModifierGroupDto,
    );

    // Create options if provided
    if (options && options.length > 0) {
      for (const option of options) {
        await menuApi.createModifierOption(group.id, option);
      }
    }

    await loadGroups();
    setShowCreateModal(false);
  };

  // Update group
  const handleUpdate = async (data: UpdateModifierGroupDto) => {
    if (!selectedGroup) return;
    await menuApi.updateModifierGroup(selectedGroup.id, data);
    await loadGroups();
    setShowEditModal(false);
  };

  // Edit group
  const handleEdit = (group: ModifierGroup) => {
    setSelectedGroup(group);
    setShowEditModal(true);
  };

  // Delete group
  const handleDelete = async (group: ModifierGroup) => {
    if (
      !confirm(
        `Are you sure you want to delete "${group.name}"? This will affect all menu items using this modifier group.`,
      )
    ) {
      return;
    }

    try {
      await menuApi.deleteModifierGroup(group.id);
      await loadGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error("Failed to delete modifier group");
    }
  };

  // Delete option
  const handleDeleteOption = async (
    groupId: string,
    optionId: string,
    optionName: string,
  ) => {
    if (!confirm(`Are you sure you want to delete "${optionName}"?`)) {
      return;
    }

    try {
      await menuApi.deleteModifierOption(optionId);
      await loadGroups();
    } catch (error) {
      console.error("Failed to delete option:", error);
      toast.error("Failed to delete modifier option");
    }
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Modifier Groups"
        subtitle="Manage customization options"
        onAddClick={() => setShowCreateModal(true)}
        showViewToggle={false}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 shrink-0">
        <Card className="p-5 flex flex-col justify-between h-32">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            <Grid3x3 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-2xl font-bold block">{totalGroups}</span>
            <span className="text-gray-400 text-sm font-semibold">
              Total Groups
            </span>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-32">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <Grid3x3 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-2xl font-bold block">{activeGroups}</span>
            <span className="text-gray-400 text-sm font-semibold">Active</span>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-32">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <span className="text-2xl font-bold block">{totalOptions}</span>
            <span className="text-gray-400 text-sm font-semibold">
              Total Options
            </span>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end px-1">
        <Button variant="ghost" size="sm" onClick={loadGroups} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
          <Grid3x3 className="w-5 h-5" />
          All Modifier Groups
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">
              Loading modifier groups...
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">
              No modifier groups found
            </p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="mt-4"
            >
              Create First Modifier Group
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id} className="p-6">
                {/* Group Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-900">
                        {group.name}
                      </h4>
                      <Badge
                        variant={
                          group.status === "active" ? "active" : "inactive"
                        }
                      >
                        {group.status}
                      </Badge>
                      {group.isRequired && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                          REQUIRED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-medium">
                        {group.selectionType === "single"
                          ? "Single Selection"
                          : "Multiple Selection"}
                      </span>
                      {group.selectionType === "multiple" && (
                        <span>
                          Min: {group.minSelections}, Max:{" "}
                          {group.maxSelections || "∞"}
                        </span>
                      )}
                      <span>Display Order: #{group.displayOrder}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(group)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={() => handleDelete(group)}
                      className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Options */}
                {group.options && group.options.length > 0 ? (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
                      Options ({group.options.length})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {group.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">
                                {option.name}
                              </span>
                              {option.status === "inactive" && (
                                <Badge variant="inactive">Inactive</Badge>
                              )}
                            </div>
                            {option.priceAdjustment > 0 && (
                              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                +${option.priceAdjustment.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              handleDeleteOption(
                                group.id,
                                option.id,
                                option.name,
                              )
                            }
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl">
                    <p className="text-sm text-gray-400">
                      No options added yet
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ModifierGroupFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      <ModifierGroupFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGroup(undefined);
        }}
        onSubmit={handleUpdate}
        group={selectedGroup}
        mode="edit"
      />
    </DashboardLayout>
  );
}
