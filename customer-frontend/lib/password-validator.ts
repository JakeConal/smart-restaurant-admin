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
    feedback.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  if (!requirements.hasUpperCase) {
    feedback.push("One uppercase letter (A-Z)");
  }
  if (!requirements.hasLowerCase) {
    feedback.push("One lowercase letter (a-z)");
  }
  if (!requirements.hasNumber) {
    feedback.push("One number (0-9)");
  }
  if (!requirements.hasSpecialChar) {
    feedback.push("One special character (!@#$%...)");
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

export function getPasswordStrengthColor(score: number): string {
  if (score <= 2) return "text-red-500";
  if (score <= 3) return "text-yellow-500";
  if (score <= 4) return "text-blue-500";
  return "text-green-500";
}

export function getPasswordStrengthLabel(score: number): string {
  if (score <= 2) return "Weak";
  if (score <= 3) return "Fair";
  if (score <= 4) return "Good";
  return "Strong";
}

export function getPasswordStrengthBarColor(score: number): string {
  if (score <= 2) return "bg-red-500";
  if (score <= 3) return "bg-yellow-500";
  if (score <= 4) return "bg-blue-500";
  return "bg-green-500";
}
