import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ModifierOptionService } from './modifier-option.service';
import { CreateModifierOptionDto } from '../dto/create-modifier-option.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('modifier-groups/:groupId/options')
@UseGuards(JwtAuthGuard)
export class ModifierOptionController {
  constructor(private readonly service: ModifierOptionService) {}

  @Post()
  async create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateModifierOptionDto,
  ) {
    return this.service.createOption(groupId, dto);
  }

  @Get()
  async findAll(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findByGroup(groupId);
  }
}
