import type { Order } from "../../../types/order";
import { apiClient } from "../client";

export async function getKitchenOrders(): Promise<Order[]> {
  const response = await apiClient.get("/api/kitchen/orders");
  return response.data.data || [];
}

export async function moveOrderToReceived(orderId: string): Promise<Order> {
  const response = await apiClient.put(
    `/api/kitchen/orders/${orderId}/received`,
  );
  return response.data.data;
}

export async function moveOrderToPreparing(orderId: string): Promise<Order> {
  const response = await apiClient.put(
    `/api/kitchen/orders/${orderId}/preparing`,
  );
  return response.data.data;
}

export async function moveOrderToReady(orderId: string): Promise<Order> {
  const response = await apiClient.put(`/api/kitchen/orders/${orderId}/ready`);
  return response.data.data;
}
