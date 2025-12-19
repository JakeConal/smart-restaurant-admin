import { IsString, IsInt, Min, Max, IsOptional, IsIn } from 'class-validator';

export class CreateTableDto {
  @IsString()
  tableNumber: string;

  @IsInt()
  @Min(1)
  @Max(20)
  capacity: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
