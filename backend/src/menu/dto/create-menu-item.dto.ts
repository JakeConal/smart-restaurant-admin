import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { MenuItemStatus } from '../entities/menu-item.entity';

export class CreateMenuItemDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsUUID()
  categoryId: string;

  @IsNumber()
  @Min(0.01)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  prepTimeMinutes?: number;

  @IsEnum(MenuItemStatus)
  status: MenuItemStatus;

  @IsOptional()
  @IsBoolean()
  isChefRecommended?: boolean;
}


