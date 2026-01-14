'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/shared/components/auth/AuthContext';
import { SuperAdminLayout } from '@/shared/components/layout/SuperAdminLayout';
import {
  AdminCard,
  AdminFormModal,
  AdminStatsCards,
  ConfirmModal,
} from '@/shared/components/super-admin';
import { superAdminApi } from '@/shared/lib/api';
import type { Admin, CreateAdminDto, UpdateAdminDto } from '@/shared/types/admin';

type FilterStatus = 'ALL' | 'ACTIVE' | 'SUSPENDED';

export default function SuperAdminAdminsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user?.role?.toUpperCase() !== 'SUPER_ADMIN') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load admins
  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const data = await superAdminApi.getAdmins({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      setAdmins(data);
    } catch (error) {
      console.error('Failed to load admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (user?.role?.toUpperCase() === 'SUPER_ADMIN') {
      loadAdmins();
    }
  }, [user, loadAdmins]);

  // Stats
  const stats = {
    totalAdmins: admins.length,
    activeAdmins: admins.filter((a) => a.status === 'ACTIVE').length,
    suspendedAdmins: admins.filter((a) => a.status === 'SUSPENDED').length,
  };

  // Handlers
  const handleCreate = async (data: CreateAdminDto | UpdateAdminDto) => {
    try {
      setIsSubmitting(true);
      await superAdminApi.createAdmin(data as CreateAdminDto);
      toast.success('Admin created successfully');
      setShowCreateModal(false);
      loadAdmins();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create admin';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: CreateAdminDto | UpdateAdminDto) => {
    if (!selectedAdmin) return;
    try {
      setIsSubmitting(true);
      await superAdminApi.updateAdmin(selectedAdmin.id, data as UpdateAdminDto);
      toast.success('Admin updated successfully');
      setShowEditModal(false);
      setSelectedAdmin(null);
      loadAdmins();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update admin';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    try {
      setIsSubmitting(true);
      await superAdminApi.deleteAdmin(selectedAdmin.id);
      toast.success('Admin deleted successfully');
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      loadAdmins();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete admin';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    try {
      const result = await superAdminApi.toggleAdminStatus(admin.id);
      toast.success(
        `Admin ${result.status === 'ACTIVE' ? 'activated' : 'suspended'} successfully`
      );
      loadAdmins();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update status';
      toast.error(message);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role?.toUpperCase() === 'SUPER_ADMIN') {
        loadAdmins();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Access denied
  if (user.role?.toUpperCase() !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <SuperAdminLayout>
      {/* Header */}
      <div className="bg-white rounded-[1.75rem] p-6 shadow-md border border-slate-200/10 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Admin Management</h1>
            <p className="text-gray-500 font-medium mt-1">
              Manage all restaurant admin accounts
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <AdminStatsCards {...stats} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[1.75rem] p-5 shadow-md border border-slate-200/10 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
              placeholder="Search by name or email..."
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['ALL', 'ACTIVE', 'SUSPENDED'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-slate-700 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[1.75rem] p-6 shadow-md animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded-xl mb-4" />
              <div className="h-10 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-[1.75rem] p-12 shadow-md border border-slate-200/10 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No admins found</h3>
          <p className="text-gray-500 text-sm mb-6">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first admin account'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Admin</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {admins.map((admin) => (
            <AdminCard
              key={admin.id}
              admin={admin}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AdminFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={isSubmitting}
      />

      {/* Edit Modal */}
      <AdminFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAdmin(null);
        }}
        onSubmit={handleUpdate}
        admin={selectedAdmin}
        isLoading={isSubmitting}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAdmin(null);
        }}
        onConfirm={handleDelete}
        title="Delete Admin"
        message={`Are you sure you want to delete "${selectedAdmin?.full_name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isSubmitting}
        variant="danger"
      />
    </SuperAdminLayout>
  );
}
