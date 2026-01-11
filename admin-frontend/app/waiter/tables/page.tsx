'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, RefreshCw, Users, CheckCircle2, Clock } from 'lucide-react';
import { DashboardLayout } from '../../../shared/components/layout';
import { Button } from '../../../shared/components/ui/Button';
import { useToast } from '../../../shared/components/ui/Toast';
import { getMyAssignedTables } from '../../../shared/lib/api/waiter';
import type { Table } from '../../../shared/types/table';

export default function WaiterTablesPage() {
  const toast = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTables = async () => {
    try {
      const data = await getMyAssignedTables();
      setTables(data);
    } catch (error) {
      console.error('Failed to load tables:', error);
      if (isLoading) {
        toast.error('Failed to load tables');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadTables();
  };

  // Calculate stats
  const totalTables = tables.length;
  const occupiedTables = tables.filter((t) => t.occupancyStatus === 'occupied').length;
  const availableTables = tables.filter((t) => t.occupancyStatus === 'available').length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 sm:p-3 rounded-xl">
              <LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                My Tables
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                {totalTables} table{totalTables !== 1 ? 's' : ''} assigned to you
              </p>
            </div>
          </div>

          {/* Refresh button */}
          <Button
            onClick={handleRefresh}
            variant="secondary"
            disabled={isLoading}
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-slate-700 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 text-sm font-medium">Loading tables...</p>
            </div>
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              You have not been assigned a table yet.
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              Please contact your manager to get tables assigned to you
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {/* Total Tables */}
              <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
                      Total Tables
                    </p>
                    <p className="text-3xl font-extrabold text-gray-900">{totalTables}</p>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-slate-700" />
                  </div>
                </div>
              </div>

              {/* Occupied Tables */}
              <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
                      Occupied
                    </p>
                    <p className="text-3xl font-extrabold text-gray-900">{occupiedTables}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Available Tables */}
              <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
                      Available
                    </p>
                    <p className="text-3xl font-extrabold text-gray-900">{availableTables}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// Simple TableCard component for waiter view
function TableCard({ table }: { table: Table }) {
  const getOccupancyColor = () => {
    switch (table.occupancyStatus) {
      case 'occupied':
        return 'bg-orange-100 text-orange-700';
      case 'reserved':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  const getOccupancyLabel = () => {
    switch (table.occupancyStatus) {
      case 'occupied':
        return 'Occupied';
      case 'reserved':
        return 'Reserved';
      default:
        return 'Available';
    }
  };

  return (
    <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.005] transition-all duration-300 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xl font-bold text-gray-900">
            {table.tableNumber}
          </h4>
          <span className="text-gray-500 text-sm font-medium">
            {table.location || 'No location'}
          </span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${getOccupancyColor()}`}>
          {getOccupancyLabel()}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 my-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">
            Seats
          </span>
          <span className="text-lg font-bold text-gray-900">
            {table.capacity}
          </span>
        </div>
        <div className="h-8 w-px bg-slate-100"></div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">
            Status
          </span>
          <span className="text-lg font-bold text-gray-900">
            {table.status === 'active' ? '✓' : '—'}
          </span>
        </div>
      </div>

      {/* Description */}
      {table.description && (
        <p className="text-sm text-gray-500 line-clamp-2 font-medium">
          {table.description}
        </p>
      )}
    </div>
  );
}
