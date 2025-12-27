import {
  Controller,
  UseGuards,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guards';
import { AdminGuard } from 'src/auth/guards/admin.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateModifierGroupDto } from '../dto/create-modifier-group.dto';
import { ModifierGroupService } from './modifier-group.service';

@Controller('api/admin/menu/modifier-groups')
@UseGuards(AdminGuard)
export class ModifierGroupController {
  constructor(private readonly service: ModifierGroupService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateModifierGroupDto,
  ) {
    try {
      console.log('Creating modifier group with data:', dto, 'user:', user);
      return await this.service.createGroup(user.restaurantId, dto);
    } catch (error) {
      console.error('Error creating modifier group:', error);
      throw new HttpException(
        error.message || 'Failed to create modifier group',
        HttpStatus.BAD_REQUEST,
      );
    }
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
