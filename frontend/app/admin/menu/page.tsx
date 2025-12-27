"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout, TopBar } from "@/shared/components/layout";
import { Card } from "@/shared/components/ui";
import { Grid3x3, UtensilsCrossed, Settings2 } from "lucide-react";
import { useAuth } from "@/shared/components/auth/AuthContext";

export default function MenuPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/admin/login");
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

  const menuSections = [
    {
      title: "Menu Categories",
      description: "Organize your menu into categories",
      icon: Grid3x3,
      href: "/admin/menu/categories",
      color: "purple",
    },
    {
      title: "Menu Items",
      description: "Add and manage menu items, photos, and pricing",
      icon: UtensilsCrossed,
      href: "/admin/menu/items",
      color: "blue",
    },
    {
      title: "Modifier Groups",
      description: "Create customization options (size, toppings, etc.)",
      icon: Settings2,
      href: "/admin/menu/modifiers",
      color: "green",
    },
  ];

  return (
    <DashboardLayout>
      <TopBar
        title="Menu Management"
        subtitle="Manage your restaurant's menu"
        showViewToggle={false}
      />

      {/* Info Card */}
      <Card className="p-6 bg-slate-700">
        <h2 className="text-2xl font-extrabold mb-2">
          Welcome to Menu Management
        </h2>
        <p className="text-gray-400 text-sm font-medium">
          Organize your menu, add items, upload photos, and create customization
          options. Select a section below to get started.
        </p>
      </Card>

      {/* Menu Sections Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">
          Menu Sections
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {menuSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.href}
                className="p-8 cursor-pointer group hover:shadow-2xl transition-all duration-300"
                onClick={() => router.push(section.href)}
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-${section.color}-100 text-${section.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {section.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-blue-900 mb-3">
            💡 Quick Tips
          </h4>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>
                Start by creating <strong>categories</strong> to organize your
                menu
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>
                Add <strong>menu items</strong> with prices and descriptions
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>
                Upload <strong>photos</strong> to make items more appealing
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>
                Create <strong>modifier groups</strong> for customization
                options
              </span>
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
