import { apiClient } from './client';
import type { Waiter, CreateWaiterDto, UpdateWaiterDto } from '../../types/waiter';

export class WaitersApi {
  async getWaiters(): Promise<Waiter[]> {
    const response = await apiClient.get('/api/admin/users/waiters');
    return response.data;
  }

  async getWaiterById(id: string): Promise<Waiter> {
    const response = await apiClient.get(`/api/admin/users/waiters/${id}`);
    return response.data;
  }

  async createWaiter(data: CreateWaiterDto): Promise<Waiter> {
    const response = await apiClient.post('/api/admin/users/waiters', data);
    return response.data;
  }

  async updateWaiter(id: string, data: UpdateWaiterDto): Promise<Waiter> {
    const response = await apiClient.put(`/api/admin/users/waiters/${id}`, data);
    return response.data;
  }

  async deleteWaiter(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/waiters/${id}`);
  }

  async suspendWaiter(id: string): Promise<void> {
    await apiClient.patch(`/api/admin/users/waiters/${id}/suspend`);
  }
}

export const waitersApi = new WaitersApi();
