import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { TableModule } from '../table/table.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from '../schema/table.schema';
import { TableService } from '../table/table.service';
import { QrService } from '../table/qr.service';

@Module({
  imports: [TypeOrmModule.forFeature([Table])],
  controllers: [MenuController],
  providers: [TableService, QrService],
})
export class MenuModule {}
