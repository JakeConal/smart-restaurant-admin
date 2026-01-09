/**
 * Menu Cache Utility
 * Caches menu data to avoid unnecessary API calls
 */

import { MenuResponse } from "./types";

interface CacheEntry {
  data: MenuResponse;
  timestamp: number;
}

interface CacheKey {
  token: string;
  q?: string;
  categoryId?: string;
  sort?: string;
  chefRecommended?: boolean;
  page?: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

/**
 * Generate cache key from parameters
 */
function generateCacheKey(params: CacheKey): string {
  const { token, q, categoryId, sort, chefRecommended, page } = params;
  return JSON.stringify({
    token,
    q: q || "",
    categoryId: categoryId || "",
    sort: sort || "name",
    chefRecommended: chefRecommended || false,
    page: page || 1,
  });
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Get menu data from cache
 */
export function getMenuFromCache(params: CacheKey): MenuResponse | null {
  const key = generateCacheKey(params);
  const entry = cache.get(key);

  if (entry && isCacheValid(entry.timestamp)) {
    console.log("📦 Using cached menu data");
    return entry.data;
  }

  // Remove expired cache
  if (entry) {
    cache.delete(key);
  }

  return null;
}

/**
 * Set menu data in cache
 */
export function setMenuInCache(params: CacheKey, data: MenuResponse): void {
  const key = generateCacheKey(params);
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
  console.log("💾 Cached menu data");
}

/**
 * Clear cache for specific filters or all cache
 */
export function clearMenuCache(
  token?: string,
  filters?: Partial<CacheKey>,
): void {
  if (!token) {
    cache.clear();
    console.log("🗑️ Cleared all menu cache");
    return;
  }

  if (filters) {
    // Clear cache for specific filters
    const keysToDelete: string[] = [];
    cache.forEach((_, key) => {
      const parsed = JSON.parse(key);
      if (parsed.token === token) {
        // Check if all provided filters match
        const matches = Object.entries(filters).every(
          ([filterKey, filterValue]) => {
            if (filterKey === "token") return true;
            if (filterKey === "page") return true; // Don't filter by page for clearing
            return parsed[filterKey] === (filterValue || "");
          },
        );
        if (matches) {
          keysToDelete.push(key);
        }
      }
    });
    keysToDelete.forEach((key) => cache.delete(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} menu cache entries`);
  } else {
    // Clear all cache for this token
    const keysToDelete: string[] = [];
    cache.forEach((_, key) => {
      const parsed = JSON.parse(key);
      if (parsed.token === token) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => cache.delete(key));
    console.log(`🗑️ Cleared all menu cache for this token`);
  }
}

/**
 * Clear pagination cache (keep page 1)
 */
export function clearPaginationCache(
  token: string,
  q?: string,
  categoryId?: string,
  sort?: string,
  chefRecommended?: boolean,
): void {
  const keysToDelete: string[] = [];
  cache.forEach((_, key) => {
    const parsed = JSON.parse(key);
    if (
      parsed.token === token &&
      (q ? parsed.q === q : parsed.q === "") &&
      (categoryId
        ? parsed.categoryId === categoryId
        : parsed.categoryId === "") &&
      (sort ? parsed.sort === sort : parsed.sort === "name") &&
      (chefRecommended
        ? parsed.chefRecommended === chefRecommended
        : parsed.chefRecommended === false) &&
      parsed.page > 1
    ) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => cache.delete(key));
  if (keysToDelete.length > 0) {
    console.log(`🗑️ Cleared pagination cache (kept page 1)`);
  }
}
