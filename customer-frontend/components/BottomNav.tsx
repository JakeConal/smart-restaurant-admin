"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

interface BottomNavProps {
  token: string;
}

export default function BottomNav({ token }: BottomNavProps) {
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  const isActive = (path: string) => {
    if (path === "/menu") {
      return pathname === "/menu" || pathname.startsWith("/menu/");
    }
    return pathname === path;
  };

  const navItems = [
    {
      name: "Menu",
      path: "/menu",
      icon: (active: boolean) => (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      name: "Cart",
      path: "/cart",
      icon: (active: boolean) => (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5m0 0H3m2.4 0a1 1 0 00-.8.4m0 0l-1.6 2.6a1 1 0 00.8 1.6h16l1.6-2.6a1 1 0 00-.8-1.6M9 19a2 2 0 11-4 0 2 2 0 014 0m9 0a2 2 0 11-4 0 2 2 0 014 0"
          />
        </svg>
      ),
    },
    {
      name: "Orders",
      path: "/order-tracking",
      icon: (active: boolean) => (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      name: "Profile",
      path: "/profile",
      icon: (active: boolean) => (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-40 shadow-xl">
      <div className="flex justify-around h-16 md:h-20">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={`${item.path}?token=${token}`}
              className={`flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 transition-all duration-200 relative group cursor-pointer hover:bg-gray-50 ${
                active ? "text-red-600" : "text-gray-600"
              }`}
            >
              {/* Active indicator line */}
              {active && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-b-lg animate-fade-in" />
              )}

              {/* Icon container */}
              <div
                className={`relative transition-transform duration-200 ${
                  active ? "scale-110" : "group-hover:scale-105"
                }`}
              >
                {item.icon(active)}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-semibold transition-colors duration-200 ${
                  active
                    ? "text-red-600"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              >
                {item.name}
              </span>

              {/* Cart badge */}
              {item.path === "/cart" && totalItems > 0 && (
                <div className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg animate-pulse">
                  {totalItems > 99 ? "99+" : totalItems}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
