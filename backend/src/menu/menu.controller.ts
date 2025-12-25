import {
  Controller,
  Get,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TableService } from '../table/table.service';
import { MenuService } from './menu.service';

@Controller('/api/menu')
export class MenuController {
  constructor(
    private readonly tableService: TableService,
    private readonly menuService: MenuService,
  ) {}

  @Get()
  async verifyAndGetMenu(
    @Query('table') tableId: string,
    @Query('token') token: string,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sort') sort?: string,
    @Query('chefRecommended') chefRecommended?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
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

    // Parse query params
    const query = {
      q,
      categoryId,
      sort,
      chefRecommended:
        chefRecommended === 'true'
          ? true
          : chefRecommended === 'false'
            ? false
            : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    const menu = await this.menuService.getGuestMenu(table.restaurantId, query);

    return {
      success: true,
      message: 'QR code verified successfully',
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location,
      },
      menu,
    };
  }
}
