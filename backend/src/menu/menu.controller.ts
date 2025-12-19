import {
  Controller,
  Get,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TableService } from '../table/table.service';

@Controller('/api/menu')
export class MenuController {
  constructor(private readonly tableService: TableService) {}

  @Get()
  async verifyAndGetMenu(
    @Query('table') tableId: string,
    @Query('token') token: string,
  ) {
    if (!tableId || !token) {
      throw new BadRequestException('Table ID and token are required');
    }

    const table = await this.tableService.verifyQrToken(token);

    if (!table) {
      throw new NotFoundException(
        'This QR code is no longer valid. Please ask staff for assistance.',
      );
    }

    if (table.status !== 'active') {
      throw new BadRequestException(
        'This table is currently inactive. Please ask staff for assistance.',
      );
    }

    // Return table information - in the future, this would also return the menu
    return {
      success: true,
      message: 'QR code verified successfully',
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location,
      },
      // TODO: Add menu items here
      menu: [],
    };
  }
}
