"use client";

import React, { useState } from "react";
import { Modal, Button, Input, Select } from "@/shared/components/ui";
import type {
  MenuCategory,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from "@/shared/types/menu";

export interface MenuCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateMenuCategoryDto | UpdateMenuCategoryDto,
  ) => Promise<void>;
  category?: MenuCategory;
  mode: "create" | "edit";
}

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const MenuCategoryFormModal: React.FC<MenuCategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateMenuCategoryDto>({
    name: category?.name || "",
    description: category?.description || "",
    displayOrder: category?.displayOrder || 0,
    status: category?.status || "active",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "displayOrder" ? parseInt(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.length < 2 || formData.name.length > 50) {
      newErrors.name = "Name must be between 2 and 50 characters";
    }

    if ((formData.displayOrder ?? 0) < 0) {
      newErrors.displayOrder = "Display order must be non-negative";
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
        name: "",
        description: "",
        displayOrder: 0,
        status: "active",
      });
      setErrors({});
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to save category" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create New Category" : "Edit Category"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Appetizers, Main Courses"
          error={errors.name}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Display Order"
            name="displayOrder"
            type="number"
            min={0}
            value={formData.displayOrder}
            onChange={handleChange}
            error={errors.displayOrder}
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
            placeholder="Brief description of this category..."
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all resize-none"
          />
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
            {mode === "create" ? "Create Category" : "Save Changes"}
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
