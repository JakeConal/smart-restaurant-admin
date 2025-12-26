import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModifierOptionService } from './modifier-option.service';
import { ModifierOption } from '../schema/modifier-option.schema';
import { ModifierGroup } from '../schema/modifier-group.schema';
import { ModifierOptionController } from './modifier-option.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ModifierOption, ModifierGroup])],
  providers: [ModifierOptionService],
  exports: [ModifierOptionService],
  controllers: [ModifierOptionController],
})
export class ModifierOptionModule {}
