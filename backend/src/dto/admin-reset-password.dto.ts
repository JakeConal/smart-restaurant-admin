import {
  IsNotEmpty,
  IsString,
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

export class AdminResetPasswordDto {
  @IsNotEmpty({ message: 'Reset token is required' })
  @IsString()
  token: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Validate(IsPasswordComplexConstraint)
  newPassword: string;
}
