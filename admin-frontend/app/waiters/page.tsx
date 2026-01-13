'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users2, Plus, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../../shared/components/layout';
import { WaiterCard } from '../../shared/components/staff/WaiterCard';
import { WaiterFormModal } from '../../shared/components/staff/WaiterFormModal';
import { WaiterStatsCards } from '../../shared/components/staff/WaiterStatsCards';
import { Button } from '../../shared/components/ui/Button';
import { useToast } from '../../shared/components/ui/Toast';
import { useAuth } from '../../shared/components/auth/AuthContext';
import { waitersApi } from '../../shared/lib/api/waiters';
import type { Waiter, CreateWaiterDto, UpdateWaiterDto } from '../../shared/types/waiter';

export default function WaitersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [filteredWaiters, setFilteredWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | undefined>();

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user?.role?.toUpperCase() !== 'ADMIN') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load waiters
  const loadWaiters = async () => {
    try {
      setIsLoading(true);
      const data = await waitersApi.getWaiters();
      setWaiters(data);
    } catch (error: any) {
      console.error('Failed to load waiters:', error);
      if (isLoading) {
        toast.error('Failed to load waiters');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadWaiters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Filter waiters by status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredWaiters(waiters);
    } else {
      setFilteredWaiters(waiters.filter((w) => w.status === statusFilter.toUpperCase()));
    }
  }, [statusFilter, waiters]);

  // CRUD handlers
  const handleCreate = async (data: CreateWaiterDto) => {
    try {
      await waitersApi.createWaiter(data);
      toast.success('Waiter created successfully');
      await loadWaiters();
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('Failed to create waiter:', error);
      throw error;
    }
  };

  const handleUpdate = async (data: UpdateWaiterDto) => {
    if (!selectedWaiter) return;
    
    try {
      await waitersApi.updateWaiter(selectedWaiter.id, data);
      toast.success('Waiter updated successfully');
      await loadWaiters();
      setShowEditModal(false);
      setSelectedWaiter(undefined);
    } catch (error: any) {
      console.error('Failed to update waiter:', error);
      throw error;
    }
  };

  const handleDelete = async (waiter: Waiter) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${waiter.full_name}? This will permanently remove their access to the system.`
    );

    if (!confirmed) return;

    try {
      await waitersApi.deleteWaiter(waiter.id);
      toast.success('Waiter deleted successfully');
      await loadWaiters();
    } catch (error: any) {
      console.error('Failed to delete waiter:', error);
      toast.error('Failed to delete waiter');
    }
  };

  const handleSuspend = async (waiter: Waiter) => {
    const action = waiter.status === 'SUSPENDED' ? 'activate' : 'suspend';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${waiter.full_name}?`
    );

    if (!confirmed) return;

    try {
      await waitersApi.suspendWaiter(waiter.id);
      toast.success(`Waiter ${action}d successfully`);
      await loadWaiters();
    } catch (error: any) {
      console.error(`Failed to ${action} waiter:`, error);
      toast.error(`Failed to ${action} waiter`);
    }
  };

  const handleEdit = (waiter: Waiter) => {
    setSelectedWaiter(waiter);
    setShowEditModal(true);
  };

  const handleRefresh = async () => {
    await loadWaiters();
  };

  // Calculate stats
  const totalWaiters = waiters.length;
  const activeWaiters = waiters.filter((w) => w.status === 'ACTIVE').length;
  const suspendedWaiters = waiters.filter((w) => w.status === 'SUSPENDED').length;

  if (authLoading) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 sm:p-3 rounded-xl">
              <Users2 className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Waiter Management
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                Manage restaurant staff accounts
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleRefresh}
              variant="secondary"
              disabled={isLoading}
              className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Waiter</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <WaiterStatsCards
        totalWaiters={totalWaiters}
        activeWaiters={activeWaiters}
        suspendedWaiters={suspendedWaiters}
      />

      {/* Filters */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <label className="text-sm font-bold text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all"
          >
            <option value="all">All Waiters</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
            <option value="deleted">Deleted Only</option>
          </select>
          <span className="text-sm font-medium text-gray-500">
            Showing {filteredWaiters.length} of {totalWaiters} waiters
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-slate-700 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 text-sm font-medium">Loading waiters...</p>
            </div>
          </div>
        ) : filteredWaiters.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users2 className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No waiters yet' : `No ${statusFilter} waiters`}
            </h2>
            <p className="text-gray-500 text-sm font-medium mb-6">
              {statusFilter === 'all'
                ? 'Get started by adding your first waiter'
                : 'Try adjusting your filters'}
            </p>
            {statusFilter === 'all' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Waiter</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWaiters.map((waiter) => (
              <WaiterCard
                key={waiter.id}
                waiter={waiter}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSuspend={handleSuspend}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <WaiterFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      <WaiterFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedWaiter(undefined);
        }}
        onSubmit={handleUpdate}
        waiter={selectedWaiter}
        mode="edit"
      />
    </DashboardLayout>
  );
}
