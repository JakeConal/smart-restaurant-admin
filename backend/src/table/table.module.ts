import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from '../schema/table.schema';
import { QrService } from './qr.service';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [TypeOrmModule.forFeature([Table]), AuthModule],
  controllers: [TableController],
  providers: [TableService, QrService],
})
export class TableModule {}
