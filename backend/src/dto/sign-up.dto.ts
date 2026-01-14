import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { validatePasswordComplexity } from '../common/password-validator';

@ValidatorConstraint({ name: 'isPasswordComplex', async: false })
export class IsPasswordComplexConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    const result = validatePasswordComplexity(password);
    return result.isValid;
  }

  defaultMessage(): string {
    return 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.';
  }
}

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
