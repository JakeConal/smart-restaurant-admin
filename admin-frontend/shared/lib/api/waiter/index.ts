import type { Order, AcceptOrderDto, RejectOrderDto } from '../../types/order';
import { apiClient } from '../client';

export async function getMyPendingOrders(): Promise<Order[]> {
  const response = await apiClient.get('/api/waiter/orders/pending');
  return response.data;
}

export async function acceptOrder(
  orderId: string,
  data: AcceptOrderDto
): Promise<Order> {
  const response = await apiClient.put(`/api/waiter/orders/${orderId}/accept`, data);
  return response.data;
}

export async function rejectOrder(
  orderId: string,
  data: RejectOrderDto
): Promise<Order> {
  const response = await apiClient.put(`/api/waiter/orders/${orderId}/reject`, data);
  return response.data;
}

export async function sendToKitchen(orderId: string): Promise<Order> {
  const response = await apiClient.put(`/api/waiter/orders/${orderId}/send-to-kitchen`, {});
  return response.data;
}
