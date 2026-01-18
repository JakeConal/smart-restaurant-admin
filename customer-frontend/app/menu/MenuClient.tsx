"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { useCart } from "@/lib/cart-context";
import { menuApi } from "@/lib/api";
import { MenuItem, MenuCategory, MenuResponse } from "@/lib/types";
import {
  getMenuFromCache,
  setMenuInCache,
  clearPaginationCache,
} from "@/lib/menu-cache";
import BottomNav from "@/components/BottomNav";
import {
  MenuSkeleton,
  CategorySkeleton,
  FeaturedSkeleton,
} from "@/components/MenuSkeleton";

interface MenuClientProps {
  initialData: MenuResponse | null;
  initialToken: string | null;
}

export default function MenuClient({
  initialData,
  initialToken,
}: MenuClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, setToken, setTableInfo, isAuthenticated, tableNumber } =
    useApp();
  const { getTotalItems } = useCart();

  // Initialize from props if available
  const [categories, setCategories] = useState<MenuCategory[]>(
    initialData?.menu?.categories || [],
  );
  const [items, setItems] = useState<MenuItem[]>(
    initialData?.menu?.items || [],
  );
  const [loading, setLoading] = useState(!initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("categoryId") || null,
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort") || "name",
  );
  const [showChefRecommended, setShowChefRecommended] = useState(
    searchParams.get("chef") === "true",
  );
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(
    initialData?.menu?.pagination
      ? 1 < initialData.menu.pagination.totalPages
      : true,
  );
  const [totalItems, setTotalItems] = useState(
    initialData?.menu?.pagination?.total || 0,
  );
  const [urlInitialized, setUrlInitialized] = useState(true);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
    searchParams.get("q") || "",
  );
  const [mounted, setMounted] = useState(false);

  const observerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentToken = initialToken || searchParams.get("token") || token;

  // Set table info from initial data if present
  useEffect(() => {
    if (initialData?.success && initialData.table) {
      setTableInfo({
        tableId: initialData.table.id,
        restaurantId: initialData.table.restaurantId || "",
        tableNumber: initialData.table.tableNumber,
      });
    }
    setMounted(true);
  }, [initialData, setTableInfo]);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Update URL when filters change
  const updateUrl = useCallback(
    (
      newSearch?: string,
      newCategory?: string | null,
      newSort?: string,
      newChef?: boolean,
    ) => {
      const params = new URLSearchParams();
      if (currentToken) {
        params.set("token", currentToken);
      }

      const search = newSearch ?? searchQuery;
      const category =
        newCategory !== undefined ? newCategory : selectedCategory;
      const sort = newSort ?? sortBy;
      const chef = newChef ?? showChefRecommended;

      if (search) params.set("q", search);
      if (category) params.set("categoryId", category);
      if (sort !== "name") params.set("sort", sort);
      if (chef) params.set("chef", "true");

      const queryString = params.toString();
      router.push(`/menu?${queryString}`, { scroll: false });
    },
    [
      currentToken,
      searchQuery,
      selectedCategory,
      sortBy,
      showChefRecommended,
      router,
    ],
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSortDropdown &&
        !(event.target as Element).closest(".sort-dropdown")
      ) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortDropdown]);

  // Fetch menu data
  const fetchMenu = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!currentToken) return;

      try {
        if (pageNum === 1) {
          setLoading(true);
          if (!append) setItems([]); // Clear items for new search
        } else {
          setLoadingMore(true);
        }

        const currentSearch = debouncedSearchQuery || undefined;

        // Check cache first
        const cachedData = getMenuFromCache({
          token: currentToken,
          q: currentSearch,
          categoryId: selectedCategory || undefined,
          sort: sortBy,
          chefRecommended: showChefRecommended || undefined,
          page: pageNum,
        });

        let response: MenuResponse;

        if (cachedData) {
          response = cachedData;
        } else {
          response = (await menuApi.getMenu(currentToken, {
            q: currentSearch,
            categoryId: selectedCategory || undefined,
            sort: sortBy,
            chefRecommended: showChefRecommended || undefined,
            page: pageNum,
            limit: 10,
          })) as MenuResponse;

          // Cache the response
          if (response.success) {
            setMenuInCache(
              {
                token: currentToken,
                q: currentSearch,
                categoryId: selectedCategory || undefined,
                sort: sortBy,
                chefRecommended: showChefRecommended || undefined,
                page: pageNum,
              },
              response,
            );
          }
        }

        if (response.success) {
          if (response.table) {
            setTableInfo({
              tableId: response.table.id,
              restaurantId: response.table.restaurantId || "",
              tableNumber: response.table.tableNumber,
            });
          }

          if (pageNum === 1) {
            setCategories(response.menu.categories);
            setItems(response.menu.items);
          } else if (append) {
            setItems((prev) => [...prev, ...response.menu.items]);
          }

          setTotalItems(response.menu.pagination.total);
          setHasMore(pageNum < response.menu.pagination.totalPages);
          setPage(pageNum);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      currentToken,
      debouncedSearchQuery,
      selectedCategory,
      sortBy,
      showChefRecommended,
      setTableInfo,
    ],
  );

  // Clear pagination cache when filters change
  useEffect(() => {
    if (currentToken && urlInitialized) {
      clearPaginationCache(
        currentToken,
        debouncedSearchQuery || undefined,
        selectedCategory || undefined,
        sortBy,
        showChefRecommended || undefined,
      );
    }
  }, [
    currentToken,
    debouncedSearchQuery,
    selectedCategory,
    sortBy,
    showChefRecommended,
    urlInitialized,
  ]);

  // Initial load and filter changes
  useEffect(() => {
    // Only fetch if data is not already loaded or if filters changed from initialData
    const filtersChanged =
      debouncedSearchQuery !==
        (initialData?.success ? searchParams.get("q") || "" : "") ||
      selectedCategory !==
        (initialData?.success
          ? searchParams.get("categoryId") || null
          : null) ||
      sortBy !==
        (initialData?.success ? searchParams.get("sort") || "name" : "name") ||
      showChefRecommended !==
        (initialData?.success ? searchParams.get("chef") === "true" : false);

    if (
      currentToken &&
      isAuthenticated &&
      urlInitialized &&
      (filtersChanged || !items.length)
    ) {
      setPage(1);
      fetchMenu(1, false);
    }
  }, [
    currentToken,
    isAuthenticated,
    urlInitialized,
    debouncedSearchQuery,
    selectedCategory,
    sortBy,
    showChefRecommended,
    fetchMenu,
    initialData,
    searchParams, // Added searchParams to dependency if its used to calculate filtersChanged
  ]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchMenu(page + 1, true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchMenu]);

  // Get chef recommended items
  const chefRecommendedItems = items.filter((item) => item.isChefRecommended);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !initialData) return null;

  return (
    <div className="min-h-screen bg-ivory-100 pb-[240px]">
      {/* Header Title (Scrolls away) */}
      <div className="bg-ivory-100 px-6 pt-10 pb-6 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-h1 tracking-tight">Crave something?</h1>
            {tableNumber && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-full mt-2 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  Table {tableNumber}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Search & Filters (Stays at the top) */}
      <div className="sticky top-0 z-30 bg-ivory-100/80 backdrop-blur-xl border-b border-slate-200/50 pt-2 shadow-sm transition-all duration-300">
        <div className="py-4 space-y-4">
          {/* Search Bar Container */}
          <div className="px-6 flex gap-3">
            <div className="relative flex-1 group">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search flavors..."
                value={searchQuery}
                onChange={(e) => {
                  const newQuery = e.target.value;
                  setSearchQuery(newQuery);
                  updateUrl(
                    newQuery,
                    selectedCategory,
                    sortBy,
                    showChefRecommended,
                  );
                }}
                className="w-full bg-white border border-slate-200 rounded-[28px] py-4 pl-12 pr-4 text-sm font-medium focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
              />
            </div>

            <div className="relative sort-dropdown">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`w-14 h-full rounded-[28px] border flex items-center justify-center shadow-sm transition-all ${showSortDropdown ? "bg-slate-900 border-slate-900 ring-4 ring-slate-900/10" : "bg-white border-slate-200 hover:border-slate-900"}`}
              >
                <svg
                  className={`w-5 h-5 transition-colors ${showSortDropdown ? "text-white" : "text-slate-600"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </button>

              {showSortDropdown && (
                <div className="absolute top-16 right-0 w-64 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl border border-slate-100 p-6 z-50 animate-scale-in origin-top-right">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-1">
                        Sort by
                      </h4>
                      <div className="space-y-2">
                        {[
                          { id: "name", label: "Alphabetical", icon: "A-Z" },
                          {
                            id: "popularity",
                            label: "Most Popular",
                            icon: "🔥",
                          },
                          { id: "asc", label: "Price: Low to High", icon: "↓" },
                          {
                            id: "desc",
                            label: "Price: High to Low",
                            icon: "↑",
                          },
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSortBy(option.id);
                              updateUrl(
                                searchQuery,
                                selectedCategory,
                                option.id,
                                showChefRecommended,
                              );
                              setShowSortDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${sortBy === option.id ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50 text-slate-600"}`}
                          >
                            <span className="text-sm font-bold">
                              {option.label}
                            </span>
                            <span
                              className={`text-xs font-black ${sortBy === option.id ? "text-white/40" : "text-slate-300"}`}
                            >
                              {option.icon}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          const next = !showChefRecommended;
                          setShowChefRecommended(next);
                          updateUrl(
                            searchQuery,
                            selectedCategory,
                            sortBy,
                            next,
                          );
                          setShowSortDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${showChefRecommended ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-600 border border-transparent"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">
                            Chef's Picks
                          </span>
                          {showChefRecommended && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${showChefRecommended ? "bg-emerald-500" : "bg-slate-200"}`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white transition-all transform ${showChefRecommended ? "translate-x-4.5" : "translate-x-1"}`}
                          />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Categories Pill View (Full Width Scroll) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hidden px-6">
            {loading && categories.length === 0 ? (
              <CategorySkeleton />
            ) : (
              <>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowChefRecommended(false);
                    updateUrl(searchQuery, null, sortBy, false);
                  }}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    !selectedCategory && !showChefRecommended
                      ? "bg-slate-900 text-white scale-105"
                      : "bg-white text-slate-400 border border-slate-200 hover:border-slate-400"
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowChefRecommended(false);
                      updateUrl(searchQuery, category.id, sortBy, false);
                    }}
                    className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      selectedCategory === category.id
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105"
                        : "bg-white text-slate-400 border border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <main className="px-6 pt-8 space-y-12">
        {loading && items.length === 0 && <FeaturedSkeleton />}

        {/* Featured Section */}
        {!loading &&
          !selectedCategory &&
          !searchQuery &&
          chefRecommendedItems.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Curated
                  </span>
                  <h2 className="text-h2 mt-1">Chef's Selection</h2>
                </div>
                <button
                  onClick={() => {
                    setShowChefRecommended(true);
                    updateUrl(searchQuery, selectedCategory, sortBy, true);
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-0.5"
                >
                  Explore All
                </button>
              </div>

              <div className="grid grid-cols-6 gap-4">
                {chefRecommendedItems[0] && (
                  <Link
                    href={`/menu/${chefRecommendedItems[0].id}?token=${currentToken}`}
                    className="col-span-6 h-[280px] bento-card p-0 overflow-hidden relative group active:scale-[0.98] transition-all"
                  >
                    {chefRecommendedItems[0].primaryPhotoUrl ? (
                      <Image
                        src={menuApi.getPhotoUrl(
                          chefRecommendedItems[0].primaryPhotoUrl,
                        )}
                        alt={chefRecommendedItems[0].name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 text-white w-full text-left">
                      <span className="inline-block bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-2 border border-white/20">
                        House Special
                      </span>
                      <h3 className="text-2xl font-bold leading-tight line-clamp-1">
                        {chefRecommendedItems[0].name}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xl font-black">
                          ${chefRecommendedItems[0].price.toFixed(2)}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
                {chefRecommendedItems.slice(1, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu/${item.id}?token=${currentToken}`}
                    className="col-span-3 h-[200px] bento-card p-0 overflow-hidden relative group active:scale-[0.98] transition-all"
                  >
                    {item.primaryPhotoUrl ? (
                      <Image
                        src={menuApi.getPhotoUrl(item.primaryPhotoUrl)}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-900/60 to-transparent text-left">
                      <h3 className="text-sm font-bold text-white line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="text-xs font-black text-white/90">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        {/* Regular Items */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="text-h2">
              {debouncedSearchQuery
                ? "Search Results"
                : selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name
                  : "Our Menu"}
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {totalItems} items
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {loading && items.length === 0 ? (
              <MenuSkeleton />
            ) : (
              items.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/menu/${item.id}?token=${currentToken}`}
                  className="group"
                >
                  <div className="bento-card p-0 overflow-hidden h-full flex flex-col">
                    <div className="aspect-square relative overflow-hidden bg-slate-50">
                      {item.primaryPhotoUrl ? (
                        <Image
                          src={menuApi.getPhotoUrl(item.primaryPhotoUrl)}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          unoptimized
                          priority={index < 4}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      {item.isChefRecommended && (
                        <div className="absolute top-3 left-3">
                          <div className="bg-slate-900 text-white rounded-full p-1.5 shadow-lg">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1 text-left">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:underline">
                        {item.name}
                      </h3>
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900 tracking-tight">
                          ${item.price.toFixed(2)}
                        </span>
                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {(loading || loadingMore) && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
          )}

          {hasMore && !loading && !loadingMore && (
            <div ref={observerRef} className="h-20" />
          )}
        </section>
      </main>

      <BottomNav token={currentToken || ""} />
    </div>
  );
}
