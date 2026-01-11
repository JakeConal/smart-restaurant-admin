'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '@/shared/components/ui';
import type { Table, CreateTableDto, UpdateTableDto, Waiter } from '@/shared/types/table';
import { tablesApi } from '@/shared/lib/api/tables';

export interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTableDto | UpdateTableDto) => Promise<void>;
  table?: Table;
  mode: 'create' | 'edit';
}

const locationOptions = [
  { value: '', label: 'Select location' },
  { value: 'Indoor', label: 'Indoor' },
  { value: 'Outdoor', label: 'Outdoor' },
  { value: 'Patio', label: 'Patio' },
  { value: 'VIP Room', label: 'VIP Room' },
  { value: 'Bar Area', label: 'Bar Area' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const TableFormModal: React.FC<TableFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  table,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loadingWaiters, setLoadingWaiters] = useState(false);
  
  const [formData, setFormData] = useState<CreateTableDto>({
    tableNumber: table?.tableNumber || '',
    capacity: table?.capacity || 4,
    location: table?.location || '',
    description: table?.description || '',
    status: table?.status || 'active',
    waiter_id: table?.waiter_id || '',
  });

  // Load waiters when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWaiters();
    }
  }, [isOpen]);

  const loadWaiters = async () => {
    try {
      setLoadingWaiters(true);
      const data = await tablesApi.getWaiters();
      setWaiters(data);
    } catch (error) {
      console.error('Failed to load waiters:', error);
    } finally {
      setLoadingWaiters(false);
    }
  };

  const waiterOptions = [
    { value: '', label: 'No waiter assigned' },
    ...waiters.map((waiter) => ({
      value: waiter.id,
      label: waiter.full_name,
    })),
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required';
    }

    if (!formData.capacity || formData.capacity < 1 || formData.capacity > 20) {
      newErrors.capacity = 'Capacity must be between 1 and 20';
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
        tableNumber: '',
        capacity: 4,
        location: '',
        description: '',
        status: 'active',
        waiter_id: '',
      });
      setErrors({});
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save table' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Table' : 'Edit Table'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Table Number"
            name="tableNumber"
            value={formData.tableNumber}
            onChange={handleChange}
            placeholder="e.g., Table 01, VIP 01"
            error={errors.tableNumber}
            required
          />

          <Input
            label="Capacity (Seats)"
            name="capacity"
            type="number"
            min={1}
            max={20}
            value={formData.capacity}
            onChange={handleChange}
            error={errors.capacity}
            required
          />
        </div>

        <Select
          label="Location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          options={locationOptions}
        />

        <Select
          label="Assigned Waiter"
          name="waiter_id"
          value={formData.waiter_id || ''}
          onChange={handleChange}
          options={waiterOptions}
          disabled={loadingWaiters}
        />

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
        />

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add any additional notes..."
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
          <Button type="submit" variant="primary" loading={loading} className="flex-1">
            {mode === 'create' ? 'Create Table' : 'Save Changes'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
