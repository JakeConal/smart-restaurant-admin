import { IsString, IsNumber, Min, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModifierOptionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceAdjustment?: number;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
