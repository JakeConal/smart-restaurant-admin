import { apiClient } from './client';
import type {
  KitchenStaff,
  CreateKitchenStaffDto,
  UpdateKitchenStaffDto,
} from '../../types/kitchen-staff';

export class KitchenStaffApi {
  async getKitchenStaff(): Promise<KitchenStaff[]> {
    const response = await apiClient.get('/api/admin/users/kitchen');
    return response.data;
  }

  async getKitchenStaffById(id: string): Promise<KitchenStaff> {
    const response = await apiClient.get(`/api/admin/users/kitchen/${id}`);
    return response.data;
  }

  async createKitchenStaff(data: CreateKitchenStaffDto): Promise<KitchenStaff> {
    const response = await apiClient.post('/api/admin/users/kitchen', data);
    return response.data;
  }

  async updateKitchenStaff(
    id: string,
    data: UpdateKitchenStaffDto,
  ): Promise<KitchenStaff> {
    const response = await apiClient.put(`/api/admin/users/kitchen/${id}`, data);
    return response.data;
  }

  async deleteKitchenStaff(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/kitchen/${id}`);
  }

  async suspendKitchenStaff(id: string): Promise<void> {
    await apiClient.patch(`/api/admin/users/kitchen/${id}/suspend`);
  }
}

export const kitchenStaffApi = new KitchenStaffApi();
