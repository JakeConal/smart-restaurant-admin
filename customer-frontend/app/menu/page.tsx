"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { useCart } from "@/lib/cart-context";
import { menuApi } from "@/lib/api";
import { MenuItem, MenuCategory, MenuResponse } from "@/lib/types";
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const observerRef = useRef<HTMLDivElement>(null);
  const currentToken = searchParams.get("token") || token;

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentToken) {
      router.replace("/login");
      return;
    }

    if (currentToken && !token) {
      setToken(currentToken);
    }

    if (!isAuthenticated) {
      router.replace(`/login?token=${currentToken}`);
    }
  }, [currentToken, token, isAuthenticated, router, setToken]);

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

        const response = (await menuApi.getMenu(currentToken, {
          q: searchQuery || undefined,
          categoryId: selectedCategory || undefined,
          sort: sortBy,
          chefRecommended: showChefRecommended || undefined,
          page: pageNum,
          limit: 10,
        })) as MenuResponse;

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

  // Initial load and filter changes
  useEffect(() => {
    if (currentToken && isAuthenticated) {
      fetchMenu(1, false);
    }
  }, [
    currentToken,
    isAuthenticated,
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
    <div className="min-h-screen bg-white pb-24 safe-bottom">
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">🍽️</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Menu</h1>
                {tableNumber && (
                  <p className="text-xs text-gray-500">Table {tableNumber}</p>
                )}
              </div>
            </div>
            <Link
              href={`/cart?token=${currentToken}`}
              className="relative p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
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
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {getTotalItems()}
                </div>
              )}
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <svg
              className="absolute left-3.5 top-3 w-5 h-5 text-gray-400"
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
            />
          </div>

          {/* Sort & Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hidden">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all whitespace-nowrap cursor-pointer"
            >
              <option value="name">Name</option>
              <option value="popularity">Popular</option>
            </select>

            <button
              onClick={() => setShowChefRecommended(!showChefRecommended)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                showChefRecommended
                  ? "bg-orange-500 text-white border border-orange-500"
                  : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              👨‍🍳 Chef&apos;s Pick
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 border-t border-gray-100">
          <div className="flex gap-2 overflow-x-auto pb-0 scrollbar-hidden">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowChefRecommended(false);
              }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                !selectedCategory && !showChefRecommended
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
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
                }}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  selectedCategory === category.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading delicious items...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
            <p className="text-red-700 font-medium mb-4">{error}</p>
            <button
              onClick={() => fetchMenu(1)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    👨‍🍳 Chef&apos;s Recommendations
                  </h2>
                  <p className="text-sm text-gray-600">
                    Hand-picked favorites from our kitchen
                  </p>
                </div>
                <button
                  onClick={() => setShowChefRecommended(true)}
                  className="text-orange-600 text-sm font-semibold hover:text-orange-700 transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden -mx-6 px-6">
                {chefRecommendedItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu/${item.id}?token=${currentToken}`}
                    className="flex-shrink-0 w-44 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all"
                  >
                    <div className="h-28 bg-gray-100 relative overflow-hidden">
                      {item.primaryPhotoUrl ? (
                        <Image
                          src={item.primaryPhotoUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="inline-block bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Chef Pick
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                        {item.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600 font-bold text-lg">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.prepTimeMinutes > 0 && (
                          <span className="text-xs text-gray-500">
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
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    🔥 Popular Right Now
                  </h2>
                  <p className="text-sm text-gray-600">Customer favorites</p>
                </div>
                <button
                  onClick={() => setSortBy("popularity")}
                  className="text-orange-600 text-sm font-semibold hover:text-orange-700 transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden -mx-6 px-6">
                {popularItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu/${item.id}?token=${currentToken}`}
                    className="flex-shrink-0 w-44 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all"
                  >
                    <div className="h-28 bg-gray-100 relative overflow-hidden">
                      {item.primaryPhotoUrl ? (
                        <Image
                          src={item.primaryPhotoUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Popular
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                        {item.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600 font-bold text-lg">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.prepTimeMinutes > 0 && (
                          <span className="text-xs text-gray-500">
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
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {showChefRecommended
                  ? "Chef's Recommendations"
                  : selectedCategory
                    ? categories.find((c) => c.id === selectedCategory)?.name
                    : "All Items"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {totalItems} items available
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/menu/${item.id}?token=${currentToken}`}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-orange-300 transition-all group"
                >
                  <div className="h-32 bg-gray-100 relative overflow-hidden">
                    {item.primaryPhotoUrl ? (
                      <Image
                        src={item.primaryPhotoUrl}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🍽️
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {item.isChefRecommended && (
                        <span className="inline-block bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          👨‍🍳
                        </span>
                      )}
                      <div className="text-xs">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                      {item.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-bold">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.prepTimeMinutes > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600 mb-6">
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
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Clear Filters
              </button>
            )}
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
