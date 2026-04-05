import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  Validate,
} from 'class-validator';
import { IsPasswordComplexConstraint } from '../../common/password-complexity.validator';

export class CustomerSignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(50, { message: 'Password must be less than 50 characters' })
  @Validate(IsPasswordComplexConstraint)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  tableToken?: string; // Optional token to preserve after email verification
}
