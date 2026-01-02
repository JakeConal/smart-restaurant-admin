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

  // Get token from URL or context
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

  // Update URL with current filters
  const updateUrl = useCallback((params: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.replaceState({}, "", url.toString());
  }, []);

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
          // Set table info
          if (response.table) {
            setTableInfo({
              tableId: response.table.id,
              restaurantId: "", // Will be set from token
              tableNumber: response.table.tableNumber,
            });
          }

          // Set categories (only on first load)
          if (pageNum === 1) {
            setCategories(response.menu.categories);
          }

          // Set items
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
      updateUrl({
        q: searchQuery || null,
        category: selectedCategory,
        sort: sortBy !== "name" ? sortBy : null,
        chefRecommended: showChefRecommended ? "true" : null,
      });
    }
  }, [
    currentToken,
    isAuthenticated,
    searchQuery,
    selectedCategory,
    sortBy,
    showChefRecommended,
    fetchMenu,
    updateUrl,
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

  // Get popular items (top 5 by popularity score)
  const popularItems = [...items]
    .filter((item) => item.popularityScore > 0)
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full status-available">
            Available
          </span>
        );
      case "unavailable":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full status-unavailable">
            Unavailable
          </span>
        );
      case "sold_out":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full status-sold-out">
            Sold Out
          </span>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen pb-24 safe-bottom">
      {/* Header */}
      <div className="pt-8 px-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <button className="w-6 h-6">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {tableNumber && (
              <span className="px-3 py-1 bg-[#fa4a0c] text-white text-sm font-medium rounded-full">
                Table {tableNumber}
              </span>
            )}
          </div>
          <Link href={`/cart?token=${currentToken}`} className="relative">
            <svg
              className="w-6 h-6"
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
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#fa4a0c] text-white text-xs rounded-full flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </Link>
        </div>

        <h1 className="text-3xl font-bold leading-tight">
          Delicious
          <br />
          food for you
        </h1>
      </div>

      {/* Search bar */}
      <div className="px-6 mt-6">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-gray-400"
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
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-[#efeeee] rounded-full text-base focus:ring-2 focus:ring-[#fa4a0c]"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mt-6">
        <div className="flex gap-6 px-6 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowChefRecommended(false);
            }}
            className={`whitespace-nowrap text-base transition-colors ${
              !selectedCategory && !showChefRecommended
                ? "text-[#fa4a0c] font-medium"
                : "text-gray-400"
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
              className={`whitespace-nowrap text-base transition-colors ${
                selectedCategory === category.id
                  ? "text-[#fa4a0c] font-medium"
                  : "text-gray-400"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="px-6 mt-2">
          <div
            className="h-[3px] bg-[#fa4a0c] rounded-full transition-all duration-300"
            style={{
              width: "80px",
              marginLeft: selectedCategory
                ? `${(categories.findIndex((c) => c.id === selectedCategory) + 1) * 70}px`
                : "0px",
            }}
          />
        </div>
      </div>

      {/* Sort and filter options */}
      <div className="flex gap-2 px-6 mt-4 overflow-x-auto hide-scrollbar">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-white rounded-full text-sm border border-gray-200"
        >
          <option value="name">Sort by Name</option>
          <option value="popularity">Sort by Popularity</option>
        </select>
        <button
          onClick={() => setShowChefRecommended(!showChefRecommended)}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
            showChefRecommended
              ? "bg-[#fa4a0c] text-white"
              : "bg-white border border-gray-200"
          }`}
        >
          👨‍🍳 Chef&apos;s Pick
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
          {error}
          <button
            onClick={() => fetchMenu(1)}
            className="block w-full mt-2 text-[#fa4a0c] font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Chef Recommended Section */}
      {!loading &&
        chefRecommendedItems.length > 0 &&
        !selectedCategory &&
        !showChefRecommended && (
          <div className="mt-6">
            <div className="flex justify-between items-center px-6 mb-4">
              <h2 className="text-lg font-semibold">
                👨‍🍳 Chef&apos;s Recommendations
              </h2>
              <button
                onClick={() => setShowChefRecommended(true)}
                className="text-[#fa4a0c] text-sm"
              >
                see more
              </button>
            </div>
            <div className="flex gap-4 px-6 overflow-x-auto hide-scrollbar pb-4">
              {chefRecommendedItems.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/menu/${item.id}?token=${currentToken}`}
                  className="flex-shrink-0 w-48 bg-white rounded-3xl shadow-lg overflow-hidden pt-12 pb-4 px-4 relative"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full overflow-hidden bg-gray-100">
                    {item.primaryPhotoUrl ? (
                      <Image
                        src={item.primaryPhotoUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <p className="text-center font-semibold mt-12 line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-center text-[#fa4a0c] font-bold mt-2">
                    ${item.price.toFixed(2)}
                  </p>
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
          <div className="mt-6">
            <div className="flex justify-between items-center px-6 mb-4">
              <h2 className="text-lg font-semibold">🔥 Popular Items</h2>
              <button
                onClick={() => setSortBy("popularity")}
                className="text-[#fa4a0c] text-sm"
              >
                see more
              </button>
            </div>
            <div className="flex gap-4 px-6 overflow-x-auto hide-scrollbar pb-4">
              {popularItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/menu/${item.id}?token=${currentToken}`}
                  className="flex-shrink-0 w-48 bg-white rounded-3xl shadow-lg overflow-hidden pt-12 pb-4 px-4 relative"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full overflow-hidden bg-gray-100">
                    {item.primaryPhotoUrl ? (
                      <Image
                        src={item.primaryPhotoUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <p className="text-center font-semibold mt-12 line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-center text-[#fa4a0c] font-bold mt-2">
                    ${item.price.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

      {/* All Items Grid */}
      {!loading && items.length > 0 && (
        <div className="mt-6 px-6">
          <h2 className="text-lg font-semibold mb-4">
            {showChefRecommended
              ? "Chef's Recommendations"
              : selectedCategory
                ? categories.find((c) => c.id === selectedCategory)?.name
                : "All Items"}
            <span className="text-gray-400 text-sm font-normal ml-2">
              ({totalItems})
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/menu/${item.id}?token=${currentToken}`}
                className="bg-white rounded-3xl shadow-lg overflow-hidden pt-14 pb-4 px-4 relative"
              >
                <div className="absolute top-2 left-2">
                  {getStatusBadge(item.status)}
                </div>
                {item.isChefRecommended && (
                  <div className="absolute top-2 right-2 text-lg">👨‍🍳</div>
                )}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full overflow-hidden bg-gray-100">
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
                </div>
                <p className="text-center font-semibold mt-8 line-clamp-2 text-sm">
                  {item.name}
                </p>
                <p className="text-center text-[#fa4a0c] font-bold mt-1">
                  ${item.price.toFixed(2)}
                </p>
                {item.prepTimeMinutes > 0 && (
                  <p className="text-center text-gray-400 text-xs mt-1">
                    ~{item.prepTimeMinutes} min
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-4" />

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-xl font-semibold mb-2">No items found</h2>
          <p className="text-gray-500 text-center">
            {searchQuery
              ? "Try a different search term"
              : "No menu items available in this category"}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setShowChefRecommended(false);
              }}
              className="mt-4 px-6 py-2 bg-[#fa4a0c] text-white rounded-full"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      <BottomNav token={currentToken || ""} />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
