import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateMenuItemDto } from '../dto/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/update-menu-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/admin/menu/items')
export class MenuItemController {
  constructor(private readonly service: MenuItemService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.restaurantId);
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

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.restaurantId);
  }
}
