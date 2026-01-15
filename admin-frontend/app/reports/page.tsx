"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout, TopBar } from "@/shared/components/layout";
import { useAuth } from "@/shared/components/auth/AuthContext";
import { useToast } from "@/shared/components/ui";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import { reportsApi } from "@/shared/lib/api/reports";

// Types
interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
}

interface TopMenuItem {
  name: string;
  revenue: number;
  quantity: number;
  category: string;
}

interface PeakHourData {
  hour: string;
  orders: number;
}

interface ReportStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItem: string;
}

export default function ReportsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // State
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topItems, setTopItems] = useState<TopMenuItem[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourData[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItem: "",
  });
  const [revenueGrowth, setRevenueGrowth] = useState<number | null>(null);
  const [ordersGrowth, setOrdersGrowth] = useState<number | null>(null);
  const [avgOrderGrowth, setAvgOrderGrowth] = useState<number | null>(null);

  // Auth check
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (!isLoading && user?.role?.toUpperCase() !== "ADMIN") {
      router.push("/");
      toast.error("Access denied. Only admins can view reports.");
    } else if (!isLoading && user) {
      loadReports();
    }
  }, [user, isLoading, router, timeRange]);

  // Load reports data
  const loadReports = async () => {
    try {
      setLoading(true);

      // Calculate date ranges for current and previous period
      const now = new Date();
      let currentStart: Date,
        currentEnd: Date,
        previousStart: Date,
        previousEnd: Date;

      switch (timeRange) {
        case "daily":
          currentEnd = now;
          currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousEnd = new Date(currentStart.getTime() - 1);
          previousStart = new Date(
            previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000,
          );
          break;
        case "weekly":
          currentEnd = now;
          currentStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
          previousEnd = new Date(currentStart.getTime() - 1);
          previousStart = new Date(
            previousEnd.getTime() - 28 * 24 * 60 * 60 * 1000,
          );
          break;
        case "monthly":
          currentEnd = now;
          currentStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          previousEnd = new Date(currentStart.getTime() - 1);
          previousStart = new Date(
            previousEnd.getTime() - 180 * 24 * 60 * 60 * 1000,
          );
          break;
      }

      // Fetch all data in parallel
      const [
        revenueData,
        topItemsData,
        peakHoursData,
        statsData,
        previousStatsData,
      ] = await Promise.all([
        reportsApi.getRevenueReport({ timeRange }),
        reportsApi.getTopMenuItems({ timeRange, limit: 5 }),
        reportsApi.getPeakHours(),
        reportsApi.getReportStats({ timeRange }),
        reportsApi.getReportStats({
          timeRange,
          startDate: previousStart.toISOString(),
          endDate: previousEnd.toISOString(),
        }),
      ]);

      setRevenueData(revenueData);
      setTopItems(topItemsData);
      setPeakHours(peakHoursData);
      setStats(statsData);

      // Calculate growth percentages
      if (previousStatsData.totalRevenue > 0) {
        const revGrowth =
          ((statsData.totalRevenue - previousStatsData.totalRevenue) /
            previousStatsData.totalRevenue) *
          100;
        setRevenueGrowth(revGrowth);
      } else {
        setRevenueGrowth(null);
      }

      if (previousStatsData.totalOrders > 0) {
        const ordGrowth =
          ((statsData.totalOrders - previousStatsData.totalOrders) /
            previousStatsData.totalOrders) *
          100;
        setOrdersGrowth(ordGrowth);
      } else {
        setOrdersGrowth(null);
      }

      if (previousStatsData.averageOrderValue > 0) {
        const avgGrowth =
          ((statsData.averageOrderValue - previousStatsData.averageOrderValue) /
            previousStatsData.averageOrderValue) *
          100;
        setAvgOrderGrowth(avgGrowth);
      } else {
        setAvgOrderGrowth(null);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast.error("Failed to load reports");

      // Fallback to empty data
      setRevenueData([]);
      setTopItems([]);
      setPeakHours([]);
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topSellingItem: "N/A",
      });
      setRevenueGrowth(null);
      setOrdersGrowth(null);
      setAvgOrderGrowth(null);
    } finally {
      setLoading(false);
    }
  };

  // Download report
  const handleDownloadReport = () => {
    toast.success("Report download will be implemented soon");
    // TODO: Implement PDF/CSV download
  };

  // Colors for charts (following design system)
  const COLORS = {
    primary: "#495057",
    secondary: "#868E96",
    success: "#065F46",
    warning: "#C2410C",
    danger: "#991B1B",
  };

  const PIE_COLORS = ["#495057", "#868E96", "#ADB5BD", "#CED4DA", "#DEE2E6"];

  return (
    <DashboardLayout>
      <TopBar title="Revenue Reports" subtitle="Analytics & Insights" />

      {/* Time Range Selector */}
      <div className="flex items-center justify-between px-1 mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("daily")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              timeRange === "daily"
                ? "bg-slate-700 text-white shadow-lg"
                : "bg-slate-200 text-slate-800 hover:bg-slate-300"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeRange("weekly")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              timeRange === "weekly"
                ? "bg-slate-700 text-white shadow-lg"
                : "bg-slate-200 text-slate-800 hover:bg-slate-300"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeRange("monthly")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              timeRange === "monthly"
                ? "bg-slate-700 text-white shadow-lg"
                : "bg-slate-200 text-slate-800 hover:bg-slate-300"
            }`}
          >
            Monthly
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-sm transition-all"
          >
            <Download className="w-5 h-5" />
            <span className="hidden md:inline">Download</span>
          </button>
          <button
            onClick={loadReports}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-sm transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        {/* Total Revenue */}
        <div className="bg-slate-700 text-white rounded-[1.75rem] shadow-md hover:shadow-xl transition-all p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            {revenueGrowth !== null && (
              <div
                className={`px-3 py-1 rounded-full ${
                  revenueGrowth >= 0
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide">
                  {revenueGrowth >= 0 ? "+" : ""}
                  {revenueGrowth.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="text-3xl font-extrabold mb-1">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-white/70">Total Revenue</div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md hover:shadow-xl transition-all p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-slate-700" />
            </div>
            {ordersGrowth !== null && (
              <div
                className={`px-3 py-1 rounded-full ${
                  ordersGrowth >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide">
                  {ordersGrowth >= 0 ? "+" : ""}
                  {ordersGrowth.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            {stats.totalOrders.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-gray-500">Total Orders</div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md hover:shadow-xl transition-all p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-slate-700" />
            </div>
            {avgOrderGrowth !== null && (
              <div
                className={`px-3 py-1 rounded-full ${
                  avgOrderGrowth >= 0
                    ? "bg-orange-100 text-orange-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide">
                  {avgOrderGrowth >= 0 ? "+" : ""}
                  {avgOrderGrowth.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            ${stats.averageOrderValue.toFixed(2)}
          </div>
          <div className="text-sm font-medium text-gray-500">Avg Order</div>
        </div>

        {/* Top Selling Item */}
        <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md hover:shadow-xl transition-all p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-slate-700" />
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              <span className="text-xs font-bold uppercase tracking-wide">
                Best
              </span>
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 mb-1 truncate">
            {stats.topSellingItem}
          </div>
          <div className="text-sm font-medium text-gray-500">
            Top Seller ({timeRange})
          </div>
        </div>
      </div>

      {/* Charts Row 1: Revenue & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Revenue Chart */}
        <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Revenue Trends
          </h3>
          <p className="text-sm font-medium text-gray-500 mb-6">
            Revenue over time ({timeRange})
          </p>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                <XAxis
                  dataKey="period"
                  stroke="#6B7280"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E9ECEF",
                    borderRadius: "12px",
                    padding: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600 }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: COLORS.primary, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Order Volume</h3>
          <p className="text-sm font-medium text-gray-500 mb-6">
            Number of orders ({timeRange})
          </p>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                <XAxis
                  dataKey="period"
                  stroke="#6B7280"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E9ECEF",
                    borderRadius: "12px",
                    padding: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600 }} />
                <Bar
                  dataKey="orders"
                  fill={COLORS.primary}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2: Top Items & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Top Items by Revenue */}
        <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Top Menu Items
          </h3>
          <p className="text-sm font-medium text-gray-500 mb-6">
            Best sellers by revenue
          </p>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                <XAxis
                  type="number"
                  stroke="#6B7280"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6B7280"
                  style={{ fontSize: "11px", fontWeight: 500 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E9ECEF",
                    borderRadius: "12px",
                    padding: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill={COLORS.primary}
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Peak Hours</h3>
          <p className="text-sm font-medium text-gray-500 mb-6">
            Busiest times of the day
          </p>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                <XAxis
                  dataKey="hour"
                  stroke="#6B7280"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E9ECEF",
                    borderRadius: "12px",
                    padding: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600 }} />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke={COLORS.warning}
                  strokeWidth={3}
                  dot={{ fill: COLORS.warning, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Items Table */}
      <div className="bg-white rounded-[1.75rem] border border-slate-200/10 shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          Detailed Performance
        </h3>
        <p className="text-sm font-medium text-gray-500 mb-6">
          Complete breakdown of top menu items
        </p>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Rank
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Item Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Quantity
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, index) => (
                  <tr
                    key={item.name}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-gray-900">
                        {item.quantity}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-gray-900">
                        ${item.revenue.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
