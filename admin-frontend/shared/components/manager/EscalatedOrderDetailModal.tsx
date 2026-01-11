'use client';

import React from 'react';
import { X, ShoppingBag, Clock, User, AlertCircle } from 'lucide-react';
import type { Order } from '../../types/order';
import { Button } from '../ui/Button';

interface EscalatedOrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onReassign: () => void;
}

export function EscalatedOrderDetailModal({
  order,
  isOpen,
  onClose,
  onReassign,
}: EscalatedOrderDetailModalProps) {
  if (!isOpen) return null;

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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-200/50 backdrop-blur-md z-[60]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden p-2">
          {/* Inner Content Container */}
          <div className="bg-gray-50 rounded-[1.75rem] flex-1 flex flex-col overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-2xl border border-red-100/50">
                  <ShoppingBag className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Table {order.tableNumber}
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Details #{order.orderId}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8 overflow-y-auto">
              {/* Status Section */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-red-200">
                  <AlertCircle className="w-4 h-4" />
                  Performance Escalation
                </div>
                <div className="flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full text-xs font-bold border border-gray-100 shadow-sm">
                  <Clock className="w-4 h-4 text-red-400" />
                  Escalated {getEscalatedMinutes()} min ago
                </div>
                <div className="flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full text-xs font-bold border border-gray-100 shadow-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Total Active Time: {getTotalMinutes()} min
                </div>
              </div>

              {/* Staff Assignment */}
              {order.waiter && (
                <div className="bg-white rounded-[1.5rem] border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Current Responsibility</span>
                      <h4 className="text-lg font-extrabold text-gray-900">{order.waiter.full_name}</h4>
                      <p className="text-sm text-gray-500 font-medium">{order.waiter.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order items */}
              <div className="bg-white rounded-[1.5rem] border border-gray-100 p-6 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-b border-gray-50 pb-4">
                  Order Summary
                </h3>
                <div className="space-y-6">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-800 text-sm border border-slate-100">
                            {item.quantity}
                          </span>
                          <span className="font-extrabold text-gray-800">{item.menuItemName}</span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="mt-2 ml-11 space-y-1.5 border-l-2 border-slate-100 pl-4">
                            {item.modifiers.map((mod, modIndex) => (
                              <p key={modIndex} className="text-sm text-gray-500 font-medium">
                                {mod.modifierOptionName}
                                {mod.price > 0 && (
                                  <span className="ml-2 text-slate-400 font-bold">+$ {Number(mod.price).toFixed(2)}</span>
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <p className="mt-3 ml-11 text-xs text-orange-600 font-bold italic bg-orange-50/50 px-3 py-2 rounded-lg inline-block border border-orange-100/50">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <span className="text-lg font-black text-gray-900">
                        ${Number(item.subtotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-800 rounded-[1.5rem] p-8 text-white shadow-xl">
                <div className="space-y-4">
                  <div className="flex justify-between text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <span>Subtotal Value</span>
                    <span className="text-white">${Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <span>Service Tax</span>
                    <span className="text-white">${Number(order.tax).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Grand Total</span>
                      <span className="text-3xl font-black tracking-tighter italic">PAID</span>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-black tracking-tighter">${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reassign Action */}
              <Button
                onClick={onReassign}
                variant="primary"
                className="w-full h-16 rounded-[1.25rem] flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-100 group transition-all"
              >
                <User className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-black tracking-tight">Assign New Personnel</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
