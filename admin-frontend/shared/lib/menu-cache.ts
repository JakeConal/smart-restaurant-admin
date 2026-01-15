/**
 * Menu Cache Utility for Admin Frontend
 * Caches menu data and categories to improve performance
 */

import { MenuItem, MenuCategory, MenuItemFilters } from "../types/menu";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const itemsCache = new Map<
  string,
  CacheEntry<{ items: MenuItem[]; total: number }>
>();
const categoriesCache = new Map<string, CacheEntry<MenuCategory[]>>();
const singleItemCache = new Map<string, CacheEntry<MenuItem>>();

/**
 * Check if cache entry is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Generate cache key for items with filters
 */
function generateItemsKey(filters?: MenuItemFilters): string {
  return JSON.stringify(filters || {});
}

export const menuCache = {
  // Items List Cache
  getItems: (filters?: MenuItemFilters) => {
    const key = generateItemsKey(filters);
    const entry = itemsCache.get(key);
    if (entry && isCacheValid(entry.timestamp)) {
      return entry.data;
    }
    return null;
  },
  setItems: (
    filters: MenuItemFilters | undefined,
    data: { items: MenuItem[]; total: number },
  ) => {
    const key = generateItemsKey(filters);
    itemsCache.set(key, { data, timestamp: Date.now() });
  },

  // Categories Cache
  getCategories: (key: string = "all") => {
    const entry = categoriesCache.get(key);
    if (entry && isCacheValid(entry.timestamp)) {
      return entry.data;
    }
    return null;
  },
  setCategories: (data: MenuCategory[], key: string = "all") => {
    categoriesCache.set(key, { data, timestamp: Date.now() });
  },

  // Single Item Cache
  getItem: (id: string) => {
    const entry = singleItemCache.get(id);
    if (entry && isCacheValid(entry.timestamp)) {
      return entry.data;
    }
    return null;
  },
  setItem: (id: string, data: MenuItem) => {
    singleItemCache.set(id, { data, timestamp: Date.now() });
  },

  // Clear Cache
  invalidate: () => {
    itemsCache.clear();
    categoriesCache.clear();
    singleItemCache.clear();
    console.log("Admin Menu Cache Invalidated");
  },
};
