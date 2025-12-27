"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout, TopBar } from "@/shared/components/layout";
import {
  MenuItemCard,
  MenuItemFormModal,
  PhotoUpload,
  MenuStatsCards,
  MenuItemModifierModal,
  MenuItemDetailModal,
} from "@/shared/components/menu";
import { Button, Input, useToast } from "@/shared/components/ui";
import { RefreshCw, Search, UtensilsCrossed } from "lucide-react";
import type {
  MenuItem,
  MenuCategory,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  MenuItemFilters,
} from "@/shared/types/menu";
import { menuApi } from "@/shared/lib/api/menu";
import { useAuth } from "@/shared/components/auth/AuthContext";

export default function MenuItemsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<MenuItemFilters>({
    page: 1,
    limit: 12,
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | undefined>();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, isLoading, router]);

  // Stats
  const activeItems = (items || []).filter(
    (i) => i.status === "available",
  ).length;
  const chefRecommendations = (items || []).filter(
    (i) => i.isChefRecommended,
  ).length;

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await menuApi.getCategories({ status: "active" });
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  // Load items
  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await menuApi.getItems(filters);
      setItems(data.items || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load menu items");
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filters]);

  // Create item
  const handleCreate = async (data: CreateMenuItemDto | UpdateMenuItemDto) => {
    try {
      console.log("Creating menu item:", data);
      const result = await menuApi.createItem(data as CreateMenuItemDto);
      console.log("Menu item created:", result);
      toast.success("Menu item created successfully");
      await loadItems();
      setShowCreateModal(false);
    } catch (error: any) {
      console.error("Failed to create menu item:", error);
      toast.error(error.message || "Failed to create menu item");
      throw error; // Re-throw so the modal can handle it
    }
  };

  // Update item
  const handleUpdate = async (data: UpdateMenuItemDto) => {
    if (!selectedItem) return;
    try {
      await menuApi.updateItem(selectedItem.id, data);
      toast.success("Menu item updated successfully");
      await loadItems();
      setShowEditModal(false);
    } catch (error: any) {
      console.error("Failed to update menu item:", error);
      toast.error(error.message || "Failed to update menu item");
      throw error;
    }
  };

  // Toggle item status
  const handleToggleStatus = async (item: MenuItem) => {
    const newStatus = item.status === "available" ? "unavailable" : "available";

    try {
      await menuApi.updateItemStatus(item.id, newStatus);
      await loadItems();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update item status");
    }
  };

  // Edit item
  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  // Delete item
  const handleDelete = async (item: MenuItem) => {
    if (
      !confirm(
        `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await menuApi.deleteItem(item.id);
      await loadItems();
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error("Failed to delete menu item");
    }
  };

  // Photo management
  const handleManagePhotos = (item: MenuItem) => {
    setSelectedItem(item);
    setShowPhotoModal(true);
  };

  const handlePhotoUpload = async (files: File[]) => {
    if (!selectedItem) return;
    try {
      await menuApi.uploadPhotos(selectedItem.id, files);
      await loadItems();
      toast.success("Photos uploaded successfully");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload photos");
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (!selectedItem) return;
    try {
      await menuApi.deletePhoto(selectedItem.id, photoId);
      await loadItems();
      toast.success("Photo deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete photo");
    }
  };

  const handleSetPrimaryPhoto = async (photoId: string) => {
    if (!selectedItem) return;
    try {
      await menuApi.setPrimaryPhoto(selectedItem.id, photoId);
      await loadItems();
      toast.success("Primary photo updated");
    } catch (error) {
      console.error("Set primary failed:", error);
      toast.error("Failed to set primary photo");
    }
  };

  // View item details
  const handleView = (item: MenuItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // Modifier management
  const handleManageModifiers = (item: MenuItem) => {
    setSelectedItem(item);
    setShowModifierModal(true);
  };

  // Search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / (filters.limit || 12));
  const currentPage = filters.page || 1;

  return (
    <DashboardLayout>
      <TopBar
        title="Menu Items"
        subtitle="Manage your restaurant's menu"
        onAddClick={() => setShowCreateModal(true)}
        showViewToggle={false}
      />

      {/* Stats */}
      <MenuStatsCards
        totalCategories={categories.length}
        totalItems={totalCount}
        activeItems={activeItems}
        chefRecommendations={chefRecommendations}
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 px-1">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={filters.search || ""}
            onChange={handleSearch}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
          />
        </div>

        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <select
            value={filters.categoryId || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                categoryId: e.target.value || undefined,
                page: 1,
              })
            }
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as any, page: 1 })
            }
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="sold_out">Sold Out</option>
          </select>

          <select
            value={filters.sortBy || ""}
            onChange={(e) =>
              setFilters({ ...filters, sortBy: e.target.value as any })
            }
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">Sort By</option>
            <option value="createdAt">Date Created</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="popularity">Popularity</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadItems}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5" />
          All Menu Items ({totalCount})
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">Loading menu items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">No menu items found</p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="mt-4"
            >
              Create First Item
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onManagePhotos={handleManagePhotos}
                  onManageModifiers={handleManageModifiers}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, page: currentPage - 1 })
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() =>
                          setFilters({ ...filters, page: pageNum })
                        }
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                          currentPage === pageNum
                            ? "bg-slate-700 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, page: currentPage + 1 })
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <MenuItemFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        categories={categories}
        mode="create"
      />

      <MenuItemFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(undefined);
        }}
        onSubmit={handleUpdate}
        item={selectedItem}
        categories={categories}
        mode="edit"
      />

      {selectedItem && (
        <PhotoUpload
          isOpen={showPhotoModal}
          onClose={() => {
            setShowPhotoModal(false);
            setSelectedItem(undefined);
          }}
          item={items.find((i) => i.id === selectedItem.id) || selectedItem}
          onUpload={handlePhotoUpload}
          onDelete={handlePhotoDelete}
          onSetPrimary={handleSetPrimaryPhoto}
        />
      )}

      {/* Modifier Modal */}
      {selectedItem && (
        <MenuItemModifierModal
          isOpen={showModifierModal}
          onClose={() => {
            setShowModifierModal(false);
            setSelectedItem(undefined);
          }}
          item={selectedItem}
        />
      )}

      {/* Detail Modal */}
      <MenuItemDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedItem(undefined);
        }}
        item={selectedItem || null}
      />
    </DashboardLayout>
  );
}
