import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../schema/order.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  private getDateRange(
    timeRange: 'daily' | 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    const end: Date = endDate ? new Date(endDate) : now;

    if (startDate) {
      start = new Date(startDate);
    } else {
      switch (timeRange) {
        case 'daily':
          start = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'weekly':
          start = new Date(now.setDate(now.getDate() - 28));
          break;
        case 'monthly':
          start = new Date(now.setMonth(now.getMonth() - 6));
          break;
        default:
          start = new Date(now.setDate(now.getDate() - 7));
      }
    }

    return { start, end };
  }

  async getRevenueReport(
    timeRange: 'daily' | 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string,
  ) {
    const { start, end } = this.getDateRange(timeRange, startDate, endDate);

    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(start, end),
        isPaid: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    // Group by period
    const grouped = this.groupByPeriod(orders, timeRange);
    return grouped;
  }

  async getTopMenuItems(
    timeRange: 'daily' | 'weekly' | 'monthly',
    limit: number = 5,
    startDate?: string,
    endDate?: string,
  ) {
    const { start, end } = this.getDateRange(timeRange, startDate, endDate);

    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(start, end),
        isPaid: true,
      },
    });

    // Aggregate items
    const itemMap = new Map<
      string,
      {
        name: string;
        revenue: number;
        quantity: number;
        category: string;
      }
    >();

    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const itemId = String(item.menuItemId || item.id || '');
          const itemName = String(item.menuItemName || 'Unknown');
          const itemPrice = parseFloat(
            String(item.unitPrice || item.totalPrice / item.quantity || 0),
          );
          const itemQuantity = parseInt(String(item.quantity || 1), 10);
          const itemCategory = 'Menu Item'; // Category not stored in order items

          if (itemMap.has(itemId)) {
            const existing = itemMap.get(itemId);
            if (existing) {
              existing.revenue += itemPrice * itemQuantity;
              existing.quantity += itemQuantity;
            }
          } else {
            itemMap.set(itemId, {
              name: itemName,
              revenue: itemPrice * itemQuantity,
              quantity: itemQuantity,
              category: itemCategory,
            });
          }
        });
      }
    });

    // Convert to array and sort by revenue
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return topItems;
  }

  async getPeakHours(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange('daily', startDate, endDate);

    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(start, end),
      },
    });

    // Group by hour
    const hourMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourMap.set(i, 0);
    }

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    // Convert to array with formatted hours
    const peakHours = Array.from(hourMap.entries())
      .filter(([hour]) => hour >= 6 && hour <= 23) // Only show 6 AM to 11 PM
      .map(([hour, count]) => ({
        hour: this.formatHour(hour),
        orders: count,
      }));

    return peakHours;
  }

  async getReportStats(
    timeRange: 'daily' | 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string,
  ) {
    const { start, end } = this.getDateRange(timeRange, startDate, endDate);

    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(start, end),
        isPaid: true,
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) =>
        sum + parseFloat(String(order.finalTotal || order.total || 0)),
      0,
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get top selling item
    const topItems = await this.getTopMenuItems(
      timeRange,
      1,
      startDate,
      endDate,
    );
    const topSellingItem = topItems.length > 0 ? topItems[0].name : 'N/A';

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      topSellingItem,
    };
  }

  private groupByPeriod(
    orders: Order[],
    timeRange: 'daily' | 'weekly' | 'monthly',
  ) {
    const grouped = new Map<
      string,
      { period: string; revenue: number; orders: number }
    >();

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      let key: string;

      switch (timeRange) {
        case 'daily':
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'weekly': {
          const weekNum = this.getWeekNumber(date);
          key = `Week ${weekNum}`;
          break;
        }
        case 'monthly':
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        default:
          key = date.toLocaleDateString();
      }

      const revenue = parseFloat(String(order.finalTotal || order.total || 0));

      if (grouped.has(key)) {
        const existing = grouped.get(key);
        if (existing) {
          existing.revenue += revenue;
          existing.orders += 1;
        }
      } else {
        grouped.set(key, {
          period: key,
          revenue,
          orders: 1,
        });
      }
    });

    return Array.from(grouped.values());
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  }
}
