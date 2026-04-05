import {
  IsString,
  Length,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { CategoryStatus } from '../entities/menu-category.entity';

export class CreateMenuCategoryDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}


