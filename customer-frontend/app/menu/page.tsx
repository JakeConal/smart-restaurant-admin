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
              restaurantId: "",
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
    <div className="min-h-screen bg-gradient-to-br from-orange-25 via-white to-orange-50 pb-24 safe-bottom">
      {/* Header Section */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-orange-100/50 shadow-sm overflow-visible">
        <div className="px-6 py-3">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Discover Menu
                </h1>
                {tableNumber && (
                  <p className="text-sm text-gray-500 font-medium">
                    Table {tableNumber}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/cart?token=${currentToken}`}
              className="group relative w-12 h-12 bg-white/70 hover:bg-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100/50 backdrop-blur-sm"
            >
              <svg
                className="w-6 h-6 text-gray-700 group-hover:text-orange-600 transition-colors"
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
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {getTotalItems() > 99 ? "99+" : getTotalItems()}
                </div>
              )}
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3 group">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors"
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
              placeholder="Search your favorite dishes..."
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
              className="w-full pl-12 pr-5 py-3.5 bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white transition-all text-sm placeholder:text-gray-400 shadow-sm hover:shadow-md"
            />
          </div>

          {/* Sort & Filter Pills */}
          <div className="flex gap-3 mb-1 overflow-visible pb-2 scrollbar-hidden">
            {/* Sort Dropdown */}
            <div className="relative sort-dropdown z-[100]">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="px-5 py-2.5 bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl text-xs font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300 whitespace-nowrap shadow-sm flex items-center gap-1.5"
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
                {sortBy === "asc"
                  ? "Price ↑"
                  : sortBy === "desc"
                    ? "Price ↓"
                    : sortBy === "popularity"
                      ? "Popular"
                      : "Name"}
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${showSortDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white/95 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl z-[100] overflow-hidden">
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
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-orange-50 transition-colors ${
                        sortBy === "name"
                          ? "text-orange-600 bg-orange-50"
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
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-orange-50 transition-colors ${
                        sortBy === "popularity"
                          ? "text-orange-600 bg-orange-50"
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
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-orange-50 transition-colors ${
                        sortBy === "asc"
                          ? "text-orange-600 bg-orange-50"
                          : "text-gray-700"
                      }`}
                    >
                      Price ↑
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
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-orange-50 transition-colors ${
                        sortBy === "desc"
                          ? "text-orange-600 bg-orange-50"
                          : "text-gray-700"
                      }`}
                    >
                      Price ↓
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const newChefState = !showChefRecommended;
                setShowChefRecommended(newChefState);
                updateUrl(searchQuery, selectedCategory, sortBy, newChefState);
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all duration-300 shadow-sm ${
                showChefRecommended
                  ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-white/70 backdrop-blur-sm border border-white/50 text-gray-700 hover:bg-white hover:shadow-md"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
                Chef&apos;s Pick
              </span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 border-t border-orange-100/50 bg-white/50 backdrop-blur-sm">
          <div className="flex gap-2 overflow-x-auto pb-0 scrollbar-hidden">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowChefRecommended(false);
                updateUrl(searchQuery, null, sortBy, false);
              }}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-300 relative ${
                !selectedCategory && !showChefRecommended
                  ? "text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All
              {!selectedCategory && !showChefRecommended && (
                <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" />
              )}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setShowChefRecommended(false);
                  updateUrl(searchQuery, category.id, sortBy, false);
                }}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-300 relative ${
                  selectedCategory === category.id
                    ? "text-orange-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {category.name}
                {selectedCategory === category.id && (
                  <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 border-r-orange-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium text-lg">
              Loading delicious items...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 backdrop-blur-sm border border-red-200/50 rounded-3xl p-8 text-center mb-6 shadow-lg">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-700 font-bold text-lg mb-2">
              Something went wrong
            </p>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => fetchMenu(1)}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold shadow-md hover:scale-105"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Chef Recommendations Section */}
        {!loading &&
          chefRecommendedItems.length > 0 &&
          !selectedCategory &&
          !showChefRecommended && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    👨‍🍳 Chef&apos;s Recommendations
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
            <div className="mb-10">
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
            <div className="mb-6">
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

            <div className="grid grid-cols-2 gap-5">
              {(useFuzzySearch ? fuzzyResults : items).map((item) => (
                <Link
                  key={item.id}
                  href={`/menu/${item.id}?token=${currentToken}`}
                  className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition-all group shadow-sm"
                >
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {item.isChefRecommended && (
                        <span className="inline-block bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          👨‍🍳
                        </span>
                      )}
                      <div>{getStatusBadge(item.status)}</div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 text-xs line-clamp-2 mb-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-bold text-base">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.prepTimeMinutes > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-6 animate-bounce">🍽️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No items found
            </h3>
            <p className="text-gray-600 mb-8 text-lg max-w-sm">
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
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold shadow-md hover:scale-105"
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
