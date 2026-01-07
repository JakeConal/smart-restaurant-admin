"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { menuApi } from "@/lib/api";
import type { MenuItem, MenuResponse } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

const STORAGE_KEY = "smart_restaurant_favorites";

function FavoritesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useApp();

  const [favorites, setFavorites] = useState<string[]>(() => {
    // Initialize from localStorage during SSR-safe initial render
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  const currentToken = searchParams.get("token") || token;

  // Fetch favorite items details
  useEffect(() => {
    const fetchFavoriteItems = async () => {
      if (favorites.length === 0) {
        setItems([]);
        return;
      }

      setLoading(true);

      // For now, we'll fetch all menu items and filter
      // In production, there should be an endpoint to fetch by IDs
      try {
        const response = (await menuApi.getMenu(currentToken || "", {
          limit: 100,
        })) as MenuResponse;
        const favoriteItems = response.menu.items.filter((item: MenuItem) =>
          favorites.includes(item.id),
        );
        setItems(favoriteItems);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteItems();
  }, [favorites, currentToken]);

  const removeFavorite = (itemId: string) => {
    const updated = favorites.filter((id) => id !== itemId);
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const getItemPhoto = (item: MenuItem) => {
    if (item.primaryPhotoUrl) {
      return item.primaryPhotoUrl;
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-24 safe-bottom">
      {/* Header */}
      <div className="pt-8 px-6">
        <button onClick={() => router.back()} className="mb-4">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-3xl font-bold mb-6">Favorites</h1>
      </div>

      {/* Content */}
      <div className="px-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-gray-500 mb-6">
              Start adding items to your favorites while browsing the menu
            </p>
            <button
              onClick={() => router.push(`/menu?token=${currentToken}`)}
              className="px-8 py-3 bg-[#fa4a0c] text-white rounded-full font-semibold"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden relative"
              >
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(item.id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center z-10 shadow-sm"
                >
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                <button
                  onClick={() =>
                    router.push(`/menu/${item.id}?token=${currentToken}`)
                  }
                  className="w-full text-left"
                >
                  {/* Image */}
                  <div className="aspect-square relative bg-gray-100">
                    {getItemPhoto(item) ? (
                      <Image
                        src={getItemPhoto(item)!}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🍽️
                      </div>
                    )}
                    {item.status !== "available" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {item.status === "sold_out"
                            ? "Sold Out"
                            : "Unavailable"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-[#fa4a0c] font-bold mt-1">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav token={currentToken || ""} />
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#fa4a0c] border-t-transparent rounded-full spinner"></div>
        </div>
      }
    >
      <FavoritesContent />
    </Suspense>
  );
}
