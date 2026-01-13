'use client';

import React from 'react';
import { ChefHat, CheckCircle2, XCircle } from 'lucide-react';

interface KitchenStaffStatsCardsProps {
  totalStaff: number;
  activeStaff: number;
  suspendedStaff: number;
}

export const KitchenStaffStatsCards: React.FC<KitchenStaffStatsCardsProps> = ({
  totalStaff,
  activeStaff,
  suspendedStaff,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Total Kitchen Staff */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
              Total Kitchen Staff
            </p>
            <p className="text-3xl font-extrabold text-gray-900">{totalStaff}</p>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl">
            <ChefHat className="w-6 h-6 text-slate-700" />
          </div>
        </div>
      </div>

      {/* Active Staff */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
              Active Staff
            </p>
            <p className="text-3xl font-extrabold text-gray-900">{activeStaff}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-green-700" />
          </div>
        </div>
      </div>

      {/* Suspended Staff */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
              Suspended
            </p>
            <p className="text-3xl font-extrabold text-gray-900">{suspendedStaff}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-xl">
            <XCircle className="w-6 h-6 text-orange-700" />
          </div>
        </div>
      </div>
    </div>
  );
};
