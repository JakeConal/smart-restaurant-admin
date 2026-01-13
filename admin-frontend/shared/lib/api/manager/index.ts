import type { Order, ReassignOrderDto } from "../../../types/order";
import { apiClient } from "../client";

export async function getEscalatedOrders(): Promise<Order[]> {
  const response = await apiClient.get("/api/manager/orders/escalated");
  return response.data;
}

export async function reassignOrder(
  orderId: string,
  data: ReassignOrderDto,
): Promise<Order> {
  const response = await apiClient.put(
    `/api/manager/orders/${orderId}/reassign`,
    data,
  );
  return response.data;
}
