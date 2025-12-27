'use client';

import React from 'react';
import { Sidebar } from './Sidebar';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex p-4 gap-5 overflow-hidden bg-ivory-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-0 gap-5">{children}</main>
    </div>
  );
};
