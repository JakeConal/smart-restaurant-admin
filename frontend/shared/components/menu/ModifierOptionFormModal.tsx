"use client";

import React, { useState } from "react";
import { Modal, Button, Input, Select } from "@/shared/components/ui";
import type { CreateModifierOptionDto } from "@/shared/types/menu";

export interface ModifierOptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateModifierOptionDto) => Promise<void>;
  groupName: string;
}

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const ModifierOptionFormModal: React.FC<
  ModifierOptionFormModalProps
> = ({ isOpen, onClose, onSubmit, groupName }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateModifierOptionDto>({
    name: "",
    priceAdjustment: 0,
    status: "active",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Option name is required";
    }

    if (formData.priceAdjustment < 0) {
      newErrors.priceAdjustment = "Price adjustment cannot be negative";
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
      // Reset form
      setFormData({
        name: "",
        priceAdjustment: 0,
        status: "active",
      });
      setErrors({});
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to add modifier option" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Option to ${groupName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Option Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Small, Medium, Large, Extra Cheese"
          error={errors.name}
          required
        />

        <Input
          label="Price Adjustment"
          name="priceAdjustment"
          type="number"
          step="0.01"
          min="0"
          value={formData.priceAdjustment}
          onChange={handleChange}
          placeholder="0.00"
          error={errors.priceAdjustment}
        />

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
        />

        {errors.submit && (
          <div className="text-red-600 text-sm font-medium">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Add Option
          </Button>
        </div>
      </form>
    </Modal>
  );
};
