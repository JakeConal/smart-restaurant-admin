import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModifierOptionService } from './modifier-option.service';
import { ModifierOption } from '../schema/modifier-option.schema';
import { ModifierOptionController } from './modifier-option.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ModifierOption])],
  providers: [ModifierOptionService],
  exports: [ModifierOptionService],
  controllers: [ModifierOptionController],
})
export class ModifierOptionModule {}
