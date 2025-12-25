import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { MenuItemModifierService } from './menu-item-modifier.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('items/:itemId/modifier-groups')
@UseGuards(JwtAuthGuard)
export class MenuItemModifierController {
  constructor(private readonly service: MenuItemModifierService) {}

  @Post()
  async attachGroups(
    @Param('itemId') itemId: string,
    @Body() groupIds: string[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.attachGroups(user.restaurantId, itemId, groupIds);
  }

  @Get()
  async findGroups(@Param('itemId') itemId: string) {
    return this.service.findGroupsByItem(itemId);
  }
}
