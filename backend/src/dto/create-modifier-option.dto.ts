import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModifierOptionDto {
  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceAdjustment: number;
}
