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
      name: "Home",
      path: "/menu",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 transition-all duration-300 ${active ? "scale-110" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            fill={active ? "#fa4a0c" : "currentColor"}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      ),
    },
    {
      name: "Cart",
      path: "/cart",
      icon: (active: boolean) => (
        <div className="relative">
          <svg
            className={`w-6 h-6 transition-all duration-300 ${active ? "scale-110" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              fill={active ? "#fa4a0c" : "currentColor"}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {totalItems > 0 && (
            <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse shadow-lg">
              {totalItems > 99 ? "99+" : totalItems}
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Orders",
      path: "/order-tracking",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 transition-all duration-300 ${active ? "scale-110" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            fill={active ? "#fa4a0c" : "currentColor"}
            d="M9 2C7.34315 2 6 3.34315 6 5V19C6 20.6569 7.34315 22 9 22H15C16.6569 22 18 20.6569 18 19V5C18 3.34315 16.6569 2 15 2H9Z M9 4H15C15.5523 4 16 4.44772 16 5V19C16 19.5523 15.5523 20 15 20H9C8.44772 20 8 19.5523 8 19V5C8 4.44772 8.44772 4 9 4Z M10 7H14V9H10V7Z M10 11H14V13H10V11Z M10 15H14V17H10V15Z"
          />
        </svg>
      ),
    },
    {
      name: "Profile",
      path: "/profile",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 transition-all duration-300 ${active ? "scale-110" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            fill={active ? "#fa4a0c" : "currentColor"}
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-orange-100 safe-bottom z-40 shadow-2xl">
      <div className="max-w-md mx-auto px-6">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={`${item.path}?token=${token}`}
                className={`relative flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  active
                    ? "text-orange-600 bg-orange-50 shadow-lg transform scale-105"
                    : "text-neutral-500 hover:text-orange-500 hover:bg-orange-50/50"
                }`}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-full animate-fade-in" />
                )}

                {/* Icon with hover effect */}
                <div className="relative">
                  {item.icon(active)}
                  {!active && (
                    <div className="absolute inset-0 bg-orange-500/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-medium transition-all duration-300 ${
                    active
                      ? "text-orange-600"
                      : "text-neutral-500 group-hover:text-orange-500"
                  }`}
                >
                  {item.name}
                </span>

                {/* Subtle glow effect for active state */}
                {active && (
                  <div className="absolute inset-0 bg-orange-500/5 rounded-2xl animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
