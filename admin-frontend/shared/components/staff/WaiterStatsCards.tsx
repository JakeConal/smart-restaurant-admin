'use client';

import React from 'react';
import { Users2, CheckCircle2, XCircle } from 'lucide-react';

interface WaiterStatsCardsProps {
  totalWaiters: number;
  activeWaiters: number;
  suspendedWaiters: number;
}

export const WaiterStatsCards: React.FC<WaiterStatsCardsProps> = ({
  totalWaiters,
  activeWaiters,
  suspendedWaiters,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Total Waiters */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
              Total Waiters
            </p>
            <p className="text-3xl font-extrabold text-gray-900">{totalWaiters}</p>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl">
            <Users2 className="w-6 h-6 text-slate-700" />
          </div>
        </div>
      </div>

      {/* Active Waiters */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
              Active Waiters
            </p>
            <p className="text-3xl font-extrabold text-gray-900">{activeWaiters}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-green-700" />
          </div>
        </div>
      </div>

      {/* Suspended Waiters */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
              Suspended
            </p>
            <p className="text-3xl font-extrabold text-gray-900">{suspendedWaiters}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-xl">
            <XCircle className="w-6 h-6 text-orange-700" />
          </div>
        </div>
      </div>
    </div>
  );
};
