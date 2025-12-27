import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth(): Promise<{
    status: string;
    database?: string;
    timestamp: string;
  }> {
    try {
      const dbStatus = await this.appService.checkDatabaseConnection();
      return {
        status: 'healthy',
        database: dbStatus ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
