import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class OrderWebSocketClient {
  private socket: Socket | null = null;
  private orderListeners = new Map<string, Set<Function>>();
  private restaurantId: string | null = null;

  /**
   * Connect to WebSocket server with optional restaurantId for room joining
   */
  connect(restaurantId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Store restaurantId for later use in subscriptions
        if (restaurantId) {
          this.restaurantId = restaurantId;
          console.log(
            `[AdminOrderWebSocket] Stored restaurantId: ${restaurantId}`,
          );
        } else {
          console.warn(
            `[AdminOrderWebSocket] ⚠️  No restaurantId provided to connect()`,
          );
        }

        this.socket = io(`${SOCKET_URL}/orders`, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ["websocket", "polling"],
        });

        let roomJoined = false;

        this.socket.on("connect", () => {
          console.log("[AdminOrderWebSocket] Connected to server");
          // Join restaurant room immediately on connection
          if (this.restaurantId && this.socket) {
            this.socket.emit("join-restaurant", {
              restaurantId: this.restaurantId,
            });
            console.log(
              `[AdminOrderWebSocket] ✅ Emitted join-restaurant with restaurantId: ${this.restaurantId}`,
            );
          } else {
            console.warn(
              `[AdminOrderWebSocket] ⚠️  Cannot join restaurant room - restaurantId is ${this.restaurantId}`,
            );
            resolve(); // Still resolve even without restaurant
          }
        });

        // Listen for join confirmation
        this.socket.on("joined-restaurant", (data) => {
          console.log(
            `[AdminOrderWebSocket] ✅ Confirmed joined restaurant: ${data.restaurantId}`,
          );
          roomJoined = true;
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          console.error("[AdminOrderWebSocket] Connection error:", error);
          reject(error);
        });

        this.socket.on("disconnect", (reason) => {
          console.log("[AdminOrderWebSocket] Disconnected:", reason);
        });

        // Handle reconnect - rejoin restaurant room
        this.socket.on("reconnect", () => {
          console.log("[AdminOrderWebSocket] Reconnected to server");
          if (this.restaurantId && this.socket) {
            this.socket.emit("join-restaurant", {
              restaurantId: this.restaurantId,
            });
            console.log(
              `[AdminOrderWebSocket] Rejoined restaurant room: restaurant-${this.restaurantId}`,
            );
          }
        });

        // Setup event listeners
        this.setupEventListeners();
      } catch (error) {
        console.error("[AdminOrderWebSocket] Failed to create socket:", error);
        reject(error);
      }
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // New order created event - broadcast to all waiters
    this.socket.on("order:created", (data) => {
      console.log("[AdminOrderWebSocket] New order created:", data);

      // SECURITY: Validate order belongs to our restaurant
      const orderRestaurantId = data.order?.restaurantId;
      if (
        orderRestaurantId &&
        this.restaurantId &&
        orderRestaurantId !== this.restaurantId
      ) {
        console.warn(
          `[AdminOrderWebSocket] ⚠️ SECURITY: Received order from different restaurant! ` +
            `Order restaurantId: ${orderRestaurantId}, Our restaurantId: ${this.restaurantId} - REJECTING`,
        );
        return; // Reject order from other restaurants
      }

      // Notify all listeners with a special marker for new order
      // Subscribe to this specific order (with restaurantId for security)
      this.socket?.emit("subscribe", {
        orderId: data.orderId,
        restaurantId: this.restaurantId,
      });
      // Dispatch event to global listeners
      window.dispatchEvent(
        new CustomEvent("waiter:neworder", {
          detail: { orderId: data.orderId, order: data.order },
        }),
      );
    });

    // Order updated event
    this.socket.on("order:updated", (data) => {
      console.log("[AdminOrderWebSocket] Order updated:", data);
      this.notifyListeners(data.orderId, {
        type: "order:updated",
        ...data,
      });
    });

    // Order accepted event
    this.socket.on("order:accepted", (data) => {
      console.log("[AdminOrderWebSocket] Order accepted:", data);
      this.notifyListeners(data.orderId, {
        type: "order:accepted",
        ...data,
      });
    });

    // Order rejected event
    this.socket.on("order:rejected", (data) => {
      console.log("[AdminOrderWebSocket] Order rejected:", data);
      this.notifyListeners(data.orderId, {
        type: "order:rejected",
        ...data,
      });
    });

    // Order progress event
    this.socket.on("order:progress", (data) => {
      console.log("[AdminOrderWebSocket] Order progress:", data);
      this.notifyListeners(data.orderId, {
        type: "order:progress",
        ...data,
      });
      // Also dispatch a global event for kitchen updates
      window.dispatchEvent(
        new CustomEvent("kitchen:orderupdate", {
          detail: {
            orderId: data.orderId,
            order: data.order,
            newStatus: data.newStatus,
          },
        }),
      );
    });

    // Kitchen order received event
    this.socket.on("kitchen:neworder", (data) => {
      console.log("[AdminOrderWebSocket] New kitchen order:", data);
      window.dispatchEvent(
        new CustomEvent("kitchen:neworder", {
          detail: { orderId: data.orderId, order: data.order },
        }),
      );
    });

    // Error event
    this.socket.on("error", (error) => {
      console.error("[AdminOrderWebSocket] Socket error:", error);
    });
  }

  /**
   * Subscribe to order updates
   */
  /**
   * Subscribe to order updates
   */
  subscribeToOrder(
    orderId: string,
    listener: (data: any) => void,
    restaurantId?: string,
  ): () => void {
    if (!this.orderListeners.has(orderId)) {
      this.orderListeners.set(orderId, new Set());

      // Emit subscribe event to server
      if (this.socket) {
        this.socket.emit("subscribe", { orderId });

        // If restaurantId is provided and different from ours, join that restaurant room too
        if (restaurantId && restaurantId !== this.restaurantId) {
          this.socket.emit("join-restaurant", { restaurantId });
        }
      }
    }

    this.orderListeners.get(orderId)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.orderListeners.get(orderId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.orderListeners.delete(orderId);
          // Emit unsubscribe event to server
          if (this.socket) {
            this.socket.emit("unsubscribe", { orderId });
          }
        }
      }
    };
  }

  /**
   * Notify listeners for an order
   */
  private notifyListeners(orderId: string, data: any): void {
    const listeners = this.orderListeners.get(orderId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error("[AdminOrderWebSocket] Error in listener:", error);
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
    }
    this.orderListeners.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
let instance: OrderWebSocketClient | null = null;

export function getOrderWebSocketClient(): OrderWebSocketClient {
  if (!instance) {
    instance = new OrderWebSocketClient();
  }
  return instance;
}
