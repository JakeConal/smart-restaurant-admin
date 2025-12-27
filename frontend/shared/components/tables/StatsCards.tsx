'use client';

import React from 'react';
import { Card } from '@/shared/components/ui';
import { Flame, Zap, QrCode } from 'lucide-react';

export interface StatsCardsProps {
  totalTables: number;
  activeTables: number;
  qrValidPercentage: number;
  onManageQR?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalTables,
  activeTables,
  qrValidPercentage,
  onManageQR,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 shrink-0">
      {/* Total Tables */}
      <Card className="p-5 flex flex-col justify-between h-32">
        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
          <Flame className="w-4 h-4" />
        </div>
        <div>
          <span className="text-2xl font-bold block">{totalTables}</span>
          <span className="text-gray-400 text-sm font-semibold">Total Tables</span>
        </div>
      </Card>

      {/* Active Tables */}
      <Card className="p-5 flex flex-col justify-between h-32">
        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <span className="text-2xl font-bold block">{activeTables}</span>
          <span className="text-gray-400 text-sm font-semibold">Active Now</span>
        </div>
      </Card>

      {/* QR Status */}
      <Card
        variant="dark"
        className="p-5 flex flex-col justify-between h-32 md:col-span-2"
        hover={false}
      >
        <div className="flex justify-between items-start">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">
            System Status
          </span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <span className="text-2xl font-bold block">{qrValidPercentage}%</span>
            <span className="text-white/70 text-sm font-semibold">QR Tokens Valid</span>
          </div>
          {onManageQR && (
            <button
              onClick={onManageQR}
              className="bg-white text-slate-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-ivory-100 transition-colors"
            >
              Manage
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};
