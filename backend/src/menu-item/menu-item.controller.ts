import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guards';
import { AdminGuard } from '../auth/guards/admin.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateMenuItemDto } from '../dto/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/update-menu-item.dto';

@UseGuards(AdminGuard)
@Controller('api/admin/menu/items')
export class MenuItemController {
  constructor(private readonly service: MenuItemService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('chefRecommended') chefRecommended?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      search,
      categoryId,
      status,
      chefRecommended: chefRecommended ? chefRecommended === 'true' : undefined,
      sortBy,
      page: page ? parseInt(page) : 1,
      limit: limit && limit.trim() !== '' ? parseInt(limit) : 12,
    };
    return this.service.findAll(user.restaurantId, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.restaurantId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMenuItemDto) {
    return this.service.create(user.restaurantId, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.service.update(id, user.restaurantId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { status: 'available' | 'unavailable' | 'sold_out' },
  ) {
    return this.service.updateStatus(id, user.restaurantId, body.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.restaurantId);
  }
}
