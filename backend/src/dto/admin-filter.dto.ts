import { IsOptional, IsString, IsIn } from 'class-validator';

export class AdminFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'ALL'])
  status?: 'ACTIVE' | 'SUSPENDED' | 'ALL';

  @IsOptional()
  @IsString()
  restaurantId?: string;
}
