export interface PasswordStrength {
  isValid: boolean;
  score: number;
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

export function validatePasswordComplexity(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUpperCase: PASSWORD_REQUIREMENTS.hasUpperCase.test(password),
    hasLowerCase: PASSWORD_REQUIREMENTS.hasLowerCase.test(password),
    hasNumber: PASSWORD_REQUIREMENTS.hasNumber.test(password),
    hasSpecialChar: PASSWORD_REQUIREMENTS.hasSpecialChar.test(password),
  };

  const feedback: string[] = [];

  if (!requirements.minLength) {
    feedback.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
    );
  }
  if (!requirements.hasUpperCase) {
    feedback.push('Password must contain at least one uppercase letter (A-Z)');
  }
  if (!requirements.hasLowerCase) {
    feedback.push('Password must contain at least one lowercase letter (a-z)');
  }
  if (!requirements.hasNumber) {
    feedback.push('Password must contain at least one number (0-9)');
  }
  if (!requirements.hasSpecialChar) {
    feedback.push(
      'Password must contain at least one special character (!@#$%^&*...)',
    );
  }

  const isValid = Object.values(requirements).every((val) => val);
  const score = Object.values(requirements).filter((val) => val).length;

  return {
    isValid,
    score,
    feedback,
    requirements,
  };
}
