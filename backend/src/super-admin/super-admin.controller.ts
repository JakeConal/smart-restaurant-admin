import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { AdminFilterDto } from '../dto/admin-filter.dto';

@Controller('api/super-admin/admins')
@UseGuards(SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  async getAdmins(@Query() filter: AdminFilterDto) {
    return this.superAdminService.getAdmins(filter);
  }

  @Get(':id')
  async getAdminById(@Param('id') id: string) {
    return this.superAdminService.getAdminById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.superAdminService.createAdmin(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateAdmin(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.superAdminService.updateAdmin(id, dto);
  }

  @Patch(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  async toggleAdminStatus(@Param('id') id: string) {
    const result = await this.superAdminService.toggleAdminStatus(id);
    return { message: 'Admin status updated successfully', status: result.status };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAdmin(@Param('id') id: string) {
    await this.superAdminService.deleteAdmin(id);
  }
}
