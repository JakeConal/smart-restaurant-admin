"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Select } from "@/shared/components/ui";
import type {
  MenuItem,
  MenuCategory,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from "@/shared/types/menu";

export interface MenuItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMenuItemDto | UpdateMenuItemDto) => Promise<void>;
  item?: MenuItem;
  categories: MenuCategory[];
  mode: "create" | "edit";
}

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
  { value: "sold_out", label: "Sold Out" },
];

export const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  categories,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateMenuItemDto>({
    categoryId: item?.categoryId || "",
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || 0,
    prepTimeMinutes: item?.prepTimeMinutes || 0,
    status: item?.status || "available",
    isChefRecommended: item?.isChefRecommended || false,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || "",
        price: item.price,
        prepTimeMinutes: item.prepTimeMinutes || 0,
        status: item.status,
        isChefRecommended: item.isChefRecommended,
      });
    }
  }, [item]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "price"
            ? parseFloat(value) || 0
            : name === "prepTimeMinutes"
              ? parseInt(value) || 0
              : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Item name is required";
    } else if (formData.name.length < 2 || formData.name.length > 80) {
      newErrors.name = "Name must be between 2 and 80 characters";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    if (formData.price <= 0 || formData.price > 999999) {
      newErrors.price = "Price must be between 0.01 and 999,999";
    }

    if (
      (formData.prepTimeMinutes ?? 0) < 0 ||
      (formData.prepTimeMinutes ?? 0) > 240
    ) {
      newErrors.prepTimeMinutes = "Prep time must be between 0 and 240 minutes";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        categoryId: "",
        name: "",
        description: "",
        price: 0,
        prepTimeMinutes: 0,
        status: "available",
        isChefRecommended: false,
      });
      setErrors({});
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to save menu item" });
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: "", label: "Select category" },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create New Menu Item" : "Edit Menu Item"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Item Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Margherita Pizza"
            error={errors.name}
            required
          />

          <Select
            label="Category"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            options={categoryOptions}
            error={errors.categoryId}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Price ($)"
            name="price"
            type="number"
            step="0.01"
            min={0.01}
            max={999999}
            value={formData.price}
            onChange={handleChange}
            error={errors.price}
            required
          />

          <Input
            label="Prep Time (min)"
            name="prepTimeMinutes"
            type="number"
            min={0}
            max={240}
            value={formData.prepTimeMinutes}
            onChange={handleChange}
            error={errors.prepTimeMinutes}
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your dish..."
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isChefRecommended"
            name="isChefRecommended"
            checked={formData.isChefRecommended}
            onChange={handleChange}
            className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
          />
          <label
            htmlFor="isChefRecommended"
            className="text-sm font-bold text-gray-700 cursor-pointer"
          >
            Chef's Recommendation 👨‍🍳
          </label>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1"
          >
            {mode === "create" ? "Create Item" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
