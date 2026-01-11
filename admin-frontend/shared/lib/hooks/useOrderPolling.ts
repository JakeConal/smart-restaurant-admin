'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../../components/ui/Toast';
import { apiClient } from '../api/client';

interface OrderCountResponse {
  count: number;
  oldestOrderMinutes: number | null;
}

export interface UseOrderPollingResult {
  count: number;
  oldestOrderMinutes: number | null;
  isOnline: boolean;
  isPolling: boolean;
  refetch: () => Promise<void>;
}

export interface UseOrderPollingOptions {
  enabled?: boolean;
  intervalMs?: number;
  onNewOrder?: (count: number) => void;
  onConnectionLost?: () => void;
  onConnectionRestored?: () => void;
}

const DEFAULT_INTERVAL_MS = 5000; // 5 seconds
const MAX_RETRIES = 2;

export function useOrderPolling(
  options: UseOrderPollingOptions = {}
): UseOrderPollingResult {
  const {
    enabled = true,
    intervalMs = DEFAULT_INTERVAL_MS,
    onNewOrder,
    onConnectionLost,
    onConnectionRestored,
  } = options;

  const toast = useToast();

  const [count, setCount] = useState(0);
  const [oldestOrderMinutes, setOldestOrderMinutes] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const previousCountRef = useRef(0);
  const failureCountRef = useRef(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const hasShownOfflineToastRef = useRef(false);
  const hasShownOnlineToastRef = useRef(false);

  const fetchOrderCount = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    setIsPolling(true);

    try {
      const response = await apiClient.get<OrderCountResponse>('/api/waiter/orders/pending/count');
      const data = response.data;

      if (!isMountedRef.current) return;

      // Reset failure count on success
      failureCountRef.current = 0;

      // Check if we went from offline to online
      if (!isOnline) {
        setIsOnline(true);
        if (!hasShownOnlineToastRef.current) {
          toast.success('Connection restored');
          hasShownOnlineToastRef.current = true;
          hasShownOfflineToastRef.current = false;
        }
        onConnectionRestored?.();
      }

      // Update state
      setCount(data.count);
      setOldestOrderMinutes(data.oldestOrderMinutes);

      // Check for new orders
      if (data.count > previousCountRef.current) {
        const newOrderCount = data.count - previousCountRef.current;
        toast.info(
          `${newOrderCount} new order${newOrderCount > 1 ? 's' : ''} received!`
        );
        onNewOrder?.(data.count);
      }

      previousCountRef.current = data.count;
    } catch (error) {
      console.error('Failed to fetch order count:', error);

      failureCountRef.current += 1;

      // Set offline after MAX_RETRIES failed attempts
      if (failureCountRef.current >= MAX_RETRIES && isOnline) {
        setIsOnline(false);
        if (!hasShownOfflineToastRef.current) {
          toast.error('Connection lost. Trying to reconnect...');
          hasShownOfflineToastRef.current = true;
          hasShownOnlineToastRef.current = false;
        }
        onConnectionLost?.();
      }
    } finally {
      if (isMountedRef.current) {
        setIsPolling(false);
      }
    }
  }, [enabled, isOnline, toast, onNewOrder, onConnectionLost, onConnectionRestored]);

  // Initial fetch and setup polling
  useEffect(() => {
    if (!enabled) {
      // Clear interval if disabled
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchOrderCount();

    // Setup polling interval
    intervalIdRef.current = setInterval(fetchOrderCount, intervalMs);

    // Cleanup
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [enabled, intervalMs, fetchOrderCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, []);

  return {
    count,
    oldestOrderMinutes,
    isOnline,
    isPolling,
    refetch: fetchOrderCount,
  };
}
