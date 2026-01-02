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
    <div className="min-h-screen pb-24 safe-bottom bg-neutral-50">
      {/* Header */}
      <div className="pt-12 px-6 bg-gradient-to-b from-white to-transparent">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 rounded-xl bg-white shadow-sm border border-neutral-200 flex items-center justify-center interactive focus-ring">
              <svg
                className="w-5 h-5 text-neutral-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {tableNumber && (
              <div className="badge bg-blue-50 text-blue-700 border border-blue-200">
                Table {tableNumber}
              </div>
            )}
          </div>
          <Link
            href={`/cart?token=${currentToken}`}
            className="relative interactive focus-ring rounded-xl"
          >
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-neutral-200 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-neutral-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            {getTotalItems() > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg">
                {getTotalItems()}
              </div>
            )}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-display-lg text-neutral-900 mb-2 animate-fade-in">
            Delicious
            <br />
            food for you
          </h1>
          <p className="text-body-lg text-neutral-600">
            Fresh meals crafted with care
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-6 mb-8">
        <div className="input-with-icon animate-slide-in-up">
          <div className="input-icon">
            <svg
              className="w-5 h-5"
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
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input text-body-lg h-14 shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <div className="flex gap-8 px-6 overflow-x-auto scrollbar-hidden pb-4">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowChefRecommended(false);
            }}
            className={`whitespace-nowrap text-label-lg transition-all interactive ${
              !selectedCategory && !showChefRecommended
                ? "text-blue-600 font-medium"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            All
          </button>
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setShowChefRecommended(false);
              }}
              className={`whitespace-nowrap text-label-lg transition-all interactive ${
                selectedCategory === category.id
                  ? "text-blue-600 font-medium"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="px-6">
          <div
            className="h-0.5 bg-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{
              width: "64px",
              marginLeft: selectedCategory
                ? `${(categories.findIndex((c) => c.id === selectedCategory) + 1) * 80}px`
                : "0px",
            }}
          />
        </div>
      </div>

      {/* Sort and filter options */}
      <div className="flex gap-3 px-6 mb-8 overflow-x-auto scrollbar-hidden">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="btn btn-secondary btn-md min-w-max focus-ring"
        >
          <option value="name">Sort by Name</option>
          <option value="popularity">Sort by Popularity</option>
        </select>
        <button
          onClick={() => setShowChefRecommended(!showChefRecommended)}
          className={`btn btn-md whitespace-nowrap transition-all ${
            showChefRecommended ? "btn-primary" : "btn-secondary"
          }`}
        >
          <span className="mr-2">👨‍🍳</span>
          Chef's Pick
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
          <div className="w-12 h-12 border-3 border-neutral-200 border-t-blue-600 rounded-full spinner mb-4"></div>
          <p className="text-body-lg text-neutral-600">
            Loading delicious options...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mx-6 mb-6">
          <div className="card card-body bg-red-50 border-red-200 text-center animate-slide-in-up">
            <div className="text-4xl mb-3">😔</div>
            <h3 className="text-heading-sm text-red-900 mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-body-md text-red-700 mb-4">{error}</p>
            <button
              onClick={() => fetchMenu(1)}
              className="btn btn-primary btn-md mx-auto"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Chef Recommended Section */}
      {!loading &&
        chefRecommendedItems.length > 0 &&
        !selectedCategory &&
        !showChefRecommended && (
          <div className="mb-8">
            <div className="flex justify-between items-center px-6 mb-6">
              <div>
                <h2 className="text-heading-lg text-neutral-900 mb-1">
                  👨‍🍳 Chef&apos;s Recommendations
                </h2>
                <p className="text-body-md text-neutral-600">
                  Hand-picked favorites from our kitchen
                </p>
              </div>
              <button
                onClick={() => setShowChefRecommended(true)}
                className="text-blue-600 text-label-md font-medium interactive"
              >
                See all
              </button>
            </div>
            <div className="flex gap-6 px-6 overflow-x-auto scrollbar-hidden pb-4">
              {chefRecommendedItems.slice(0, 5).map((item, index) => (
                <Link
                  key={item.id}
                  href={`/menu/${item.id}?token=${currentToken}`}
                  className="card card-interactive flex-shrink-0 w-52 p-0 relative overflow-hidden animate-slide-in-left"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
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
                    <div className="absolute top-3 left-3">
                      <div className="badge badge-success text-xs">
                        Chef's Pick
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-label-lg text-neutral-900 mb-1 line-clamp-2 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-heading-md text-blue-600 font-semibold">
                      ${item.price.toFixed(2)}
                    </p>
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
            <div className="flex justify-between items-center px-6 mb-6">
              <div>
                <h2 className="text-heading-lg text-neutral-900 mb-1">
                  🔥 Popular Items
                </h2>
                <p className="text-body-md text-neutral-600">
                  Customer favorites you'll love
                </p>
              </div>
              <button
                onClick={() => setSortBy("popularity")}
                className="text-blue-600 text-label-md font-medium interactive"
              >
                See all
              </button>
            </div>
            <div className="flex gap-6 px-6 overflow-x-auto scrollbar-hidden pb-4">
              {popularItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/menu/${item.id}?token=${currentToken}`}
                  className="card card-interactive flex-shrink-0 w-52 p-0 relative overflow-hidden animate-slide-in-left"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
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
                    <div className="absolute top-3 left-3">
                      <div className="badge badge-warning text-xs">Popular</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-label-lg text-neutral-900 mb-1 line-clamp-2 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-heading-md text-blue-600 font-semibold">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      {/* All Items Grid */}
      {!loading && items.length > 0 && (
        <div className="px-6 mb-8">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-heading-lg text-neutral-900">
              {showChefRecommended
                ? "Chef's Recommendations"
                : selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name
                  : "All Items"}
            </h2>
            <span className="text-body-md text-neutral-500">
              {totalItems} items
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, index) => (
              <Link
                key={item.id}
                href={`/menu/${item.id}?token=${currentToken}`}
                className="card card-interactive p-0 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
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

                  {/* Status and Chef Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {getStatusBadge(item.status)}
                    {item.isChefRecommended && (
                      <div className="badge badge-success text-xs">👨‍🍳 Chef</div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-label-lg text-neutral-900 mb-1 line-clamp-2 leading-tight">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-heading-md text-blue-600 font-semibold">
                      ${item.price.toFixed(2)}
                    </p>
                    {item.prepTimeMinutes > 0 && (
                      <div className="flex items-center gap-1 text-neutral-500 text-xs">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v5a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 10.586V5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {item.prepTimeMinutes}min
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8 animate-fade-in">
          <div className="w-8 h-8 border-3 border-neutral-200 border-t-blue-600 rounded-full spinner"></div>
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-4" />

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-24 h-24 bg-neutral-100 rounded-3xl flex items-center justify-center mb-6">
            <div className="text-5xl">🍽️</div>
          </div>
          <h3 className="text-heading-lg text-neutral-900 mb-2">
            No items found
          </h3>
          <p className="text-body-lg text-neutral-600 text-center mb-6 max-w-sm">
            {searchQuery
              ? "We couldn't find any dishes matching your search. Try a different term."
              : "No menu items are available in this category right now."}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setShowChefRecommended(false);
              }}
              className="btn btn-primary btn-lg"
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
