'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Building2 } from 'lucide-react';
import type { Admin, CreateAdminDto, UpdateAdminDto } from '../../types/admin';

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAdminDto | UpdateAdminDto) => Promise<void>;
  admin?: Admin | null;
  isLoading?: boolean;
}

export const AdminFormModal: React.FC<AdminFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admin,
  isLoading = false,
}) => {
  const isEditing = !!admin;

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    restaurantId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (admin) {
      setFormData({
        email: admin.email || '',
        full_name: admin.full_name || '',
        password: '',
        restaurantId: admin.restaurantId || '',
      });
    } else {
      setFormData({
        email: '',
        full_name: '',
        password: '',
        restaurantId: '',
      });
    }
    setErrors({});
  }, [admin, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing) {
      const updateData: UpdateAdminDto = {};
      if (formData.email !== admin?.email) updateData.email = formData.email;
      if (formData.full_name !== admin?.full_name) updateData.full_name = formData.full_name;
      await onSubmit(updateData);
    } else {
      const createData: CreateAdminDto = {
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        restaurantId: formData.restaurantId || undefined,
      };
      await onSubmit(createData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-200/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md mx-4 p-2">
        <div className="bg-gray-50 rounded-[1.25rem] border border-gray-100 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">
              {isEditing ? 'Edit Admin' : 'Create Admin'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 ${
                    errors.full_name
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-slate-200 focus:border-slate-400'
                  }`}
                  placeholder="Enter full name"
                />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-slate-200 focus:border-slate-400'
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password (only for create) */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 ${
                      errors.password
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-slate-200 focus:border-slate-400'
                    }`}
                    placeholder="Enter password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Min 8 characters with uppercase, lowercase, and number
                </p>
              </div>
            )}

            {/* Restaurant ID (only for create) */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Restaurant ID (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.restaurantId}
                    onChange={(e) =>
                      setFormData({ ...formData, restaurantId: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
                    placeholder="Leave empty to auto-generate"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  A unique ID will be generated if left empty
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all bg-slate-200 hover:bg-slate-300 text-slate-800"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all bg-slate-700 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Admin'
                  : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
