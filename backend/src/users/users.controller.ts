import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { PermissionGuard } from '../admin-auth/guards/permission.guard';
import { RequirePermission } from '../admin-auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateWaiterDto } from '../dto/create-waiter.dto';
import { UpdateWaiterDto } from '../dto/update-waiter.dto';
import { CreateKitchenStaffDto } from '../dto/create-kitchen-staff.dto';
import { UpdateKitchenStaffDto } from '../dto/update-kitchen-staff.dto';

@Controller('api/admin/users')
@UseGuards(AdminGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('waiters')
  @RequirePermission('user:read')
  async getWaiters(@CurrentUser() user: AuthUser) {
    return this.usersService.getWaiters(user.restaurantId);
  }

  @Get('waiters/:id')
  @RequirePermission('user:read')
  async getWaiterById(@Param('id') id: string) {
    return this.usersService.getWaiterById(id);
  }

  @Post('waiters')
  @RequirePermission('user:create')
  @HttpCode(HttpStatus.CREATED)
  async createWaiter(@Body() dto: CreateWaiterDto) {
    return this.usersService.createWaiter(dto);
  }

  @Put('waiters/:id')
  @RequirePermission('user:update')
  @HttpCode(HttpStatus.OK)
  async updateWaiter(@Param('id') id: string, @Body() dto: UpdateWaiterDto) {
    return this.usersService.updateWaiter(id, dto);
  }

  @Delete('waiters/:id')
  @RequirePermission('user:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWaiter(@Param('id') id: string) {
    await this.usersService.deleteWaiter(id);
  }

  @Patch('waiters/:id/suspend')
  @RequirePermission('user:update')
  @HttpCode(HttpStatus.OK)
  async suspendWaiter(@Param('id') id: string) {
    await this.usersService.suspendWaiter(id);
    return { message: 'Waiter status updated successfully' };
  }

  // ============= KITCHEN STAFF ENDPOINTS =============

  @Get('kitchen')
  @RequirePermission('user:read')
  async getKitchenStaff(@CurrentUser() user: AuthUser) {
    return this.usersService.getKitchenStaff(user.restaurantId);
  }

  @Get('kitchen/:id')
  @RequirePermission('user:read')
  async getKitchenStaffById(@Param('id') id: string) {
    return this.usersService.getKitchenStaffById(id);
  }

  @Post('kitchen')
  @RequirePermission('user:create')
  @HttpCode(HttpStatus.CREATED)
  async createKitchenStaff(@Body() dto: CreateKitchenStaffDto) {
    return this.usersService.createKitchenStaff(dto);
  }

  @Put('kitchen/:id')
  @RequirePermission('user:update')
  @HttpCode(HttpStatus.OK)
  async updateKitchenStaff(
    @Param('id') id: string,
    @Body() dto: UpdateKitchenStaffDto,
  ) {
    return this.usersService.updateKitchenStaff(id, dto);
  }

  @Delete('kitchen/:id')
  @RequirePermission('user:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKitchenStaff(@Param('id') id: string) {
    await this.usersService.deleteKitchenStaff(id);
  }

  @Patch('kitchen/:id/suspend')
  @RequirePermission('user:update')
  @HttpCode(HttpStatus.OK)
  async suspendKitchenStaff(@Param('id') id: string) {
    await this.usersService.suspendKitchenStaff(id);
    return { message: 'Kitchen staff status updated successfully' };
  }
}
