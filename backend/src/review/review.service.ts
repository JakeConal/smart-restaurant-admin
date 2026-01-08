import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from 'src/schema/review.schema';
import { MenuItem } from 'src/schema/menu-item.schema';
import { Customer } from 'src/schema/customer.schema';
import { CreateReviewDto } from '../dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async create(customerId: string, dto: CreateReviewDto) {
    // Verify the customer exists
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Verify the menu item exists
    const menuItem = await this.itemRepo.findOne({
      where: {
        id: dto.menuItemId,
        isDeleted: false,
      },
    });

    if (!menuItem) {
      throw new BadRequestException('Menu item not found');
    }

    const restaurantId = menuItem.restaurantId;

    // Check if customer already reviewed this item
    const existingReview = await this.reviewRepo.findOne({
      where: {
        customerId,
        menuItemId: dto.menuItemId,
        isDeleted: false,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this item');
    }

    const review = this.reviewRepo.create({
      ...dto,
      restaurantId,
      customerId,
    });

    const savedReview = await this.reviewRepo.save(review);

    // Load the customer relation for the response
    const reviewWithCustomer = await this.reviewRepo.findOne({
      where: { id: savedReview.id },
      relations: ['customer'],
    });

    const customerData = reviewWithCustomer?.customer as
      | (Customer & { firstName?: string; lastName?: string })
      | undefined;
    const customerName =
      `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim() ||
      customerData?.email ||
      'Anonymous';

    return {
      id: reviewWithCustomer.id,
      customerId: reviewWithCustomer.customerId,
      customerName,
      menuItemId: reviewWithCustomer.menuItemId,
      orderId: reviewWithCustomer.orderId,
      rating: reviewWithCustomer.rating,
      comment: reviewWithCustomer.comment,
      createdAt: reviewWithCustomer.createdAt,
    };
  }

  async getItemReviews(
    menuItemId: string,
    restaurantId: string,
    filters?: {
      page?: number;
      limit?: number;
    },
  ) {
    const queryBuilder = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.customer', 'customer')
      .where('review.menuItemId = :menuItemId', { menuItemId })
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .andWhere('review.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('review.createdAt', 'DESC');

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    // Get total count
    const totalQuery = this.reviewRepo
      .createQueryBuilder('review')
      .where('review.menuItemId = :menuItemId', { menuItemId })
      .andWhere('review.restaurantId = :restaurantId', { restaurantId })
      .andWhere('review.isDeleted = :isDeleted', { isDeleted: false });

    const [reviews, total] = await Promise.all([
      queryBuilder.getMany(),
      totalQuery.getCount(),
    ]);

    const formattedReviews = reviews.map((review) => {
      const reviewCustomer = review.customer as
        | (Customer & { firstName?: string; lastName?: string })
        | undefined;
      const customerName =
        `${reviewCustomer?.firstName || ''} ${reviewCustomer?.lastName || ''}`.trim() ||
        reviewCustomer?.email ||
        'Anonymous';

      return {
        id: review.id,
        customerId: review.customerId,
        customerName,
        menuItemId: review.menuItemId,
        orderId: review.orderId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      };
    });

    return {
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAverageRating(menuItemId: string, restaurantId: string) {
    const result = (await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.menuItemId = :menuItemId', { menuItemId })
      .andWhere('review.restaurantId = :restaurantId', { restaurantId })
      .andWhere('review.isDeleted = :isDeleted', { isDeleted: false })
      .getRawOne()) as { averageRating?: string; totalReviews?: string };

    return {
      averageRating: result?.averageRating
        ? parseFloat(result.averageRating)
        : 0,
      totalReviews: result?.totalReviews ? parseInt(result.totalReviews) : 0,
    };
  }

  async deleteReview(reviewId: string, customerId: string) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, customerId, isDeleted: false },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isDeleted = true;
    return this.reviewRepo.save(review);
  }

  async updateReview(
    reviewId: string,
    customerId: string,
    updates: { rating?: number; comment?: string },
  ) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, customerId, isDeleted: false },
      relations: ['customer'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (updates.rating !== undefined) {
      if (updates.rating < 1 || updates.rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }
      review.rating = updates.rating;
    }

    if (updates.comment !== undefined) {
      review.comment = updates.comment;
    }

    const updatedReview = await this.reviewRepo.save(review);

    const customerData = review.customer as
      | (Customer & { firstName?: string; lastName?: string })
      | undefined;
    const customerName =
      `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim() ||
      customerData?.email ||
      'Anonymous';

    return {
      id: updatedReview.id,
      customerId: updatedReview.customerId,
      customerName,
      menuItemId: updatedReview.menuItemId,
      orderId: updatedReview.orderId,
      rating: updatedReview.rating,
      comment: updatedReview.comment,
      createdAt: updatedReview.createdAt,
      updatedAt: updatedReview.updatedAt,
    };
  }
}
