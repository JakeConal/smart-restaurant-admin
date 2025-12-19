import { IsString, IsInt, Min, Max, IsOptional, IsIn } from 'class-validator';

export class UpdateTableDto {
  @IsOptional() @IsString() tableNumber?: string;
  @IsOptional() @IsInt() @Min(1) @Max(20) capacity?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['active', 'inactive']) status?: string;
  @IsOptional() @IsString() qrToken?: string;
}
