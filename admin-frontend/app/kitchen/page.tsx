"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChefHat,
  RefreshCw,
  Clock,
  GripVertical,
  Package,
  Flame,
  CheckCircle2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { DashboardLayout } from "../../shared/components/layout";
import { useToast } from "../../shared/components/ui/Toast";
import { useAuth } from "../../shared/components/auth/AuthContext";
import {
  getKitchenOrders,
  moveOrderToReceived,
  moveOrderToPreparing,
  moveOrderToReady,
} from "../../shared/lib/api/kitchen";
import { getOrderWebSocketClient } from "../../shared/lib/orderWebSocket";
import type { Order, OrderStatus } from "../../shared/types/order";
import { Howl, Howler } from "howler";

type KitchenColumn = "received" | "preparing" | "ready";

interface KitchenOrderCardProps {
  order: Order;
  column: KitchenColumn;
  onDragStart: (e: React.DragEvent, orderId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function KitchenOrderCard({
  order,
  column,
  onDragStart,
  onDragEnd,
}: KitchenOrderCardProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Calculate initial elapsed time
    const calculateElapsed = () => {
      const now = Date.now();
      // Use kitchenReceivedAt or sentToKitchenAt as reference
      const referenceTime =
        order.kitchenReceivedAt || order.sentToKitchenAt || order.createdAt;
      const startTime = new Date(referenceTime).getTime();
      return Math.floor((now - startTime) / 1000);
    };

    setElapsedSeconds(calculateElapsed());

    // Only run timer if not in "ready" column
    if (column !== "ready") {
      const interval = setInterval(() => {
        setElapsedSeconds(calculateElapsed());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [order.kitchenReceivedAt, order.sentToKitchenAt, order.createdAt, column]);

  // Color based on elapsed time and prep time
  const getTimeColor = () => {
    const minutes = elapsedSeconds / 60;
    const maxPrepTime = order.maxPrepTimeMinutes || 10; // Default to 10 mins if not set

    if (minutes >= maxPrepTime) {
      return "text-white bg-red-600 animate-pulse ring-4 ring-red-200";
    }
    if (minutes >= maxPrepTime * 0.75) {
      return "text-orange-700 bg-orange-100 ring-2 ring-orange-200";
    }
    return "text-green-700 bg-green-100";
  };

  const isOverdue =
    elapsedSeconds / 60 >= (order.maxPrepTimeMinutes || 10) &&
    column !== "ready";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, order.orderId)}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-2xl border shadow-md p-4 cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
        isOverdue
          ? "border-red-500 shadow-red-100 bg-red-50/30"
          : "border-slate-200/50"
      }`}
    >
      {/* Header with drag handle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <div>
            <h3 className="font-bold text-gray-900">
              Table {order.tableNumber}
              {isOverdue && (
                <span className="ml-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Urgent
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500">#{order.orderId.slice(-6)}</p>
          </div>
        </div>
        {/* Timer */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-colors duration-300 ${getTimeColor()}`}
        >
          <Clock className="w-3.5 h-3.5" />
          {formatTime(elapsedSeconds)}
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {order.items.map((item, idx) => (
          <div
            key={idx}
            className="py-3 border-b border-slate-100 last:border-0"
          >
            <div className="flex items-start gap-2 mb-1">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded min-w-fit">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <span className="text-sm font-bold text-gray-800">
                  {item.menuItemName}
                </span>
                {item.prepTimeMinutes && (
                  <span className="ml-2 text-[10px] text-gray-400 font-medium">
                    ({item.prepTimeMinutes}m)
                  </span>
                )}
              </div>
            </div>
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="ml-2 space-y-1 mb-2">
                {item.modifiers.map((mod, modIdx) => (
                  <div
                    key={modIdx}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center justify-between"
                  >
                    <span>+ {mod.modifierOptionName}</span>
                    {mod.price > 0 && (
                      <span className="font-semibold">
                        +${Number(mod.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {item.specialInstructions && (
              <p className="text-xs text-orange-600 ml-2 p-2 bg-orange-50 rounded italic border-l-2 border-orange-200">
                📝 {item.specialInstructions}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Special requests */}
      {(order.specialRequests || order.specialInstructions) && (
        <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-100">
          <p className="text-xs text-orange-700 font-medium">
            📝 {order.specialRequests || order.specialInstructions}
          </p>
        </div>
      )}
    </div>
  );
}

interface KitchenColumnProps {
  title: string;
  column: KitchenColumn;
  orders: Order[];
  icon: React.ReactNode;
  bgColor: string;
  headerColor: string;
  onDragStart: (e: React.DragEvent, orderId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, column: KitchenColumn) => void;
  isDragOver: boolean;
}

function KitchenColumnComponent({
  title,
  column,
  orders,
  icon,
  bgColor,
  headerColor,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragOver,
}: KitchenColumnProps) {
  // Sort orders by time (longest first)
  const sortedOrders = [...orders].sort((a, b) => {
    const timeA = new Date(
      a.kitchenReceivedAt || a.sentToKitchenAt || a.createdAt,
    ).getTime();
    const timeB = new Date(
      b.kitchenReceivedAt || b.sentToKitchenAt || b.createdAt,
    ).getTime();
    return timeA - timeB; // Oldest first (longest waiting time)
  });

  return (
    <div
      className={`flex-1 rounded-[1.75rem] border border-slate-200/50 shadow-md flex flex-col overflow-hidden ${bgColor} ${
        isDragOver ? "ring-2 ring-slate-400 ring-offset-2" : ""
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column)}
    >
      {/* Column header */}
      <div className={`px-5 py-4 ${headerColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">{icon}</div>
            <div>
              <h2 className="font-bold text-white text-lg">{title}</h2>
              <p className="text-white/80 text-xs font-medium">
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Package className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No orders</p>
          </div>
        ) : (
          sortedOrders.map((order) => (
            <KitchenOrderCard
              key={order.orderId}
              order={order}
              column={column}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KitchenColumn | null>(
    null,
  );
  const [wsConnected, setWsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());
  const soundRef = useRef<Howl | null>(null);

  // Initialize sound on mount
  useEffect(() => {
    soundRef.current = new Howl({
      src: [
        "https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3",
        "https://www.soundjay.com/buttons/sounds/button-10.mp3",
      ],
      volume: 1.0,
      preload: true,
      onloaderror: (id, err) =>
        console.error("[Kitchen] Sound Load Error:", err),
      onplayerror: (id, err) => {
        console.error("[Kitchen] Sound Play Error:", err);
        // Try to resume context if blocked
        if (err === "Error: AudioContext is suspended.") {
          Howler.ctx?.resume();
        }
      },
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, []);

  // sound notification helper
  const playNotificationSound = useCallback(() => {
    if (soundRef.current && soundEnabled) {
      let playCount = 0;

      const handleEnd = () => {
        playCount++;
        if (playCount < 2) {
          soundRef.current?.play();
        } else {
          soundRef.current?.off("end", handleEnd);
        }
      };

      soundRef.current.off("end");
      soundRef.current.on("end", handleEnd);

      soundRef.current.play();
    }
  }, [soundEnabled]);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getKitchenOrders();
      setOrders(data);

      // Subscribe to WebSocket updates for each order
      data.forEach((order) => {
        subscribeToOrder(order.orderId);
      });
    } catch (error) {
      console.error("Failed to load kitchen orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const subscribeToOrder = async (orderId: string) => {
    try {
      const client = getOrderWebSocketClient();

      if (!client.isConnected()) {
        const restaurantId = user?.restaurantId;
        console.log(`[Kitchen] Connecting with restaurantId: ${restaurantId}`);
        await client.connect(restaurantId);
        setWsConnected(true);
      }

      if (unsubscribesRef.current.has(orderId)) {
        return;
      }

      const restaurantId = user?.restaurantId;
      console.log(
        `[Kitchen] Subscribing to order ${orderId} with restaurantId: ${restaurantId}`,
      );
      const unsubscribe = client.subscribeToOrder(
        orderId,
        (data) => {
          console.log("[Kitchen] Received WebSocket update:", data);

          if (data.type === "order:progress" && data.order) {
            // Update order in list
            setOrders((prev) =>
              prev.map((o) => (o.orderId === orderId ? data.order : o)),
            );
          } else if (data.type === "order:updated" && data.order) {
            setOrders((prev) =>
              prev.map((o) => (o.orderId === orderId ? data.order : o)),
            );
          }
        },
        user?.restaurantId, // Pass restaurantId to filter socket broadcasts
      );

      unsubscribesRef.current.set(orderId, unsubscribe);
    } catch (error) {
      console.error("[Kitchen] Failed to subscribe to order:", error);
    }
  };

  useEffect(() => {
    loadOrders();

    // Listen for new orders via global custom events dispatched by OrderWebSocketClient
    const handleNewOrder = (event: any) => {
      const { order } = event.detail;
      console.log("[Kitchen] Received new order event:", order);

      // Add to list if not already there
      setOrders((prev) => {
        if (prev.find((o) => o.orderId === order.orderId)) return prev;
        return [...prev, order];
      });

      // Play sound
      playNotificationSound();

      // Subscribe to updates for this specific order
      subscribeToOrder(order.orderId);

      toast.info(`New order from Table ${order.tableNumber}`);
    };

    const handleOrderUpdate = (event: any) => {
      const { orderId, order, newStatus } = event.detail;
      console.log("[Kitchen] Received order update event:", {
        orderId,
        newStatus,
      });

      if (newStatus === "completed" || newStatus === "cancelled") {
        // Remove from list
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
        // Unsubscribe
        const unsubscribe = unsubscribesRef.current.get(orderId);
        if (unsubscribe) {
          unsubscribe();
          unsubscribesRef.current.delete(orderId);
        }
      } else {
        // Update in list
        setOrders((prev) => {
          const exists = prev.find((o) => o.orderId === orderId);
          if (exists) {
            return prev.map((o) => (o.orderId === orderId ? order : o));
          } else if (
            ["received", "preparing", "ready"].includes(
              newStatus?.toLowerCase(),
            )
          ) {
            // If it's a kitchen status but not in our list, add it
            return [...prev, order];
          }
          return prev;
        });
      }
    };

    window.addEventListener("kitchen:neworder" as any, handleNewOrder);
    window.addEventListener("kitchen:orderupdate" as any, handleOrderUpdate);

    return () => {
      window.removeEventListener("kitchen:neworder" as any, handleNewOrder);
      window.removeEventListener(
        "kitchen:orderupdate" as any,
        handleOrderUpdate,
      );
      unsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      unsubscribesRef.current.clear();
    };
  }, [loadOrders, playNotificationSound, toast]);

  // Set up polling for new kitchen orders
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", orderId);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetColumn: KitchenColumn,
  ) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");

    if (!orderId) return;

    const order = orders.find((o) => o.orderId === orderId);
    if (!order) return;

    // Determine current column
    const currentColumn = getOrderColumn(order);

    if (currentColumn === targetColumn) {
      setDragOverColumn(null);
      return;
    }

    // Optimistically update UI
    const updatedOrder = { ...order };
    if (targetColumn === "received") {
      updatedOrder.status = "received" as OrderStatus;
    } else if (targetColumn === "preparing") {
      updatedOrder.status = "preparing" as OrderStatus;
    } else if (targetColumn === "ready") {
      updatedOrder.status = "ready" as OrderStatus;
    }

    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? updatedOrder : o)),
    );

    try {
      // Call API to update status
      let result: Order;
      if (targetColumn === "received") {
        result = await moveOrderToReceived(orderId);
      } else if (targetColumn === "preparing") {
        result = await moveOrderToPreparing(orderId);
      } else {
        result = await moveOrderToReady(orderId);
      }

      // Update with actual result
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? result : o)),
      );

      toast.success(
        `Order moved to ${targetColumn.charAt(0).toUpperCase() + targetColumn.slice(1)}`,
      );
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error("Failed to update order status");
      // Revert optimistic update
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? order : o)));
    }

    setDragOverColumn(null);
  };

  const getOrderColumn = (order: Order): KitchenColumn => {
    const status = order.status?.toLowerCase();
    if (status === "received") return "received";
    if (status === "preparing") return "preparing";
    if (status === "ready") return "ready";
    return "received";
  };

  const receivedOrders = orders.filter((o) => getOrderColumn(o) === "received");
  const preparingOrders = orders.filter(
    (o) => getOrderColumn(o) === "preparing",
  );
  const readyOrders = orders.filter((o) => getOrderColumn(o) === "ready");

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadOrders();
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 sm:p-3 rounded-xl">
              <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Kitchen Display
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                {orders.length} active order{orders.length !== 1 ? "s" : ""}
                {wsConnected && (
                  <span className="ml-2 text-green-600">● Live</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newState = !soundEnabled;

                // CRITICAL: Resume AudioContext on user interaction
                if (Howler.ctx && Howler.ctx.state === "suspended") {
                  Howler.ctx.resume();
                }

                setSoundEnabled(newState);

                if (newState) {
                  // Test/Unlock immediately
                  if (soundRef.current) {
                    soundRef.current.stop();
                    soundRef.current.play();
                  }
                  toast.success("Sound notifications enabled");
                } else {
                  // Stop any currently playing sounds/loops
                  if (soundRef.current) {
                    soundRef.current.stop();
                    soundRef.current.off("end");
                  }
                  toast.info("Sound notifications disabled");
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                soundEnabled
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-sm transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        <KitchenColumnComponent
          title="Received"
          column="received"
          orders={receivedOrders}
          icon={<Package className="w-5 h-5 text-white" />}
          bgColor="bg-white"
          headerColor="bg-blue-500"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => {
            handleDragOver(e);
            setDragOverColumn("received");
          }}
          onDrop={handleDrop}
          isDragOver={dragOverColumn === "received" && draggedOrderId !== null}
        />

        <KitchenColumnComponent
          title="Preparing"
          column="preparing"
          orders={preparingOrders}
          icon={<Flame className="w-5 h-5 text-white" />}
          bgColor="bg-white"
          headerColor="bg-orange-500"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => {
            handleDragOver(e);
            setDragOverColumn("preparing");
          }}
          onDrop={handleDrop}
          isDragOver={dragOverColumn === "preparing" && draggedOrderId !== null}
        />

        <KitchenColumnComponent
          title="Ready"
          column="ready"
          orders={readyOrders}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
          bgColor="bg-white"
          headerColor="bg-green-500"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => {
            handleDragOver(e);
            setDragOverColumn("ready");
          }}
          onDrop={handleDrop}
          isDragOver={dragOverColumn === "ready" && draggedOrderId !== null}
        />
      </div>
    </DashboardLayout>
  );
}
