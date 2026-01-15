import { apiClient } from "./client";

export interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
}

export interface TopMenuItem {
  name: string;
  revenue: number;
  quantity: number;
  category: string;
}

export interface PeakHourData {
  hour: string;
  orders: number;
}

export interface ReportStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItem: string;
}

export interface ReportsQuery {
  timeRange?: "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const reportsApi = {
  async getRevenueReport(query: ReportsQuery = {}): Promise<RevenueData[]> {
    const params = new URLSearchParams();
    if (query.timeRange) params.append("timeRange", query.timeRange);
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);

    const response = await apiClient.get(
      `/api/reports/revenue?${params.toString()}`,
    );
    return response.data.data;
  },

  async getTopMenuItems(query: ReportsQuery = {}): Promise<TopMenuItem[]> {
    const params = new URLSearchParams();
    if (query.timeRange) params.append("timeRange", query.timeRange);
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);

    const response = await apiClient.get(
      `/api/reports/top-items?${params.toString()}`,
    );
    return response.data.data;
  },

  async getPeakHours(
    query: Omit<ReportsQuery, "timeRange"> = {},
  ): Promise<PeakHourData[]> {
    const params = new URLSearchParams();
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);

    const response = await apiClient.get(
      `/api/reports/peak-hours?${params.toString()}`,
    );
    return response.data.data;
  },

  async getReportStats(query: ReportsQuery = {}): Promise<ReportStats> {
    const params = new URLSearchParams();
    if (query.timeRange) params.append("timeRange", query.timeRange);
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);

    const response = await apiClient.get(
      `/api/reports/stats?${params.toString()}`,
    );
    return response.data.data;
  },
};
