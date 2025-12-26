"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout, TopBar } from "@/components/layout";
import {
  MenuCategoryCard,
  MenuCategoryFormModal,
  MenuStatsCards,
} from "@/components/menu";
import { Button, useToast } from "@/components/ui";
import { RefreshCw, Grid3x3 } from "lucide-react";
import type {
  MenuCategory,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  MenuCategoryFilters,
} from "@/types/menu";
import { menuApi } from "@/lib/api/menu";

export default function MenuCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MenuCategoryFilters>({});

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    MenuCategory | undefined
  >();

  // Stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter(
    (c) => c.status === "active",
  ).length;
  const totalItems = categories.reduce((sum, c) => sum + (c.itemCount || 0), 0);

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await menuApi.getCategories(filters);
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [filters]);

  // Create category
  const handleCreate = async (
    data: CreateMenuCategoryDto | UpdateMenuCategoryDto,
  ) => {
    await menuApi.createCategory(data as CreateMenuCategoryDto);
    await loadCategories();
    setShowCreateModal(false);
  };

  // Update category
  const handleUpdate = async (data: UpdateMenuCategoryDto) => {
    if (!selectedCategory) return;
    await menuApi.updateCategory(selectedCategory.id, data);
    await loadCategories();
    setShowEditModal(false);
  };

  // Toggle category status
  const handleToggleStatus = async (category: MenuCategory) => {
    const newStatus = category.status === "active" ? "inactive" : "active";

    if (newStatus === "inactive") {
      if (
        !confirm(
          `Are you sure you want to deactivate "${category.name}"? Items in this category may be hidden from guests.`,
        )
      ) {
        return;
      }
    }

    try {
      await menuApi.updateCategoryStatus(category.id, newStatus);
      await loadCategories();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update category status");
    }
  };

  // Edit category
  const handleEdit = (category: MenuCategory) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  // Delete category
  const handleDelete = async (category: MenuCategory) => {
    if (category.itemCount && category.itemCount > 0) {
      toast.warning(
        `Cannot delete "${category.name}" because it contains ${category.itemCount} items. Please move or delete the items first.`,
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await menuApi.deleteCategory(category.id);
      await loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Failed to delete category");
    }
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Menu Categories"
        subtitle="Organize your menu items"
        onAddClick={() => setShowCreateModal(true)}
        showViewToggle={false}
      />

      {/* Stats */}
      <MenuStatsCards
        totalCategories={totalCategories}
        totalItems={totalItems}
        activeItems={activeCategories}
        chefRecommendations={0}
      />

      {/* Filters & Actions */}
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-2">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as any })
            }
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={filters.sortBy || ""}
            onChange={(e) =>
              setFilters({ ...filters, sortBy: e.target.value as any })
            }
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">Sort By</option>
            <option value="displayOrder">Display Order</option>
            <option value="name">Name</option>
            <option value="createdAt">Date Created</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadCategories}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
          <Grid3x3 className="w-5 h-5" />
          All Categories
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">No categories found</p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="mt-4"
            >
              Create First Category
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((category) => (
              <MenuCategoryCard
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <MenuCategoryFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      <MenuCategoryFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(undefined);
        }}
        onSubmit={handleUpdate}
        category={selectedCategory}
        mode="edit"
      />
    </DashboardLayout>
  );
}
