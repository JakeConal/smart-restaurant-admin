import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  async getRevenueReport(
    @Query('timeRange') timeRange: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const data = await this.reportsService.getRevenueReport(
        timeRange,
        startDate,
        endDate,
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch revenue report',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('top-items')
  async getTopMenuItems(
    @Query('timeRange') timeRange: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('limit') limit: number = 5,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const data = await this.reportsService.getTopMenuItems(
        timeRange,
        Number(limit),
        startDate,
        endDate,
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch top menu items',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('peak-hours')
  async getPeakHours(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const data = await this.reportsService.getPeakHours(startDate, endDate);
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch peak hours',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('stats')
  async getReportStats(
    @Query('timeRange') timeRange: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const data = await this.reportsService.getReportStats(
        timeRange,
        startDate,
        endDate,
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch report stats',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
