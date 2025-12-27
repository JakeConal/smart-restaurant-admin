'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, Badge } from '@/shared/components/ui';
import { MoreHorizontal, Crown, Edit2, Trash2 } from 'lucide-react';
import type { Table } from '@/shared/types/table';

export interface TableCardProps {
  table: Table;
  onShowQR: (table: Table) => void;
  onEdit: (table: Table) => void;
  onDelete: (table: Table) => void;
  onToggleStatus: (table: Table) => void;
}

export const TableCard: React.FC<TableCardProps> = ({ 
  table, 
  onShowQR, 
  onEdit, 
  onDelete,
  onToggleStatus 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isVIP = table.location?.toLowerCase().includes('vip');
  const isActive = table.status === 'active';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <Card
      variant={isVIP ? 'vip' : 'default'}
      className={`p-6 flex flex-col gap-4 group cursor-pointer relative overflow-visible ${
        !isActive ? 'opacity-75 hover:opacity-100' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {table.tableNumber}
            {isVIP && <Crown className="w-4 h-4 text-orange-500 fill-orange-500" />}
          </h4>
          <span className="text-gray-400 text-sm font-medium">{table.location || 'No location'}</span>
        </div>
        <Badge 
          variant={isActive ? 'active' : 'inactive'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(table);
          }}
        >
          {table.status}
        </Badge>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 my-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-bold uppercase">Seats</span>
          <span className={`text-lg font-bold ${!isActive ? 'text-gray-500' : ''}`}>
            {table.capacity}
          </span>
        </div>
        <div className="h-8 w-px bg-gray-100"></div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-bold uppercase">QR Status</span>
          <span className={`text-lg font-bold ${!isActive ? 'text-gray-500' : ''}`}>
            {table.qrToken ? '✓' : '—'}
          </span>
        </div>
      </div>

      {/* Description */}
      {table.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{table.description}</p>
      )}

      {/* Actions */}
      <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(table);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            isActive 
              ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
        
        {isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowQR(table);
            }}
            className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            Show QR
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`px-3 h-full rounded-xl transition-colors ${
              showMenu ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 transition-all">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onEdit(table);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </div>
                Edit Table
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(table);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
