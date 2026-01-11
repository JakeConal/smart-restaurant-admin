/**
 * Offline Queue Processor
 * Handles retrying queued operations when connection is restored
 */

const OFFLINE_QUEUE_KEY = 'waiter_offline_rejection_queue';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface QueuedRejection {
  orderId: string;
  reason: string;
  timestamp: number;
}

interface ProcessResult {
  success: number;
  failed: number;
  errors: Array<{ orderId: string; error: string }>;
}

/**
 * Get all queued rejections from localStorage
 */
export function getQueuedRejections(): QueuedRejection[] {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queue) return [];
    return JSON.parse(queue);
  } catch (error) {
    console.error('Failed to read offline queue:', error);
    return [];
  }
}

/**
 * Clear all queued rejections
 */
export function clearQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Failed to clear offline queue:', error);
  }
}

/**
 * Remove a specific rejection from the queue
 */
function removeFromQueue(orderId: string): void {
  try {
    const queue = getQueuedRejections();
    const filtered = queue.filter((item) => item.orderId !== orderId);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from queue:', error);
  }
}

/**
 * Process a single queued rejection
 */
async function processRejection(rejection: QueuedRejection): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/waiter/orders/${rejection.orderId}/reject`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reason: rejection.reason }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reject order');
  }
}

/**
 * Process all queued rejections
 */
export async function processOfflineQueue(): Promise<ProcessResult> {
  const queue = getQueuedRejections();
  
  if (queue.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  console.log(`Processing ${queue.length} queued rejection(s)...`);

  const results: ProcessResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const rejection of queue) {
    try {
      await processRejection(rejection);
      removeFromQueue(rejection.orderId);
      results.success++;
      console.log(`Successfully processed rejection for order ${rejection.orderId}`);
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push({
        orderId: rejection.orderId,
        error: errorMessage,
      });
      console.error(`Failed to process rejection for order ${rejection.orderId}:`, error);
    }
  }

  return results;
}

/**
 * Initialize offline queue processor
 * Sets up event listener for when connection is restored
 */
export function initializeOfflineQueueProcessor(): () => void {
  const handleOnline = async () => {
    console.log('Connection restored, processing offline queue...');
    
    try {
      const results = await processOfflineQueue();
      
      if (results.success > 0) {
        console.log(`Successfully processed ${results.success} queued rejection(s)`);
        
        // Show success notification if available
        if (typeof window !== 'undefined' && 'dispatchEvent' in window) {
          window.dispatchEvent(
            new CustomEvent('offline-queue-processed', {
              detail: { results },
            })
          );
        }
      }
      
      if (results.failed > 0) {
        console.warn(`Failed to process ${results.failed} rejection(s):`, results.errors);
      }
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  };

  // Add event listener
  window.addEventListener('online', handleOnline);

  // Check immediately if online
  if (navigator.onLine) {
    const queue = getQueuedRejections();
    if (queue.length > 0) {
      console.log('Application loaded while online with queued items, processing...');
      handleOnline();
    }
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * Get queue status
 */
export function getQueueStatus(): {
  count: number;
  oldestTimestamp: number | null;
} {
  const queue = getQueuedRejections();
  
  if (queue.length === 0) {
    return { count: 0, oldestTimestamp: null };
  }

  const oldestTimestamp = Math.min(...queue.map((item) => item.timestamp));
  
  return {
    count: queue.length,
    oldestTimestamp,
  };
}
