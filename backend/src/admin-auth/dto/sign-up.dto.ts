import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  Validate,
} from 'class-validator';
import { IsPasswordComplexConstraint } from '../../common/password-complexity.validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(50, { message: 'Password must be less than 50 characters' })
  @Validate(IsPasswordComplexConstraint)
  password: string;

  @IsString()
  fullName: string;

  @IsString()
  @IsOptional()
  roleCode?: string; // ADMIN, WAITER, KITCHEN
}
