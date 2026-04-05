import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { validatePasswordComplexity } from './password-validator';

@ValidatorConstraint({ name: 'isPasswordComplex', async: false })
export class IsPasswordComplexConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string): boolean {
    const result = validatePasswordComplexity(password);
    return result.isValid;
  }

  defaultMessage(): string {
    return 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.';
  }
}
