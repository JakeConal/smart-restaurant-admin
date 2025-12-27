"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout, TopBar } from "@/shared/components/layout";
import {
  StatsCards,
  TableCard,
  TableFormModal,
  QRCodeModal,
  TablesGridSkeleton,
} from "@/shared/components/tables";
import { Button, useToast } from "@/shared/components/ui";
import { Download, RefreshCw } from "lucide-react";
import type {
  Table,
  CreateTableDto,
  UpdateTableDto,
  TableFilters,
} from "@/shared/types/table";
import { tablesApi } from "@/shared/lib/api/tables";
import { useAuth } from "@/shared/components/auth/AuthContext";

export default function TablesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TableFilters>({});

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | undefined>();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/admin/login");
    } else if (!isLoading && user) {
      loadTables();
    }
  }, [user, isLoading, router]);

  // Stats
  const totalTables = tables.length;
  const activeTables = (tables || []).filter(
    (t) => t.status === "active",
  ).length;
  const qrValidPercentage =
    totalTables > 0
      ? Math.round(
          ((tables || []).filter((t) => t.qrToken).length / totalTables) * 100,
        )
      : 0;

  // Load tables
  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await tablesApi.getTables(filters);
      setTables(data || []);
    } catch (error) {
      console.error("Failed to load tables:", error);
      toast.error("Failed to load tables");
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      loadTables();
    }
  }, [filters, isLoading, user]);

  // Create table
  const handleCreate = async (data: CreateTableDto | UpdateTableDto) => {
    await tablesApi.createTable(data as CreateTableDto);
    await loadTables();
    setShowCreateModal(false);
  };

  // Update table
  const handleUpdate = async (data: UpdateTableDto) => {
    if (!selectedTable) return;
    await tablesApi.updateTable(selectedTable.id, data);
    await loadTables();
    setShowEditModal(false);
  };

  // Toggle table status
  const handleToggleStatus = async (table: Table) => {
    const newStatus = table.status === "active" ? "inactive" : "active";

    if (newStatus === "inactive") {
      if (
        !confirm(`Are you sure you want to deactivate ${table.tableNumber}?`)
      ) {
        return;
      }
    }

    try {
      await tablesApi.updateTableStatus(table.id, newStatus);
      await loadTables();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update table status");
    }
  };

  // Show QR modal
  const handleShowQR = (table: Table) => {
    setSelectedTable(table);
    setShowQRModal(true);
  };

  // Edit table
  const handleEdit = (table: Table) => {
    setSelectedTable(table);
    setShowEditModal(true);
  };

  // Delete table
  const handleDelete = async (table: Table) => {
    if (
      !confirm(
        `Are you sure you want to delete table ${table.tableNumber}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await tablesApi.deleteTable(table.id);
      await loadTables();
    } catch (error) {
      console.error("Failed to delete table:", error);
      toast.error("Failed to delete table");
    }
  };

  // Download all QR codes
  const handleDownloadAllPDF = async () => {
    try {
      await tablesApi.downloadAllQRPDF();
    } catch (error) {
      console.error("Failed to download all QR codes:", error);
      toast.error("Failed to download QR codes");
    }
  };

  const handleDownloadAllZIP = async () => {
    try {
      await tablesApi.downloadAllQRZIP();
    } catch (error) {
      console.error("Failed to download all QR codes:", error);
      toast.error("Failed to download QR codes");
    }
  };

  // Regenerate all QR codes
  const handleRegenerateAll = async () => {
    if (
      !confirm(
        "Are you sure you want to regenerate ALL QR codes? All existing codes will become invalid.",
      )
    ) {
      return;
    }

    try {
      const result = await tablesApi.regenerateAllQR();
      await loadTables();
      toast.success(`Successfully regenerated ${result.count} QR codes!`);
    } catch (error) {
      console.error("Failed to regenerate QR codes:", error);
      toast.error("Failed to regenerate QR codes");
    }
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Table Layout"
        subtitle="First Floor • Main Hall"
        onAddClick={() => setShowCreateModal(true)}
        showViewToggle
      />

      {/* Stats */}
      <StatsCards
        totalTables={totalTables}
        activeTables={activeTables}
        qrValidPercentage={qrValidPercentage}
        onManageQR={handleRegenerateAll}
      />

      {/* Filters & Actions */}
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-2">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as any })
            }
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={filters.sortBy || ""}
            onChange={(e) =>
              setFilters({ ...filters, sortBy: e.target.value as any })
            }
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <option value="">Sort By</option>
            <option value="tableNumber">Table Number</option>
            <option value="capacity">Capacity</option>
            <option value="createdAt">Date Created</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadAllPDF}
            icon={Download}
          >
            Download All (PDF)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadAllZIP}
            icon={Download}
          >
            Download All (ZIP)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTables}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">
          All Tables
        </h3>

        {loading ? (
          <TablesGridSkeleton />
        ) : tables.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">No tables found</p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="mt-4"
            >
              Create First Table
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onShowQR={handleShowQR}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TableFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      <TableFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTable(undefined);
        }}
        onSubmit={handleUpdate}
        table={selectedTable}
        mode="edit"
      />

      {selectedTable && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedTable(undefined);
          }}
          table={tables.find((t) => t.id === selectedTable.id) || selectedTable}
          onRegenerate={loadTables}
        />
      )}
    </DashboardLayout>
  );
}
