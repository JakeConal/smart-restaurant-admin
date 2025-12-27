"use client";

import React from "react";
import { Card } from "@/shared/components/ui";
import { Flame, UtensilsCrossed, ChefHat, TrendingUp } from "lucide-react";

export interface MenuStatsCardsProps {
  totalCategories: number;
  totalItems: number;
  activeItems: number;
  chefRecommendations: number;
  onManageCategories?: () => void;
}

export const MenuStatsCards: React.FC<MenuStatsCardsProps> = ({
  totalCategories,
  totalItems,
  activeItems,
  chefRecommendations,
  onManageCategories,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 shrink-0">
      {/* Total Categories */}
      <Card className="p-5 flex flex-col justify-between h-32">
        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
          <Flame className="w-4 h-4" />
        </div>
        <div>
          <span className="text-2xl font-bold block">{totalCategories}</span>
          <span className="text-gray-400 text-sm font-semibold">
            Categories
          </span>
        </div>
      </Card>

      {/* Total Items */}
      <Card className="p-5 flex flex-col justify-between h-32">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <UtensilsCrossed className="w-4 h-4" />
        </div>
        <div>
          <span className="text-2xl font-bold block">{totalItems}</span>
          <span className="text-gray-400 text-sm font-semibold">
            Total Items
          </span>
        </div>
      </Card>

      {/* Active Items */}
      <Card className="p-5 flex flex-col justify-between h-32">
        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className="text-2xl font-bold block">{activeItems}</span>
          <span className="text-gray-400 text-sm font-semibold">Available</span>
        </div>
      </Card>

      {/* Chef's Recommendations */}
      <Card
        variant="dark"
        className="p-5 flex flex-col justify-between h-32"
        hover={false}
      >
        <div className="flex justify-between items-start">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">
            Featured
          </span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <span className="text-2xl font-bold block">
              {chefRecommendations}
            </span>
            <span className="text-white/70 text-sm font-semibold">
              Chef's Picks
            </span>
          </div>
          {onManageCategories && (
            <button
              onClick={onManageCategories}
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
