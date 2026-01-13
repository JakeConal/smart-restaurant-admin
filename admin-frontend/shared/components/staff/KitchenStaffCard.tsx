'use client';

import React, { useState } from 'react';
import { User, Mail, ChefHat, MoreVertical, Edit2, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import type { KitchenStaff } from '../../types/kitchen-staff';

interface KitchenStaffCardProps {
  staff: KitchenStaff;
  onEdit: (staff: KitchenStaff) => void;
  onDelete: (staff: KitchenStaff) => void;
  onSuspend: (staff: KitchenStaff) => void;
}

export const KitchenStaffCard: React.FC<KitchenStaffCardProps> = ({
  staff,
  onEdit,
  onDelete,
  onSuspend,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadge = () => {
    switch (staff.status) {
      case 'ACTIVE':
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-extrabold uppercase tracking-wide">
            Active
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-extrabold uppercase tracking-wide">
            Suspended
          </span>
        );
      case 'DELETED':
        return (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-extrabold uppercase tracking-wide">
            Deleted
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.005] transition-all duration-300 p-6 flex flex-col gap-4 group relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-slate-700" />
          </div>

          {/* Name & Email */}
          <div>
            <h4 className="text-xl font-bold text-gray-900">{staff.full_name}</h4>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
              <Mail className="w-3.5 h-3.5" />
              <span>{staff.email}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div>{getStatusBadge()}</div>
      </div>



      {/* Actions */}
      <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity relative">
        {/* Edit Button */}
        <button
          onClick={() => onEdit(staff)}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-200 hover:bg-slate-300 text-slate-800"
          disabled={staff.status === 'DELETED'}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </div>
        </button>

        {/* More Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-slate-700" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                {staff.status !== 'DELETED' && (
                  <button
                    onClick={() => {
                      onSuspend(staff);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    {staff.status === 'SUSPENDED' ? (
                      <>
                        <PlayCircle className="w-4 h-4 text-green-600" />
                        <span>Activate</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-4 h-4 text-orange-600" />
                        <span>Suspend</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    onDelete(staff);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  disabled={staff.status === 'DELETED'}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
