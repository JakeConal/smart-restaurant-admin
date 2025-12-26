'use client';

import { useState, useEffect, useCallback } from 'react';
import { menuApi } from '@/lib/api';
import type { MenuItem, MenuCategory, MenuFilters, GuestMenuResponse } from '@/types/menu';

interface UseGuestMenuOptions {
  tableId: string;
  token: string;
}

export const useGuestMenu = ({ tableId, token }: UseGuestMenuOptions) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<GuestMenuResponse | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'price_asc' | 'newest'>('popularity');
  const [quickFilters, setQuickFilters] = useState({
    chef: false,
    available: false,
    under50: false,
    fast: false,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch menu data
  const fetchMenu = useCallback(async () => {
    if (!tableId || !token) {
      setError('Missing table ID or token');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const filters: MenuFilters = {
        sort: sortBy,
        limit: 100, // Fetch all items for client-side filtering
      };

      if (debouncedSearch) {
        filters.q = debouncedSearch;
      }

      if (selectedCategory !== 'all') {
        filters.categoryId = selectedCategory;
      }

      const data = await menuApi.getGuestMenu(tableId, token, filters);
      setMenuData(data);
    } catch (err: any) {
      console.error('Failed to fetch menu:', err);
      
      if (err.response?.status === 404) {
        setError('This QR code is no longer valid. Please ask staff for assistance.');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || 'This table is currently inactive.');
      } else {
        setError('Failed to load menu. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [tableId, token, debouncedSearch, selectedCategory, sortBy]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Apply client-side filters
  const getFilteredItems = useCallback((): MenuItem[] => {
    if (!menuData?.menu?.items) return [];

    let filtered = [...menuData.menu.items];

    // Quick filters
    if (quickFilters.chef) {
      filtered = filtered.filter((item) => item.isChefRecommended);
    }

    if (quickFilters.available) {
      filtered = filtered.filter((item) => item.status === 'available');
    }

    if (quickFilters.under50) {
      filtered = filtered.filter((item) => item.price < 50000);
    }

    if (quickFilters.fast) {
      filtered = filtered.filter((item) => item.prepTimeMinutes <= 15);
    }

    return filtered;
  }, [menuData, quickFilters]);

  // Toggle quick filter
  const toggleQuickFilter = useCallback((key: keyof typeof quickFilters) => {
    setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('popularity');
    setQuickFilters({
      chef: false,
      available: false,
      under50: false,
      fast: false,
    });
  }, []);

  return {
    // Data
    table: menuData?.table,
    categories: menuData?.menu?.categories || [],
    items: getFilteredItems(),
    allItems: menuData?.menu?.items || [],
    
    // States
    loading,
    error,
    
    // Filters
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    quickFilters,
    toggleQuickFilter,
    resetFilters,
    
    // Actions
    refetch: fetchMenu,
  };
};
