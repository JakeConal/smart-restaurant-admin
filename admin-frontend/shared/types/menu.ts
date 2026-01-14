// Menu Category Types
export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  status: "active" | "inactive";
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuCategoryDto {
  name: string;
  description?: string;
  displayOrder?: number;
  status?: "active" | "inactive";
}

export interface UpdateMenuCategoryDto {
  name?: string;
  description?: string;
  displayOrder?: number;
  status?: "active" | "inactive";
}

export interface MenuCategoryFilters {
  status?: "active" | "inactive";
  sortBy?: "displayOrder" | "name" | "createdAt";
}

// Menu Item Types
export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description?: string;
  price: number;
  prepTimeMinutes?: number;
  status: "available" | "unavailable" | "sold_out";
  isChefRecommended: boolean;
  isDeleted: boolean;
  primaryPhoto?: string;
  photos?: MenuItemPhoto[];
  modifierGroups?: ModifierGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemDto {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  prepTimeMinutes?: number;
  status?: "available" | "unavailable" | "sold_out";
  isChefRecommended?: boolean;
}

export interface UpdateMenuItemDto {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: number;
  prepTimeMinutes?: number;
  status?: "available" | "unavailable" | "sold_out";
  isChefRecommended?: boolean;
}

export interface MenuItemFilters {
  search?: string;
  categoryId?: string;
  status?: "available" | "unavailable" | "sold_out";
  isChefRecommended?: boolean;
  sortBy?: "createdAt" | "price_asc" | "price_desc" | "name" | "popularity";
  page?: number;
  limit?: number;
}

// Menu Item Photo Types
export interface MenuItemPhoto {
  id: string;
  menuItemId: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface UploadPhotoDto {
  file: File;
  isPrimary?: boolean;
}

// Modifier Types
export interface ModifierGroup {
  id: string;
  restaurantId: string;
  name: string;
  selectionType: "single" | "multiple";
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
  status: "active" | "inactive";
  options?: ModifierOption[];
  createdAt: string;
  updatedAt: string;
}

export interface ModifierOption {
  id: string;
  groupId: string;
  name: string;
  priceAdjustment: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface CreateModifierGroupDto {
  name: string;
  selectionType: "single" | "multiple";
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
  displayOrder?: number;
  status?: "active" | "inactive";
}

export interface UpdateModifierGroupDto {
  name?: string;
  selectionType?: "single" | "multiple";
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
  displayOrder?: number;
  status?: "active" | "inactive";
}

export interface CreateModifierOptionDto {
  name: string;
  priceAdjustment?: number;
  status?: "active" | "inactive";
}

export interface UpdateModifierOptionDto {
  name?: string;
  priceAdjustment?: number;
  status?: "active" | "inactive";
}

// Menu Item Modifier Groups Association
export interface AttachModifierGroupDto {
  groupIds: string[];
}

// Guest Menu Types (Read-only)
export interface GuestMenuFilters {
  q?: string;
  categoryId?: string;
  chefRecommended?: boolean;
  sort?: "popularity" | "price" | "name";
  page?: number;
  limit?: number;
}

export interface GuestMenuItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  price: number;
  prepTimeMinutes?: number;
  isChefRecommended: boolean;
  primaryPhoto?: string;
  modifierGroups?: ModifierGroup[];
}

export interface GuestMenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  items?: GuestMenuItem[];
}
