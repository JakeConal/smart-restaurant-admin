"use client";

import React, { useState } from "react";
import { Modal, Button, Input, Select } from "@/shared/components/ui";
import { Plus, Trash2 } from "lucide-react";
import type {
  ModifierGroup,
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  ModifierOption,
  CreateModifierOptionDto,
} from "@/shared/types/menu";

export interface ModifierGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    groupData: CreateModifierGroupDto | UpdateModifierGroupDto,
    options?: CreateModifierOptionDto[],
  ) => Promise<void>;
  group?: ModifierGroup;
  mode: "create" | "edit";
}

const selectionTypeOptions = [
  { value: "single", label: "Single Selection (Radio)" },
  { value: "multiple", label: "Multiple Selection (Checkbox)" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const ModifierGroupFormModal: React.FC<ModifierGroupFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  group,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateModifierGroupDto>({
    name: group?.name || "",
    selectionType: group?.selectionType || "single",
    isRequired: group?.isRequired || false,
    minSelections: group?.minSelections || 0,
    maxSelections: group?.maxSelections || 0,
    displayOrder: group?.displayOrder || 0,
    status: group?.status || "active",
  });

  const [options, setOptions] = useState<CreateModifierOptionDto[]>(
    group?.options?.map((opt) => ({
      name: opt.name,
      priceAdjustment: opt.priceAdjustment,
      status: opt.status,
    })) || [],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : ["minSelections", "maxSelections", "displayOrder"].includes(name)
            ? parseInt(value) || 0
            : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const addOption = () => {
    setOptions([
      ...options,
      { name: "", priceAdjustment: 0, status: "active" },
    ]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (
    index: number,
    field: keyof CreateModifierOptionDto,
    value: any,
  ) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
    }

    if (
      formData.isRequired &&
      formData.selectionType === "single" &&
      formData.minSelections !== 1
    ) {
      formData.minSelections = 1;
      formData.maxSelections = 1;
    }

    if (formData.selectionType === "multiple") {
      const maxSel = formData.maxSelections ?? 0;
      const minSel = formData.minSelections ?? 0;
      if (maxSel > 0 && minSel > maxSel) {
        newErrors.minSelections = "Min selections cannot exceed max selections";
      }
    }

    options.forEach((opt, i) => {
      if (!opt.name.trim()) {
        newErrors[`option_${i}`] = "Option name is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData, mode === "create" ? options : undefined);
      onClose();
      // Reset form
      setFormData({
        name: "",
        selectionType: "single",
        isRequired: false,
        minSelections: 0,
        maxSelections: 0,
        displayOrder: 0,
        status: "active",
      });
      setOptions([]);
      setErrors({});
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to save modifier group" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "create" ? "Create Modifier Group" : "Edit Modifier Group"
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Size, Toppings, Spice Level"
          error={errors.name}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Selection Type"
            name="selectionType"
            value={formData.selectionType}
            onChange={handleChange}
            options={selectionTypeOptions}
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Display Order"
            name="displayOrder"
            type="number"
            min={0}
            value={formData.displayOrder}
            onChange={handleChange}
          />

          <Input
            label="Min Selections"
            name="minSelections"
            type="number"
            min={0}
            value={formData.minSelections}
            onChange={handleChange}
            error={errors.minSelections}
          />

          <Input
            label="Max Selections"
            name="maxSelections"
            type="number"
            min={0}
            value={formData.maxSelections}
            onChange={handleChange}
            placeholder={
              formData.selectionType === "single" ? "1" : "Unlimited"
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRequired"
            name="isRequired"
            checked={formData.isRequired}
            onChange={handleChange}
            className="w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
          />
          <label
            htmlFor="isRequired"
            className="text-sm font-bold text-gray-700 cursor-pointer"
          >
            Required (guests must make a selection)
          </label>
        </div>

        {/* Options Section */}
        {mode === "create" && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-gray-900">
                Modifier Options
              </h4>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addOption}
                icon={Plus}
              >
                Add Option
              </Button>
            </div>

            {options.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No options added yet. Click "Add Option" to create choices.
              </p>
            ) : (
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      label={index === 0 ? "Option Name" : ""}
                      value={option.name}
                      onChange={(e) =>
                        updateOption(index, "name", e.target.value)
                      }
                      placeholder="e.g., Small, Medium, Large"
                      error={errors[`option_${index}`]}
                      className="flex-1"
                    />
                    <Input
                      label={index === 0 ? "Price Adjustment ($)" : ""}
                      type="number"
                      step="0.01"
                      min={0}
                      value={option.priceAdjustment}
                      onChange={(e) =>
                        updateOption(
                          index,
                          "priceAdjustment",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                      className="w-32"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className={`p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors ${
                        index === 0 ? "mt-6" : ""
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
            {mode === "create" ? "Create Group" : "Save Changes"}
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
