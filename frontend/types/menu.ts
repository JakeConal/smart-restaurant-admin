// Guest Menu Type Definitions

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemPhoto {
  id: string;
  menuItemId: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface ModifierOption {
  id: string;
  groupId: string;
  name: string;
  priceAdjustment: number;
  status: string;
  createdAt: string;
}

export interface ModifierGroup {
  id: string;
  restaurantId: string;
  name: string;
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  price: number;
  description?: string;
  prepTimeMinutes: number;
  status: 'available' | 'unavailable' | 'sold_out';
  isChefRecommended: boolean;
  isDeleted: boolean;
  popularityScore: number;
  createdAt: string;
  updatedAt: string;
  primaryPhoto?: MenuItemPhoto;
  modifierGroups: ModifierGroup[];
  canOrder: boolean;
  // Rich metadata
  calories?: number;
  ingredients?: string[];
  allergens?: string[];
  chefNote?: string;
}

export interface GuestMenuResponse {
  success: boolean;
  message: string;
  table: {
    id: string;
    tableNumber: string;
    capacity: number;
    location: string;
  };
  menu: {
    categories: MenuCategory[];
    items: MenuItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface MenuFilters {
  q?: string;
  categoryId?: string;
  sort?: 'popularity' | 'price_asc' | 'newest';
  chefRecommended?: boolean;
  page?: number;
  limit?: number;
}

// Selected modifiers: Record<groupId, array of option indices>
export type SelectedModifiers = Record<string, number[]>;

export interface SelectedModifierDetail {
  groupId: string;
  optionId: string;
  groupName: string;
  optionName: string;
  priceAdjustment: number;
}

export interface CartItem {
  uid: string; // Unique identifier for cart item (timestamp or uuid)
  menuItem: MenuItem;
  selectedModifiers: SelectedModifierDetail[];
  quantity: number;
  totalPrice: number; // Base price + modifiers price
}

export interface QuickFilter {
  key: 'chef' | 'available' | 'under50' | 'fast';
  label: string;
  active: boolean;
}
