'use client';

import { useState } from 'react';

export interface BottomSheetState {
  [key: string]: boolean;
}

export const useBottomSheet = () => {
  const [openSheets, setOpenSheets] = useState<BottomSheetState>({});

  const openSheet = (id: string) => {
    setOpenSheets((prev) => ({ ...prev, [id]: true }));
    // Lock body scroll
    document.body.style.overflow = 'hidden';
  };

  const closeSheet = (id: string) => {
    setOpenSheets((prev) => ({ ...prev, [id]: false }));
    
    // Check if any other sheets are still open
    const anyOpen = Object.entries(openSheets).some(
      ([key, value]) => key !== id && value
    );
    
    // Unlock body scroll if no sheets are open
    if (!anyOpen) {
      document.body.style.overflow = 'auto';
    }
  };

  const closeAllSheets = () => {
    setOpenSheets({});
    document.body.style.overflow = 'auto';
  };

  const isSheetOpen = (id: string) => {
    return openSheets[id] || false;
  };

  const hasOpenSheet = () => {
    return Object.values(openSheets).some((value) => value);
  };

  return {
    openSheet,
    closeSheet,
    closeAllSheets,
    isSheetOpen,
    hasOpenSheet,
  };
};
