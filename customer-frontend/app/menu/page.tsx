"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Fuse from "fuse.js";
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

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, setToken, setTableInfo, isAuthenticated, tableNumber } =
    useApp();
  const { getTotalItems } = useCart();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [showChefRecommended, setShowChefRecommended] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [urlInitialized, setUrlInitialized] = useState(false);
  const [fuzzyResults, setFuzzyResults] = useState<MenuItem[]>([]);
  const [fuseInstance, setFuseInstance] = useState<Fuse<MenuItem> | null>(null);
  const [useFuzzySearch, setUseFuzzySearch] = useState(false);

  const observerRef = useRef<HTMLDivElement>(null);
  const currentToken = searchParams.get("token") || token;

  // Initialize state from URL params on mount
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const categoryId = searchParams.get("categoryId") || null;
    const sort = searchParams.get("sort") || "name";
    const chefRecommended = searchParams.get("chef") === "true";

    setSearchQuery(q);
    setSelectedCategory(categoryId);
    setSortBy(sort);
    setShowChefRecommended(chefRecommended);
    setUrlInitialized(true);
  }, []);

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
      router.push(`/menu?${queryString}`);
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
        } else {
          setLoadingMore(true);
        }

        // Check cache first
        const cachedData = getMenuFromCache({
          token: currentToken,
          q: searchQuery || undefined,
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
            q: searchQuery || undefined,
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
                q: searchQuery || undefined,
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
          }

          if (append) {
            setItems((prev) => [...prev, ...response.menu.items]);
          } else {
            setItems(response.menu.items);
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
      searchQuery,
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
        searchQuery || undefined,
        selectedCategory || undefined,
        sortBy,
        showChefRecommended || undefined,
      );
    }
  }, [
    currentToken,
    searchQuery,
    selectedCategory,
    sortBy,
    showChefRecommended,
    urlInitialized,
  ]);

  // Initial load and filter changes
  useEffect(() => {
    if (currentToken && isAuthenticated && urlInitialized) {
      setPage(1);
      fetchMenu(1, false);
    }
  }, [
    currentToken,
    isAuthenticated,
    urlInitialized,
    searchQuery,
    selectedCategory,
    sortBy,
    showChefRecommended,
    fetchMenu,
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

  // Initialize Fuse.js for fuzzy search
  useEffect(() => {
    if (items.length > 0) {
      const fuse = new Fuse(items, {
        keys: ["name", "description"],
        threshold: 0.3,
        minMatchCharLength: 1,
        includeScore: true,
        findAllMatches: true,
      });
      setFuseInstance(fuse);
    }
  }, [items]);

  // Perform fuzzy search when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFuzzyResults([]);
      setUseFuzzySearch(false);
    } else if (fuseInstance) {
      const results = fuseInstance.search(searchQuery);
      setFuzzyResults(results.map((result) => result.item));
      setUseFuzzySearch(true);
    }
  }, [searchQuery, fuseInstance]);

  // Get chef recommended items
  const chefRecommendedItems = items.filter((item) => item.isChefRecommended);

  // Get popular items
  const popularItems = [...items]
    .filter((item) => item.popularityScore > 0)
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: {
        label: "Available",
        color: "bg-emerald-100 text-emerald-700 border-emerald-300",
      },
      unavailable: {
        label: "Unavailable",
        color: "bg-amber-100 text-amber-700 border-amber-300",
      },
      sold_out: {
        label: "Sold Out",
        color: "bg-red-100 text-red-700 border-red-300",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.available;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 safe-bottom">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container-safe py-2 sm:py-3">
          {/* Header Top */}
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex-1">
              <h1 className="text-h1 text-gray-900">Menu</h1>
              {tableNumber && (
                <p className="text-caption text-gray-600 mt-1">
                  Table {tableNumber}
                </p>
              )}
            </div>
            <Link
              href={`/cart?token=${currentToken}`}
              className="group relative w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
            >
              <svg
                className="w-6 h-6 text-gray-700 group-hover:text-red-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {getTotalItems() > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {getTotalItems() > 99 ? "99+" : getTotalItems()}
                </div>
              )}
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3 group">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search dishes..."
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
              className="input-field pl-12"
            />
          </div>

          {/* Sort Button & Chef's Pick */}
          <div className="flex gap-2 mb-3 items-center">
            {/* Sort Dropdown */}
            <div className="relative sort-dropdown z-50">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {sortBy === "asc"
                    ? "Price ↑"
                    : sortBy === "desc"
                      ? "Price ↓"
                      : sortBy === "popularity"
                        ? "Popular"
                        : "Name"}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSortBy("name");
                        setShowSortDropdown(false);
                        updateUrl(
                          searchQuery,
                          selectedCategory,
                          "name",
                          showChefRecommended,
                        );
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors ${
                        sortBy === "name"
                          ? "text-red-600 bg-red-50"
                          : "text-gray-700"
                      }`}
                    >
                      Name
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("popularity");
                        setShowSortDropdown(false);
                        updateUrl(
                          searchQuery,
                          selectedCategory,
                          "popularity",
                          showChefRecommended,
                        );
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors ${
                        sortBy === "popularity"
                          ? "text-red-600 bg-red-50"
                          : "text-gray-700"
                      }`}
                    >
                      Popular
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("asc");
                        setShowSortDropdown(false);
                        updateUrl(
                          searchQuery,
                          selectedCategory,
                          "asc",
                          showChefRecommended,
                        );
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors ${
                        sortBy === "asc"
                          ? "text-red-600 bg-red-50"
                          : "text-gray-700"
                      }`}
                    >
                      Price Low to High
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("desc");
                        setShowSortDropdown(false);
                        updateUrl(
                          searchQuery,
                          selectedCategory,
                          "desc",
                          showChefRecommended,
                        );
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors ${
                        sortBy === "desc"
                          ? "text-red-600 bg-red-50"
                          : "text-gray-700"
                      }`}
                    >
                      Price High to Low
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Chef's Pick Button */}
            <button
              onClick={() => {
                const newChefState = !showChefRecommended;
                setShowChefRecommended(newChefState);
                updateUrl(searchQuery, selectedCategory, sortBy, newChefState);
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 shadow-sm ${
                showChefRecommended
                  ? "bg-red-600 text-white hover:bg-red-700 hover:shadow-md"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              Chef's Pick
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="container-safe py-0 flex gap-2 overflow-x-auto scrollbar-hidden">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowChefRecommended(false);
                updateUrl(searchQuery, null, sortBy, false);
              }}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                !selectedCategory && !showChefRecommended
                  ? "text-red-600 border-red-600"
                  : "text-gray-600 border-transparent hover:text-gray-900"
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
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                  selectedCategory === category.id
                    ? "text-red-600 border-red-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-safe py-3 sm:py-4 lg:py-5">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-red-500 border-r-red-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium text-base sm:text-lg">
              Loading menu...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8 text-center mb-6 shadow-sm">
            <div className="text-4xl sm:text-5xl mb-4">⚠️</div>
            <p className="text-red-700 font-bold text-base sm:text-lg mb-2">
              Something went wrong
            </p>
            <p className="text-red-600 text-sm sm:text-base mb-6">{error}</p>
            <button onClick={() => fetchMenu(1)} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* Chef Recommendations Section */}
        {!loading &&
          chefRecommendedItems.length > 0 &&
          !selectedCategory &&
          !showChefRecommended && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Chef&apos;s Recommendations
                  </h2>
                  <p className="text-sm text-gray-600 font-medium">
                    Hand-picked favorites from our kitchen
                  </p>
                </div>
                <button
                  onClick={() => setShowChefRecommended(true)}
                  className="text-orange-600 text-sm font-bold hover:text-orange-700 transition-colors flex items-center gap-1"
                >
                  View all
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hidden -mx-6 px-6">
                {chefRecommendedItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu/${item.id}?token=${currentToken}`}
                    className="flex-shrink-0 w-44 bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition-all group shadow-md"
                  >
                    <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      {item.primaryPhotoUrl ? (
                        <Image
                          src={item.primaryPhotoUrl}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🍽️
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute top-2 left-2">
                        <span className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          Chef Pick
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
                        {item.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600 font-bold text-lg">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.prepTimeMinutes > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-medium">
                            {item.prepTimeMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        {/* Popular Items Section */}
        {!loading &&
          popularItems.length > 0 &&
          !selectedCategory &&
          !showChefRecommended && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🔥 Popular Right Now
                  </h2>
                  <p className="text-sm text-gray-600 font-medium">
                    Customer favorites
                  </p>
                </div>
                <button
                  onClick={() => setSortBy("popularity")}
                  className="text-orange-600 text-sm font-bold hover:text-orange-700 transition-colors flex items-center gap-1"
                >
                  View all
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hidden -mx-6 px-6">
                {popularItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu/${item.id}?token=${currentToken}`}
                    className="flex-shrink-0 w-44 bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition-all group shadow-md"
                  >
                    <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      {item.primaryPhotoUrl ? (
                        <Image
                          src={item.primaryPhotoUrl}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🍽️
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute top-2 left-2">
                        <span className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          Popular
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
                        {item.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600 font-bold text-lg">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.prepTimeMinutes > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-medium">
                            {item.prepTimeMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        {/* Items Grid */}
        {!loading && items.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {useFuzzySearch
                  ? "Search Results"
                  : showChefRecommended
                    ? "Chef's Recommendations"
                    : selectedCategory
                      ? categories.find((c) => c.id === selectedCategory)?.name
                      : "All Items"}
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                {useFuzzySearch ? fuzzyResults.length : totalItems} items
                available
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {(useFuzzySearch ? fuzzyResults : items).map((item) => (
                <Link
                  key={item.id}
                  href={`/menu/${item.id}?token=${currentToken}`}
                  className="card-hover flex flex-col h-full"
                >
                  {/* Image Container */}
                  <div className="h-32 sm:h-40 md:h-44 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {item.primaryPhotoUrl ? (
                      <Image
                        src={item.primaryPhotoUrl}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl">
                        🍽️
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                      {item.isChefRecommended && (
                        <span className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                          Chef Pick
                        </span>
                      )}
                      {item.status !== "available" && (
                        <div>{getStatusBadge(item.status)}</div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base line-clamp-2 mb-1 sm:mb-2">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 text-xs line-clamp-2 mb-2 sm:mb-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-red-600 font-bold text-sm sm:text-base md:text-lg">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.prepTimeMinutes > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-medium">
                          {item.prepTimeMinutes}m
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 animate-bounce">
              🍽️
            </div>
            <h3 className="text-h2 text-gray-900 mb-2 sm:mb-3">
              No items found
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base max-w-sm">
              {searchQuery
                ? "Try a different search term"
                : "No items available in this category"}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setShowChefRecommended(false);
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Fuzzy Search Empty State */}
        {!loading &&
          useFuzzySearch &&
          fuzzyResults.length === 0 &&
          items.length > 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-6 animate-bounce">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No matching dishes found
              </h3>
              <p className="text-gray-600 mb-8 text-lg max-w-sm">
                Try adjusting your search terms for better results
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setUseFuzzySearch(false);
                }}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold shadow-md hover:scale-105"
              >
                Clear Search
              </button>
            </div>
          )}

        {/* Loading more */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-4" />

      <BottomNav token={currentToken || ""} />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
