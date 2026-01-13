"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout, TopBar } from "@/shared/components/layout";
import { Card } from "@/shared/components/ui";
import { LayoutGrid, Layers, Utensils, Users2 } from "lucide-react";
import { useAuth } from "@/shared/components/auth/AuthContext";

export default function AdminHome() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const quickActions = [
    {
      title: "Manage Tables",
      description: "Add, edit, and manage restaurant tables",
      icon: Layers,
      href: "/tables",
      color: "blue",
    },
    {
      title: "Menu Management",
      description: "Organize your menu, items, and categories",
      icon: Utensils,
      href: "/menu",
      color: "green",
    },
    {
      title: "Waiter Management",
      description: "Manage waiter accounts and assignments",
      icon: Users2,
      href: "/waiters",
      color: "purple",
    },
  ];

  return (
    <DashboardLayout>
      <TopBar
        title="Dashboard"
        subtitle="Welcome to Smart Restaurant Admin"
        showViewToggle={false}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.title}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => (window.location.href = action.href)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-${action.color}-100`}>
                  <Icon className={`w-6 h-6 text-${action.color}-600`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{action.title}</h3>
                  <p className="text-gray-600 text-sm">{action.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
