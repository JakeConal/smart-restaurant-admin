import { Controller, Post, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ModifierOptionService } from './modifier-option.service';
import { CreateModifierOptionDto } from '../dto/create-modifier-option.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api/admin/menu')
@UseGuards(JwtAuthGuard)
export class ModifierOptionController {
  constructor(private readonly service: ModifierOptionService) {}

  @Post('modifier-groups/:groupId/options')
  async create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateModifierOptionDto,
  ) {
    return this.service.createOption(groupId, dto);
  }

  @Put('modifier-options/:id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateModifierOptionDto,
  ) {
    return this.service.updateOption(id, user.restaurantId, dto);
  }

  @Get('modifier-groups/:groupId/options')
  async findAll(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findByGroup(groupId);
  }
}
