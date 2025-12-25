import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { MenuCategoryService } from './menu-category.service';
import { CreateMenuCategoryDto } from 'src/dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from 'src/dto/update-menu-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface User {
  userId: string;
  email: string;
  role: string;
  restaurantId: string;
}

@Controller('api/admin/menu/categories')
@UseGuards(JwtAuthGuard)
export class MenuCategoryController {
  constructor(private readonly service: MenuCategoryService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateMenuCategoryDto) {
    return this.service.create(user.restaurantId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.restaurantId);
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.service.update(id, user.restaurantId, dto);
  }

  @Patch(':id/status')
  deactivate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.deactivate(id, user.restaurantId);
  }
}
