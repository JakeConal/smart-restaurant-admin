'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../../components/ui/Toast';
import { apiClient } from '../api/client';

interface EscalationCountResponse {
  count: number;
}

export interface UseEscalationPollingResult {
  count: number;
  isOnline: boolean;
  isPolling: boolean;
  refetch: () => Promise<void>;
}

export interface UseEscalationPollingOptions {
  enabled?: boolean;
  intervalMs?: number;
  onNewEscalation?: (count: number) => void;
  onConnectionLost?: () => void;
  onConnectionRestored?: () => void;
}

const DEFAULT_INTERVAL_MS = 5000; // 5 seconds
const MAX_RETRIES = 2;

export function useEscalationPolling(
  options: UseEscalationPollingOptions = {}
): UseEscalationPollingResult {
  const {
    enabled = true,
    intervalMs = DEFAULT_INTERVAL_MS,
    onNewEscalation,
    onConnectionLost,
    onConnectionRestored,
  } = options;

  const toast = useToast();

  const [count, setCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const previousCountRef = useRef(0);
  const failureCountRef = useRef(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const hasShownOfflineToastRef = useRef(false);
  const hasShownOnlineToastRef = useRef(false);

  const fetchEscalationCount = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    setIsPolling(true);

    try {
      const response = await apiClient.get<EscalationCountResponse>('/api/manager/orders/escalated/count');
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

      // Check for new escalations
      if (data.count > previousCountRef.current) {
        const newEscalationCount = data.count - previousCountRef.current;
        toast.warning(
          `${newEscalationCount} order${newEscalationCount > 1 ? 's' : ''} escalated!`,
          7000 // Show warning longer (7 seconds)
        );
        onNewEscalation?.(data.count);
      }

      previousCountRef.current = data.count;
    } catch (error) {
      console.error('Failed to fetch escalation count:', error);

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
  }, [enabled, isOnline, toast, onNewEscalation, onConnectionLost, onConnectionRestored]);

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
    fetchEscalationCount();

    // Setup polling interval
    intervalIdRef.current = setInterval(fetchEscalationCount, intervalMs);

    // Cleanup
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [enabled, intervalMs, fetchEscalationCount]);

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
    isOnline,
    isPolling,
    refetch: fetchEscalationCount,
  };
}
