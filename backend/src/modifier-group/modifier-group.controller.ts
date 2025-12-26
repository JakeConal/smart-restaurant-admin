import { Controller, UseGuards, Post, Get, Put, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateModifierGroupDto } from '../dto/create-modifier-group.dto';
import { ModifierGroupService } from './modifier-group.service';

@Controller('api/admin/menu/modifier-groups')
@UseGuards(JwtAuthGuard)
export class ModifierGroupController {
  constructor(private readonly service: ModifierGroupService) {}
  
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateModifierGroupDto,
  ) {
    return this.service.createGroup(user.restaurantId, dto);
  }
  
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateModifierGroupDto,
  ) {
    return this.service.updateGroup(id, user.restaurantId, dto);
  }
  
  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAllByRestaurant(user.restaurantId);
  }
}
