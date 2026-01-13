"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { CartItem, MenuItem, CartItemModifier } from "./types";

interface CartContextType {
  items: CartItem[];
  addItem: (
    item: MenuItem,
    quantity: number,
    modifiers: CartItemModifier[],
    specialInstructions?: string,
  ) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Minimal cart item for storage (excludes heavy MenuItem data)
interface MinimalCartItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  quantity: number;
  modifiers: CartItemModifier[];
  specialInstructions?: string;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "smart_restaurant_cart";

// Convert full CartItem to minimal storage format
function toMinimalCartItem(item: CartItem): MinimalCartItem {
  return {
    id: item.id,
    menuItemId: item.menuItem.id,
    menuItemName: item.menuItem.name,
    menuItemPrice: item.menuItem.price,
    quantity: item.quantity,
    modifiers: item.modifiers,
    specialInstructions: item.specialInstructions,
    totalPrice: item.totalPrice,
  };
}

// Reconstruct CartItem from minimal storage (without full MenuItem data)
function fromMinimalCartItem(minimal: MinimalCartItem): CartItem {
  return {
    id: minimal.id,
    menuItem: {
      id: minimal.menuItemId,
      name: minimal.menuItemName,
      price: minimal.menuItemPrice,
      // Other required fields will be filled from menu cache or UI doesn't need them
    } as MenuItem,
    quantity: minimal.quantity,
    modifiers: minimal.modifiers,
    specialInstructions: minimal.specialInstructions,
    totalPrice: minimal.totalPrice,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Use lazy initialization to avoid useEffect setState issue
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const minimalItems: MinimalCartItem[] = JSON.parse(stored);
          return minimalItems.map(fromMinimalCartItem);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Save cart to storage whenever it changes (only store minimal data)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const minimalItems = items.map(toMinimalCartItem);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(minimalItems));
      } catch (error) {
        console.error("Failed to save cart to storage:", error);
        // Silently fail - don't break the app if storage is full
      }
    }
  }, [items]);

  const calculateItemPrice = (
    menuItem: MenuItem,
    quantity: number,
    modifiers: CartItemModifier[],
  ): number => {
    const basePrice = menuItem.price;
    const modifiersTotal = modifiers.reduce(
      (sum, mod) => sum + mod.priceAdjustment,
      0,
    );
    return (basePrice + modifiersTotal) * quantity;
  };

  const addItem = useCallback(
    (
      menuItem: MenuItem,
      quantity: number,
      modifiers: CartItemModifier[],
      specialInstructions?: string,
    ) => {
      const itemId = `${menuItem.id}-${modifiers
        .map((m) => m.optionId)
        .sort()
        .join("-")}-${Date.now()}`;
      const totalPrice = calculateItemPrice(menuItem, quantity, modifiers);

      const newItem: CartItem = {
        id: itemId,
        menuItem,
        quantity,
        modifiers,
        specialInstructions,
        totalPrice,
      };

      setItems((prev) => [...prev, newItem]);
    },
    [],
  );

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const totalPrice = calculateItemPrice(
            item.menuItem,
            quantity,
            item.modifiers,
          );
          return { ...item, quantity, totalPrice };
        }
        return item;
      }),
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getTotalItems = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
