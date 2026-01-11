'use client';

import React from 'react';
import { Clock, ShoppingBag, AlertCircle, User } from 'lucide-react';
import type { Order } from '../../types/order';

interface EscalatedOrderCardProps {
  order: Order;
  onClick: () => void;
}

export function EscalatedOrderCard({ order, onClick }: EscalatedOrderCardProps) {
  const getEscalatedMinutes = () => {
    if (!order.escalatedAt) return 0;
    const now = new Date().getTime();
    const escalated = new Date(order.escalatedAt).getTime();
    return Math.floor((now - escalated) / 60000);
  };

  const getTotalMinutes = () => {
    const now = new Date().getTime();
    const created = new Date(order.createdAt).getTime();
    return Math.floor((now - created) / 60000);
  };

  const escalatedMinutes = getEscalatedMinutes();
  const totalMinutes = getTotalMinutes();

  return (
    <div
      className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.005] transition-all duration-300 p-6 flex flex-col cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2.5 rounded-2xl border border-red-100/50">
            <ShoppingBag className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Table {order.tableNumber}
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">#{order.orderId}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
          <AlertCircle className="w-3.5 h-3.5" />
          Escalated
        </div>
      </div>

      {/* Assigned waiter */}
      {order.waiter && (
        <div className="mb-4 flex items-center gap-2.5 bg-ivory-100/50 px-3 py-2 rounded-xl border border-slate-100/50">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Assigned Waiter</span>
            <span className="text-sm font-bold text-gray-700">{order.waiter.full_name}</span>
          </div>
        </div>
      )}

      {/* Items count & Price */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <span className="text-sm font-bold text-gray-400">Items</span>
          <p className="text-xl font-extrabold text-gray-800">
            {order.items.length} <span className="text-sm font-bold text-gray-400">pcs</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-400">Total</span>
          <p className="text-2xl font-extrabold text-gray-900 leading-none">
            <span className="text-lg font-bold mr-0.5">$</span>
            {Number(order.total).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Time indicators */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <div className="flex flex-col gap-1.5 bg-red-50/50 text-red-700 px-3 py-3 rounded-2xl border border-red-100/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Escalated</span>
          </div>
          <span className="text-lg font-extrabold">{escalatedMinutes} <span className="text-xs">min</span></span>
        </div>
        <div className="flex flex-col gap-1.5 bg-slate-50 text-slate-700 px-3 py-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Time</span>
          </div>
          <span className="text-lg font-extrabold">{totalMinutes} <span className="text-xs">min</span></span>
        </div>
      </div>

      {/* Special instructions indicator */}
      {order.specialInstructions && (
        <div className="mt-4 pt-3 border-t border-slate-100/50 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
            Special Instructions Included
          </span>
        </div>
      )}
    </div>
  );
}
