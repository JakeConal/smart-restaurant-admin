import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { PermissionGuard } from '../admin-auth/guards/permission.guard';
import { RequirePermission } from '../admin-auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api/admin/users')
@UseGuards(AdminGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('waiters')
  @RequirePermission('user:read')
  async getWaiters(@CurrentUser() user: AuthUser) {
    return this.usersService.getWaiters(user.restaurantId);
  }
}
