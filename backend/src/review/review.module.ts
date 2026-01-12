import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../schema/review.schema';
import { MenuItem } from '../schema/menu-item.schema';
import { Customer } from '../schema/customer.schema';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, MenuItem, Customer]), AuthModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
