'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CartItem, MenuItem, SelectedModifierDetail } from '@/types/menu';

const CART_STORAGE_PREFIX = 'cart_';

export const useCart = (tableId: string) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (tableId) {
      const stored = localStorage.getItem(`${CART_STORAGE_PREFIX}${tableId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCart(parsed);
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error);
        }
      }
      setIsLoaded(true);
    }
  }, [tableId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && tableId) {
      localStorage.setItem(`${CART_STORAGE_PREFIX}${tableId}`, JSON.stringify(cart));
    }
  }, [cart, isLoaded, tableId]);

  // Add item to cart
  const addToCart = useCallback((
    menuItem: MenuItem,
    selectedModifiers: SelectedModifierDetail[],
    quantity: number = 1
  ) => {
    const totalPrice = calculateItemPrice(menuItem.price, selectedModifiers);
    
    setCart((prev) => {
      // Check if item with same ID and modifiers already exists
      const existingItemIndex = prev.findIndex(item => 
        item.menuItem.id === menuItem.id && 
        areModifiersEqual(item.selectedModifiers, selectedModifiers)
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + quantity
        };
        return newCart;
      }

      // Add as new item
      const cartItem: CartItem = {
        uid: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menuItem,
        selectedModifiers,
        quantity,
        totalPrice,
      };
      return [...prev, cartItem];
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((uid: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.uid === uid) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) {
            return null; // Will be filtered out
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item): item is CartItem => item !== null)
    );
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((uid: string) => {
    setCart((prev) => prev.filter((item) => item.uid !== uid));
  }, []);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calculate total items count
  const getTotalItems = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Calculate subtotal
  const getSubtotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
  }, [cart]);

  // Calculate tax (10%)
  const getTax = useCallback(() => {
    return getSubtotal() * 0.1;
  }, [getSubtotal]);

  // Calculate grand total
  const getTotal = useCallback(() => {
    return getSubtotal() + getTax();
  }, [getSubtotal, getTax]);

  return {
    cart,
    isLoaded,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getSubtotal,
    getTax,
    getTotal,
  };
};

// Helper function to calculate item price with modifiers
const calculateItemPrice = (basePrice: number, modifiers: SelectedModifierDetail[]): number => {
  const modifiersTotal = modifiers.reduce((sum, mod) => sum + mod.priceAdjustment, 0);
  return basePrice + modifiersTotal;
};

// Helper function to compare if two sets of modifiers are identical
const areModifiersEqual = (mods1: SelectedModifierDetail[], mods2: SelectedModifierDetail[]) => {
  if (mods1.length !== mods2.length) return false;
  
  // Sort both to ensure consistent comparison regardless of selection order
  const sorted1 = [...mods1].sort((a, b) => 
    a.groupId.localeCompare(b.groupId) || a.optionId.localeCompare(b.optionId)
  );
  const sorted2 = [...mods2].sort((a, b) => 
    a.groupId.localeCompare(b.groupId) || a.optionId.localeCompare(b.optionId)
  );

  return sorted1.every((mod, index) => 
    mod.groupId === sorted2[index].groupId && 
    mod.optionId === sorted2[index].optionId
  );
};
