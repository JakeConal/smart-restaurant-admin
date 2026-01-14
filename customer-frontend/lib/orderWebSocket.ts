import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class OrderWebSocketClient {
  private socket: Socket | null = null;
  private orderListeners = new Map<string, Set<Function>>();

  /**
   * Connect to WebSocket server with optional restaurantId
   */
  connect(restaurantId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${SOCKET_URL}/orders`, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ["websocket", "polling"],
        });

        this.socket.on("connect", () => {
          console.log("[OrderWebSocket] Connected to server");
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          console.error("[OrderWebSocket] Connection error:", error);
          reject(error);
        });

        this.socket.on("disconnect", (reason) => {
          console.log("[OrderWebSocket] Disconnected:", reason);
        });

        // Setup event listeners
        this.setupEventListeners();
      } catch (error) {
        console.error("[OrderWebSocket] Failed to create socket:", error);
        reject(error);
      }
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Order updated event
    this.socket.on("order:updated", (data) => {
      console.log("[OrderWebSocket] Order updated:", data);
      this.notifyListeners(data.orderId, {
        type: "order:updated",
        ...data,
      });
    });

    // Order accepted event
    this.socket.on("order:accepted", (data) => {
      console.log("[OrderWebSocket] Order accepted:", data);
      this.notifyListeners(data.orderId, {
        type: "order:accepted",
        ...data,
      });
    });

    // Order rejected event
    this.socket.on("order:rejected", (data) => {
      console.log("[OrderWebSocket] Order rejected:", data);
      this.notifyListeners(data.orderId, {
        type: "order:rejected",
        ...data,
      });
    });

    // Order progress event
    this.socket.on("order:progress", (data) => {
      console.log("[OrderWebSocket] Order progress:", data);
      this.notifyListeners(data.orderId, {
        type: "order:progress",
        ...data,
      });
    });

    // Error event
    this.socket.on("error", (error) => {
      console.error("[OrderWebSocket] Socket error:", error);
    });
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrder(orderId: string, listener: (data: any) => void): () => void {
    if (!this.orderListeners.has(orderId)) {
      this.orderListeners.set(orderId, new Set());

      // Emit subscribe event to server
      if (this.socket) {
        this.socket.emit("subscribe", { orderId });
      }
    }

    const listeners = this.orderListeners.get(orderId)!;
    listeners.add(listener);

    console.log(`[OrderWebSocket] Subscribed to order ${orderId}`);

    // Return unsubscribe function
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.orderListeners.delete(orderId);

        // Emit unsubscribe event to server
        if (this.socket) {
          this.socket.emit("unsubscribe", { orderId });
        }

        console.log(`[OrderWebSocket] Unsubscribed from order ${orderId}`);
      }
    };
  }

  /**
   * Notify listeners about order updates
   */
  private notifyListeners(orderId: string, data: any): void {
    const listeners = this.orderListeners.get(orderId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error("[OrderWebSocket] Error in listener:", error);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.orderListeners.clear();
      console.log("[OrderWebSocket] Disconnected");
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
let clientInstance: OrderWebSocketClient | null = null;

export function getOrderWebSocketClient(): OrderWebSocketClient {
  if (!clientInstance) {
    clientInstance = new OrderWebSocketClient();
  }
  return clientInstance;
}

export default OrderWebSocketClient;
