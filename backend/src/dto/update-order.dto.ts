import { OrderItem, OrderStatus } from '../schema/order.schema';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsArray()
  items?: OrderItem[];

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  billRequestedAt?: string;

  @IsOptional()
  @IsString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  updatedAt?: string;
}
