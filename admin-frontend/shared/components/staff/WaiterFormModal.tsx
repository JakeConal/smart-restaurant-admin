'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import type { Waiter, CreateWaiterDto, UpdateWaiterDto } from '../../types/waiter';
import { Button } from '../ui/Button';

interface WaiterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWaiterDto | UpdateWaiterDto) => Promise<void>;
  waiter?: Waiter;
  mode: 'create' | 'edit';
}

export const WaiterFormModal: React.FC<WaiterFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  waiter,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateWaiterDto>({
    email: '',
    full_name: '',
    password: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (isOpen && waiter && mode === 'edit') {
      setFormData({
        email: waiter.email,
        full_name: waiter.full_name,
        password: '',
        avatar_url: waiter.avatar_url || '',
      });
    } else if (isOpen && mode === 'create') {
      setFormData({
        email: '',
        full_name: '',
        password: '',
        avatar_url: '',
      });
    }
    setErrors({});
    setShowPassword(false);
  }, [isOpen, waiter, mode]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    } else if (formData.full_name.trim().length > 255) {
      newErrors.full_name = 'Name must be less than 255 characters';
    }

    // Password validation (required for create, optional for edit)
    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number';
      }
    }

    // Avatar URL validation (optional)
    if (formData.avatar_url && formData.avatar_url.trim()) {
      try {
        new URL(formData.avatar_url);
      } catch {
        newErrors.avatar_url = 'Invalid URL format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData: any = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        avatar_url: formData.avatar_url?.trim() || undefined,
      };

      // Only include password if provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      await onSubmit(submitData);
      onClose();
      setFormData({
        email: '',
        full_name: '',
        password: '',
        avatar_url: '',
      });
      setErrors({});
    } catch (error: any) {
      setErrors({
        submit: error.response?.data?.message || error.message || 'Failed to save waiter',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-200/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-2xl p-2">
        {/* Inner container with gray background */}
        <div className="bg-gray-50 rounded-[1.25rem] border border-gray-100 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">
              {mode === 'create' ? 'Add New Waiter' : 'Edit Waiter'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all ${
                  errors.email ? 'border-red-300' : 'border-slate-200'
                }`}
                placeholder="waiter@restaurant.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all ${
                  errors.full_name ? 'border-red-300' : 'border-slate-200'
                }`}
                placeholder="John Doe"
                disabled={loading}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.full_name}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password {mode === 'create' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all pr-12 ${
                    errors.password ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder={mode === 'edit' ? 'Leave blank to keep current' : '••••••••'}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.password}</p>
              )}
              {mode === 'create' && (
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              )}
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Avatar URL (Optional)
              </label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all ${
                  errors.avatar_url ? 'border-red-300' : 'border-slate-200'
                }`}
                placeholder="https://example.com/avatar.jpg"
                disabled={loading}
              />
              {errors.avatar_url && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.avatar_url}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs font-semibold text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{mode === 'create' ? 'Create Waiter' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
