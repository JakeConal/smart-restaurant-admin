import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SelectionType } from '../schema/modifier-group.schema';

export class CreateModifierGroupDto {
  @IsString()
  name: string;

  @IsEnum(SelectionType)
  selectionType: SelectionType;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minSelections?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxSelections?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;
}
