import { Controller, UseGuards, Post, Get, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateModifierGroupDto } from '../dto/create-modifier-group.dto';
import { ModifierGroupService } from './modifier-group.service';

@Controller('/modifier-group')
@UseGuards(JwtAuthGuard)
export class ModifierGroupController {
  constructor(private readonly service: ModifierGroupService) {}
  @Post() async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateModifierGroupDto,
  ) {
    return this.service.createGroup(user.restaurantId, dto);
  }
  @Get() async findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAllByRestaurant(user.restaurantId);
  }
}
