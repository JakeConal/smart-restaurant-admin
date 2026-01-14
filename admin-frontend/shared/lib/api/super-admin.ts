import { apiClient } from './client';
import type { Admin, CreateAdminDto, UpdateAdminDto, AdminFilterDto } from '../../types/admin';

class SuperAdminApi {
  private basePath = '/api/super-admin/admins';

  async getAdmins(filter?: AdminFilterDto): Promise<Admin[]> {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.restaurantId) params.append('restaurantId', filter.restaurantId);

    const queryString = params.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

    const response = await apiClient.get(url);
    return response.data;
  }

  async getAdminById(id: string): Promise<Admin> {
    const response = await apiClient.get(`${this.basePath}/${id}`);
    return response.data;
  }

  async createAdmin(data: CreateAdminDto): Promise<Admin> {
    const response = await apiClient.post(this.basePath, data);
    return response.data;
  }

  async updateAdmin(id: string, data: UpdateAdminDto): Promise<Admin> {
    const response = await apiClient.put(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async toggleAdminStatus(id: string): Promise<{ message: string; status: string }> {
    const response = await apiClient.patch(`${this.basePath}/${id}/toggle-status`);
    return response.data;
  }

  async deleteAdmin(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}

export const superAdminApi = new SuperAdminApi();
