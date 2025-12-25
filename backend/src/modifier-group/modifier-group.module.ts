import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModifierGroupController } from './modifier-group.controller';
import { ModifierGroupService } from './modifier-group.service';
import { ModifierGroup } from '../schema/modifier-group.schema';

@Module({
  imports: [TypeOrmModule.forFeature([ModifierGroup])],
  controllers: [ModifierGroupController],
  providers: [ModifierGroupService],
})
export class ModifierGroupModule {}
