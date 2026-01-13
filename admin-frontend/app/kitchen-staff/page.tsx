'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Plus, Filter } from 'lucide-react';
import { DashboardLayout } from '../../shared/components/layout';
import { KitchenStaffCard } from '../../shared/components/staff/KitchenStaffCard';
import { KitchenStaffFormModal } from '../../shared/components/staff/KitchenStaffFormModal';
import { KitchenStaffStatsCards } from '../../shared/components/staff/KitchenStaffStatsCards';
import { kitchenStaffApi } from '../../shared/lib/api/kitchen-staff';
import type {
  KitchenStaff,
  CreateKitchenStaffDto,
  UpdateKitchenStaffDto,
} from '../../shared/types/kitchen-staff';
import { useAuth } from '../../shared/components/auth/AuthContext';
import { toast } from 'react-hot-toast';

type StatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export default function KitchenStaffPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [staff, setStaff] = useState<KitchenStaff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<KitchenStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<KitchenStaff | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role?.toUpperCase() !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/');
      return;
    }
    fetchStaff();
  }, [user, router]);

  useEffect(() => {
    filterStaff();
  }, [staff, statusFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await kitchenStaffApi.getKitchenStaff();
      setStaff(data);
    } catch (error: any) {
      console.error('Error fetching kitchen staff:', error);
      toast.error(error.response?.data?.message || 'Failed to load kitchen staff');
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    if (statusFilter === 'ALL') {
      setFilteredStaff(staff.filter((s) => s.status !== 'DELETED'));
    } else {
      setFilteredStaff(staff.filter((s) => s.status === statusFilter));
    }
  };

  const handleCreate = async (data: CreateKitchenStaffDto) => {
    try {
      await kitchenStaffApi.createKitchenStaff(data);
      toast.success('Kitchen staff created successfully');
      await fetchStaff();
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error('Error creating kitchen staff:', error);
      throw error;
    }
  };

  const handleEdit = (staff: KitchenStaff) => {
    setSelectedStaff(staff);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: UpdateKitchenStaffDto) => {
    if (!selectedStaff) return;

    try {
      await kitchenStaffApi.updateKitchenStaff(selectedStaff.id, data);
      toast.success('Kitchen staff updated successfully');
      await fetchStaff();
      setIsEditModalOpen(false);
      setSelectedStaff(undefined);
    } catch (error: any) {
      console.error('Error updating kitchen staff:', error);
      throw error;
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await kitchenStaffApi.suspendKitchenStaff(id);
      toast.success('Status updated successfully');
      await fetchStaff();
    } catch (error: any) {
      console.error('Error suspending kitchen staff:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this kitchen staff? This action cannot be undone.')) {
      return;
    }

    try {
      await kitchenStaffApi.deleteKitchenStaff(id);
      toast.success('Kitchen staff deleted successfully');
      await fetchStaff();
    } catch (error: any) {
      console.error('Error deleting kitchen staff:', error);
      toast.error(error.response?.data?.message || 'Failed to delete kitchen staff');
    }
  };

  const stats = {
    total: staff.filter((s) => s.status !== 'DELETED').length,
    active: staff.filter((s) => s.status === 'ACTIVE').length,
    suspended: staff.filter((s) => s.status === 'SUSPENDED').length,
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 sm:p-3 rounded-xl">
              <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Kitchen Staff Management
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                Manage kitchen personnel
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02] transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>Add Kitchen Staff</span>
          </button>
        </div>
      </div>

      <div>
        {/* Stats */}
        <KitchenStaffStatsCards
          totalStaff={stats.total}
          activeStaff={stats.active}
          suspendedStaff={stats.suspended}
        />

        {/* Filters */}
        <div className="mt-8 bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">Filter by Status:</span>
            </div>
            <div className="flex gap-2">
              {(['ALL', 'ACTIVE', 'SUSPENDED', 'DELETED'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    statusFilter === status
                      ? 'bg-slate-700 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kitchen Staff Grid */}
        {loading ? (
          <div className="mt-8 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-700 border-r-transparent"></div>
            <p className="mt-4 text-sm font-semibold text-gray-500">Loading kitchen staff...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="mt-8 bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-12 text-center">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-500">No kitchen staff found</p>
            <p className="text-sm text-gray-400 mt-2">
              {statusFilter === 'ALL'
                ? 'Get started by adding your first kitchen staff member'
                : `No ${statusFilter.toLowerCase()} kitchen staff`}
            </p>
            {statusFilter === 'ALL' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Add Kitchen Staff
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((staffMember) => (
              <KitchenStaffCard
                key={staffMember.id}
                staff={staffMember}
                onEdit={handleEdit}
                onSuspend={handleSuspend}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <KitchenStaffFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Edit Modal */}
      <KitchenStaffFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStaff(undefined);
        }}
        onSubmit={handleUpdate}
        staff={selectedStaff}
        mode="edit"
      />
    </DashboardLayout>
  );
}
