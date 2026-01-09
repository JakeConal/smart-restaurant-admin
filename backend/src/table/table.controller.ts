import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Delete,
  Query,
  Res,
  Header,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { TableService } from './table.service';
import { CreateTableDto } from '../dto/create-table.dto';
import { UpdateTableDto } from '../dto/update-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guards';
import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { PermissionGuard } from '../admin-auth/guards/permission.guard';
import { RequirePermission } from '../admin-auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('/api/admin/tables')
@UseGuards(AdminGuard, PermissionGuard)
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  @RequirePermission('table:manage')
  create(@Body() dto: CreateTableDto, @CurrentUser() user: AuthUser) {
    return this.tableService.create(dto, user.restaurantId);
  }

  @Get()
  @RequirePermission('table:read')
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: 'active' | 'inactive',
    @Query('location') location?: string,
    @Query('sortBy') sortBy?: 'tableNumber' | 'capacity' | 'createdAt',
  ) {
    return this.tableService.findAll(
      { status, location, sortBy },
      user.restaurantId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tableService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tableService.update(id, dto);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'inactive',
  ) {
    return this.tableService.changeStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tableService.remove(id);
  }

  @Post(':id/qr/generate')
  async generateQrCode(@Param('id') id: string) {
    return this.tableService.generateQrCode(id);
  }

  @Post(':id/qr/regenerate')
  async regenerateQrCode(@Param('id') id: string) {
    return this.tableService.regenerateQrCode(id);
  }

  @Get(':id/qr/data-url')
  async getQrCodeDataUrl(@Param('id') id: string) {
    return await this.tableService.getQrCodeDataUrl(id);
  }

  @Get(':id/qr/download')
  async downloadQrCode(
    @Param('id') id: string,
    @Query('format') format: 'png' | 'pdf' = 'png',
    @Res() res: Response,
  ) {
    const table = await this.tableService.findOne(id);

    if (format === 'pdf') {
      const pdfBuffer = await this.tableService.downloadQrCodePdf(id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="table-${table.tableNumber}-qr.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } else {
      const pngBuffer = await this.tableService.downloadQrCodePng(id);
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="table-${table.tableNumber}-qr.png"`,
        'Content-Length': pngBuffer.length,
      });
      res.send(pngBuffer);
    }
  }

  @Get('qr/download-all')
  async downloadAllQrCodes(
    @CurrentUser() user: AuthUser,
    @Query('format') format: 'pdf' | 'zip' = 'pdf',
    @Res() res: Response,
  ) {
    if (format === 'zip') {
      const zipStream = await this.tableService.downloadAllQrCodesZip(
        user.restaurantId,
      );
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="all-tables-qr-codes.zip"',
      });
      zipStream.pipe(res);
    } else {
      const pdfBuffer = await this.tableService.downloadAllQrCodes(
        user.restaurantId,
      );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="all-tables-qr-codes.pdf"',
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    }
  }

  @Post('qr/regenerate-all')
  async regenerateAllQrCodes(@CurrentUser() user: AuthUser) {
    return this.tableService.regenerateAllQrCodes(user.restaurantId);
  }
}
