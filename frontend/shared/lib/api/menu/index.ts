import { apiClient } from "../client";
import type {
  MenuCategory,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  MenuCategoryFilters,
  MenuItem,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  MenuItemFilters,
  MenuItemPhoto,
  ModifierGroup,
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  ModifierOption,
  CreateModifierOptionDto,
  UpdateModifierOptionDto,
  AttachModifierGroupDto,
  GuestMenuFilters,
  GuestMenuItem,
  GuestMenuCategory,
} from "@/shared/types/menu";

export class MenuApi {
  // ============================================
  // Category Methods
  // ============================================

  /**
   * Get all categories with optional filters
   */
  async getCategories(filters?: MenuCategoryFilters): Promise<MenuCategory[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);

    const response = await apiClient.get(
      `/api/admin/menu/categories?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Get single category by ID
   */
  async getCategoryById(id: string): Promise<MenuCategory> {
    const response = await apiClient.get(`/api/admin/menu/categories/${id}`);
    return response.data;
  }

  /**
   * Create new category
   */
  async createCategory(data: CreateMenuCategoryDto): Promise<MenuCategory> {
    const response = await apiClient.post("/api/admin/menu/categories", data);
    return response.data;
  }

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    data: UpdateMenuCategoryDto,
  ): Promise<MenuCategory> {
    const response = await apiClient.put(
      `/api/admin/menu/categories/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Update category status
   */
  async updateCategoryStatus(
    id: string,
    status: "active" | "inactive",
  ): Promise<MenuCategory> {
    const response = await apiClient.patch(
      `/api/admin/menu/categories/${id}/status`,
      { status },
    );
    return response.data;
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/menu/categories/${id}`);
  }

  // ============================================
  // Menu Item Methods
  // ============================================

  /**
   * Get all items with filters and pagination
   */
  async getItems(
    filters?: MenuItemFilters,
  ): Promise<{ items: MenuItem[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.categoryId) params.append("categoryId", filters.categoryId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.isChefRecommended !== undefined)
      params.append("chefRecommended", String(filters.isChefRecommended));
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const response = await apiClient.get(
      `/api/admin/menu/items?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Get single item by ID
   */
  async getItemById(id: string): Promise<MenuItem> {
    const response = await apiClient.get(`/api/admin/menu/items/${id}`);
    return response.data;
  }

  /**
   * Create new item
   */
  async createItem(data: CreateMenuItemDto): Promise<MenuItem> {
    const response = await apiClient.post("/api/admin/menu/items", data);
    return response.data;
  }

  /**
   * Update item
   */
  async updateItem(id: string, data: UpdateMenuItemDto): Promise<MenuItem> {
    const response = await apiClient.put(`/api/admin/menu/items/${id}`, data);
    return response.data;
  }

  /**
   * Update item status
   */
  async updateItemStatus(
    id: string,
    status: "available" | "unavailable" | "sold_out",
  ): Promise<MenuItem> {
    const response = await apiClient.patch(
      `/api/admin/menu/items/${id}/status`,
      { status },
    );
    return response.data;
  }

  /**
   * Delete item (soft delete)
   */
  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/menu/items/${id}`);
  }

  // ============================================
  // Photo Methods
  // ============================================

  /**
   * Upload photos for an item
   */
  async uploadPhotos(itemId: string, files: File[]): Promise<MenuItemPhoto[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    const response = await apiClient.post(
      `/api/admin/menu/items/${itemId}/photos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  /**
   * Delete a photo
   */
  async deletePhoto(itemId: string, photoId: string): Promise<void> {
    await apiClient.delete(`/api/admin/menu/items/${itemId}/photos/${photoId}`);
  }

  /**
   * Set primary photo
   */
  async setPrimaryPhoto(
    itemId: string,
    photoId: string,
  ): Promise<MenuItemPhoto> {
    const response = await apiClient.patch(
      `/api/admin/menu/items/${itemId}/photos/${photoId}/primary`,
    );
    return response.data;
  }

  // ============================================
  // Modifier Group Methods
  // ============================================

  /**
   * Get all modifier groups
   */
  async getModifierGroups(): Promise<ModifierGroup[]> {
    const response = await apiClient.get("/api/admin/menu/modifier-groups");
    return response.data;
  }

  /**
   * Get single modifier group by ID
   */
  async getModifierGroupById(id: string): Promise<ModifierGroup> {
    const response = await apiClient.get(
      `/api/admin/menu/modifier-groups/${id}`,
    );
    return response.data;
  }

  /**
   * Create new modifier group
   */
  async createModifierGroup(
    data: CreateModifierGroupDto,
  ): Promise<ModifierGroup> {
    const response = await apiClient.post(
      "/api/admin/menu/modifier-groups",
      data,
    );
    return response.data;
  }

  /**
   * Update modifier group
   */
  async updateModifierGroup(
    id: string,
    data: UpdateModifierGroupDto,
  ): Promise<ModifierGroup> {
    const response = await apiClient.put(
      `/api/admin/menu/modifier-groups/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Delete modifier group
   */
  async deleteModifierGroup(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/menu/modifier-groups/${id}`);
  }

  // ============================================
  // Modifier Option Methods
  // ============================================

  /**
   * Create option for a group
   */
  async createModifierOption(
    groupId: string,
    data: CreateModifierOptionDto,
  ): Promise<ModifierOption> {
    const response = await apiClient.post(
      `/api/admin/menu/modifier-groups/${groupId}/options`,
      data,
    );
    return response.data;
  }

  /**
   * Update option
   */
  async updateModifierOption(
    optionId: string,
    data: UpdateModifierOptionDto,
  ): Promise<ModifierOption> {
    const response = await apiClient.put(
      `/api/admin/menu/modifier-options/${optionId}`,
      data,
    );
    return response.data;
  }

  /**
   * Delete option
   */
  async deleteModifierOption(optionId: string): Promise<void> {
    await apiClient.delete(`/api/admin/menu/modifier-options/${optionId}`);
  }

  // ============================================
  // Menu Item Modifier Methods
  // ============================================

  /**
   * Attach modifier groups to an item
   */
  async attachModifierGroups(
    itemId: string,
    data: AttachModifierGroupDto,
  ): Promise<void> {
    await apiClient.post(
      `/api/admin/menu/items/${itemId}/modifier-groups`,
      data,
    );
  }

  /**
   * Get modifier groups for an item
   */
  async getItemModifierGroups(itemId: string): Promise<ModifierGroup[]> {
    const response = await apiClient.get(
      `/api/admin/menu/items/${itemId}/modifier-groups`,
    );
    return response.data;
  }

  // ============================================
  // Guest Menu Methods
  // ============================================

  /**
   * Get guest menu with filters
   */
  async getGuestMenu(
    filters?: GuestMenuFilters,
  ): Promise<{ categories: GuestMenuCategory[]; items: GuestMenuItem[] }> {
    const params = new URLSearchParams();
    if (filters?.q) params.append("q", filters.q);
    if (filters?.categoryId) params.append("categoryId", filters.categoryId);
    if (filters?.chefRecommended !== undefined)
      params.append("chefRecommended", String(filters.chefRecommended));
    if (filters?.sort) params.append("sort", filters.sort);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const response = await apiClient.get(`/api/menu?${params.toString()}`);
    return response.data;
  }
}

// Export singleton instance
export const menuApi = new MenuApi();
