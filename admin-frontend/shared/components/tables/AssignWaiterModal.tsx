"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Select } from "@/shared/components/ui";
import type { Table, Waiter } from "@/shared/types/table";
import { tablesApi } from "@/shared/lib/api/tables";
import { User } from "lucide-react";

export interface AssignWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (waiterId: string) => Promise<void>;
  table: Table | undefined;
}

export const AssignWaiterModal: React.FC<AssignWaiterModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  table,
}) => {
  const [waiterId, setWaiterId] = useState<string>("");
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingWaiters, setLoadingWaiters] = useState(false);

  useEffect(() => {
    if (isOpen && table) {
      setWaiterId(table.waiter_id || "");
      loadWaiters();
    }
  }, [isOpen, table]);

  const loadWaiters = async () => {
    try {
      setLoadingWaiters(true);
      const data = await tablesApi.getWaiters();
      setWaiters(data);
    } catch (error) {
      console.error("Failed to load waiters:", error);
    } finally {
      setLoadingWaiters(false);
    }
  };

  const waiterOptions = [
    { value: "", label: "No waiter assigned" },
    ...waiters.map((waiter) => ({
      value: waiter.id || waiter.userId || "",
      label: waiter.full_name,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAssign(waiterId);
      onClose();
    } catch (error) {
      console.error("Failed to assign waiter:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Waiter to Table ${table?.tableNumber || ""}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Current Waiter</p>
            <p className="text-lg font-bold text-blue-700">
              {table?.waiter?.full_name || "None"}
            </p>
          </div>
        </div>

        <Select
          label="Select Staff Member"
          name="waiter_id"
          value={waiterId}
          onChange={(e) => setWaiterId(e.target.value)}
          options={waiterOptions}
          disabled={loadingWaiters}
        />

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Update Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
