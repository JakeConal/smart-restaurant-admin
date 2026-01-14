"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

interface BottomNavProps {
  token: string;
  action?: {
    label: string;
    subLabel?: string;
    amount?: number;
    tax?: number;
    count?: number;
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  };
}

export default function BottomNav({ token, action }: BottomNavProps) {
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
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      name: "Cart",
      path: "/cart",
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: "Orders",
      path: "/order-tracking",
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      name: "Profile",
      path: "/profile",
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const showCartSummary = totalItems > 0 && pathname !== "/cart";
  const totalPrice = useCart().getTotalPrice();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Priority Action (Checkout/Complete Order) */}
        {action ? (
          <button
            onClick={action.onClick}
            disabled={action.disabled || action.isLoading}
            className="w-full flex items-center justify-between p-5 bg-white/5 border-b border-white/10 active:bg-white/10 transition-all disabled:opacity-50 group/action"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {action.count !== undefined && (
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white ring-1 ring-white/20 group-hover/action:ring-white/40 transition-all font-black text-sm shrink-0">
                  {action.count}
                </div>
              )}
              <div className="text-left min-w-0">
                {action.subLabel && (
                  <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40 leading-none mb-1.5 truncate">
                    {action.subLabel}
                  </h4>
                )}
                <p className="text-sm font-black text-white tracking-widest uppercase leading-none whitespace-nowrap">
                  {action.label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {action.amount !== undefined && (
                <div className="text-right">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40 leading-none mb-1.5 whitespace-nowrap">
                    {action.tax !== undefined ? `Inc. $${action.tax.toFixed(2)} Tax` : 'Total'}
                  </h4>
                  <p className="text-lg font-black text-white leading-none">${action.amount.toFixed(2)}</p>
                </div>
              )}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${action.isLoading ? "bg-white/10" : "bg-white text-slate-900 shadow-xl group-hover/action:bg-emerald-400 group-hover/action:text-white"}`}>
                {action.isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ) : (
          /* Integrated Cart Summary */
          showCartSummary && (
            <Link
              href={`/cart?token=${token}`}
              className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10 active:bg-white/10 transition-colors group/cart"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white ring-1 ring-white/20 group-hover/cart:ring-white/40 transition-all">
                  <span className="font-black text-lg">{totalItems}</span>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-1">Items in Cart</h4>
                  <p className="text-sm font-bold text-white tracking-wide">Review Order</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-1">Total Est.</h4>
                  <p className="text-sm font-black text-white">${totalPrice.toFixed(2)}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 group-hover/cart:text-white group-hover/cart:bg-white/20 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )
        )}

        {/* Navigation Section */}
        <nav className="flex justify-around items-center h-20 px-3">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={`${item.path}?token=${token}`}
                className={`flex-1 flex flex-col items-center justify-center py-4 relative group transition-all duration-300`}
              >
                {/* Active Glow */}
                {active && (
                  <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md -z-10" />
                )}

                {/* Icon wrapper */}
                <div className={`transition-all duration-300 transform ${active ? "text-white -translate-y-1.5 scale-110" : "text-slate-500 group-hover:text-slate-300 scale-100"}`}>
                  {item.icon(active)}
                </div>

                {/* Active Indicator */}
                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white transition-all duration-500 ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`} />

                {/* Individual Icon Badges (Subtle) */}
                {item.path === "/cart" && totalItems > 0 && !showCartSummary && (
                  <div className="absolute top-2 right-1/4 bg-white text-slate-900 text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-900 ring-1 ring-white/20">
                    {totalItems}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
