import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateReviewDto } from '../dto/create-review.dto';

@Controller('api/reviews')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Get('item/:menuItemId')
  getItemReviews(
    @Param('menuItemId') menuItemId: string,
    @Query('restaurantId') restaurantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getItemReviews(menuItemId, restaurantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('item/:menuItemId/rating')
  getAverageRating(
    @Param('menuItemId') menuItemId: string,
    @Query('restaurantId') restaurantId: string,
  ) {
    return this.service.getAverageRating(menuItemId, restaurantId);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.service.create(user.userId, dto);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: { rating?: number; comment?: string },
  ) {
    return this.service.updateReview(id, user.userId, dto);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.deleteReview(id, user.userId);
  }

  @Post('update-popularity-scores')
  updateAllPopularityScores() {
    return this.service.updateAllPopularityScores();
  }
}
