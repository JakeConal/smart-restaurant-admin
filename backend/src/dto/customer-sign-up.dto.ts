import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Validate,
} from 'class-validator';
import {
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
    return 'Password does not meet complexity requirements';
  }
}

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
}
