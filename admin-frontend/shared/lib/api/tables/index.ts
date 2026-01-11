import { apiClient, downloadFile } from "../client";
import type {
  Table,
  CreateTableDto,
  UpdateTableDto,
  TableFilters,
  QRCodeData,
} from "@/shared/types/table";

export class TablesApi {
  // ============================================
  // Table Management Methods
  // ============================================

  /**
   * Get all tables with optional filters
   */
  async getTables(filters?: TableFilters): Promise<Table[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.location) params.append("location", filters.location);
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);

    const response = await apiClient.get(
      `/api/admin/tables?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Get single table by ID
   */
  async getTableById(id: string): Promise<Table> {
    const response = await apiClient.get(`/api/admin/tables/${id}`);
    return response.data;
  }

  /**
   * Create new table
   */
  async createTable(data: CreateTableDto): Promise<Table> {
    const response = await apiClient.post("/api/admin/tables", data);
    return response.data;
  }

  /**
   * Update table
   */
  async updateTable(id: string, data: UpdateTableDto): Promise<Table> {
    const response = await apiClient.put(`/api/admin/tables/${id}`, data);
    return response.data;
  }

  /**
   * Update table status
   */
  async updateTableStatus(
    id: string,
    status: "active" | "inactive",
  ): Promise<Table> {
    const response = await apiClient.patch(`/api/admin/tables/${id}/status`, {
      status,
    });
    return response.data;
  }

  /**
   * Delete table
   */
  async deleteTable(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/tables/${id}`);
  }

  // ============================================
  // QR Code Methods
  // ============================================

  /**
   * Generate QR code for a table
   */
  async generateQR(tableId: string): Promise<QRCodeData> {
    const response = await apiClient.post(
      `/api/admin/tables/${tableId}/qr/generate`,
    );
    return response.data;
  }

  /**
   * Regenerate QR code for a table
   */
  async regenerateQR(tableId: string): Promise<QRCodeData> {
    const response = await apiClient.post(
      `/api/admin/tables/${tableId}/qr/regenerate`,
    );
    return response.data;
  }

  /**
   * Get QR code as data URL
   */
  async getQRCodeDataUrl(tableId: string): Promise<string> {
    const response = await apiClient.get(
      `/api/admin/tables/${tableId}/qr/data-url`,
    );
    return response.data.dataUrl;
  }

  /**
   * Bulk regenerate all active tables
   */
  async regenerateAllQR(): Promise<{ count: number; tables: Table[] }> {
    const response = await apiClient.post(
      "/api/admin/tables/qr/regenerate-all",
    );
    return response.data;
  }

  /**
   * Download QR code as PNG
   */
  async downloadQRPNG(tableId: string): Promise<void> {
    const blob = await apiClient.get(
      `/api/admin/tables/${tableId}/qr/download?format=png`,
      {
        responseType: "blob",
      },
    );
    downloadFile(blob.data, `table-${tableId}-qr.png`);
  }

  /**
   * Download QR code as PDF
   */
  async downloadQRPDF(tableId: string): Promise<void> {
    const blob = await apiClient.get(
      `/api/admin/tables/${tableId}/qr/download?format=pdf`,
      {
        responseType: "blob",
      },
    );
    downloadFile(blob.data, `table-${tableId}-qr.pdf`);
  }

  /**
   * Download all QR codes as ZIP
   */
  async downloadAllQRZIP(): Promise<void> {
    const blob = await apiClient.get(
      "/api/admin/tables/qr/download-all?format=zip",
      {
        responseType: "blob",
      },
    );
    downloadFile(blob.data, "all-qr-codes.zip");
  }

  /**
   * Download all QR codes as PDF
   */
  async downloadAllQRPDF(): Promise<void> {
    const blob = await apiClient.get(
      "/api/admin/tables/qr/download-all?format=pdf",
      {
        responseType: "blob",
      },
    );
    downloadFile(blob.data, "all-qr-codes.pdf");
  }

  // ============================================
  // Waiter Management Methods
  // ============================================

  /**
   * Get all active waiters for assignment
   */
  async getWaiters(): Promise<Array<{
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  }>> {
    const response = await apiClient.get("/api/admin/users/waiters");
    return response.data;
  }
}

// Export singleton instance
export const tablesApi = new TablesApi();
