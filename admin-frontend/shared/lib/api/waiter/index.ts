import type {
  Order,
  AcceptOrderDto,
  RejectOrderDto,
} from "../../../types/order";
import type { Table } from "../../../types/table";
import { apiClient } from "../client";

export async function getMyPendingOrders(): Promise<Order[]> {
  const response = await apiClient.get("/api/waiter/orders/pending");
  return response.data;
}

export async function acceptOrder(
  orderId: string,
  data: AcceptOrderDto,
): Promise<Order> {
  // Ensure data has version field
  if (data.version === undefined || data.version === null) {
    throw new Error("Order version is required for accept operation");
  }
  const response = await apiClient.put(
    `/api/waiter/orders/${orderId}/accept`,
    data,
  );
  return response.data;
}

export async function rejectOrder(
  orderId: string,
  data: RejectOrderDto,
): Promise<Order> {
  const response = await apiClient.put(
    `/api/waiter/orders/${orderId}/reject`,
    data,
  );
  return response.data;
}

export async function sendToKitchen(orderId: string): Promise<Order> {
  const response = await apiClient.put(
    `/api/waiter/orders/${orderId}/send-to-kitchen`,
    {},
  );
  return response.data;
}

export async function serveOrder(orderId: string): Promise<Order> {
  const response = await apiClient.put(`/api/waiter/orders/${orderId}/serve`);
  return response.data;
}

export async function deleteOrder(orderId: string): Promise<void> {
  await apiClient.delete(`/api/order/${orderId}`);
}

export async function getMyAssignedTables(): Promise<Table[]> {
  const response = await apiClient.get("/api/waiter/tables/assigned");
  return response.data;
}
