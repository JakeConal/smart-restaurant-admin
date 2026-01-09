import { OrderItem, OrderStatus } from '../schema/order.schema';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  table_id?: string;

  @IsString()
  tableNumber: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsArray()
  items: OrderItem[];

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
