import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { MenuItemModifierService } from '../services/menu-item-modifier.service';

import { AdminGuard } from '../../admin-auth/guards/admin.guard';
import { CurrentUser } from '../../customer-auth/decorators/current-user.decorator';
import type { AuthUser } from '../../customer-auth/interfaces/auth-user.interface';

@Controller('api/admin/menu/items/:itemId/modifier-groups')
@UseGuards(AdminGuard)
export class MenuItemModifierController {
  constructor(private readonly service: MenuItemModifierService) {}

  @Post()
  async attachGroups(
    @Param('itemId') itemId: string,
    @Body() body: { groupIds: string[] },
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.attachGroups(user.restaurantId, itemId, body.groupIds);
  }

  @Get()
  async findGroups(@Param('itemId') itemId: string) {
    return this.service.findGroupsByItem(itemId);
  }
}
