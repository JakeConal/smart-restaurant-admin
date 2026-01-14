'use client';

import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/shared/components/auth/AuthContext';

export interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-ivory-50">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight block leading-tight text-gray-900">
                  Super Admin
                </span>
                <span className="text-gray-400 font-medium text-sm">
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all font-semibold"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
