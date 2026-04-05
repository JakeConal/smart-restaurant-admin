import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.schema';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { Customer } from '../customer-auth/entities/customer.schema';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, MenuItem, Customer]), CustomerAuthModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}

