import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from '../table/entities/table.entity';
import { QrService } from './qr.service';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
@Module({
  imports: [TypeOrmModule.forFeature([Table]), CustomerAuthModule],
  controllers: [TableController],
  providers: [TableService, QrService],
  exports: [TableService],
})
export class TableModule {}

