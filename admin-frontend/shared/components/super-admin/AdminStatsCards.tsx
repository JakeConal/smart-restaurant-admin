'use client';

import React from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';

interface AdminStatsCardsProps {
  totalAdmins: number;
  activeAdmins: number;
  suspendedAdmins: number;
}

export const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({
  totalAdmins,
  activeAdmins,
  suspendedAdmins,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-3 rounded-xl">
            <Users className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Total Admins
            </p>
            <p className="text-2xl font-extrabold text-gray-900">{totalAdmins}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Active
            </p>
            <p className="text-2xl font-extrabold text-green-600">{activeAdmins}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-xl">
            <UserX className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Suspended
            </p>
            <p className="text-2xl font-extrabold text-orange-600">{suspendedAdmins}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
