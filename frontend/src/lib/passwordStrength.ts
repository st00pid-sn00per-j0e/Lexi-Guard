export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function checkPasswordStrength(password: string): {
  score: number;
  label: PasswordStrength;
  color: string;
  tips: string[];
} {
  let score = 0;
  const tips: string[] = [];

  if (!password) {
    return {
      score: 0,
      label: 'weak',
      color: 'bg-gray-200 dark:bg-gray-700',
      tips: ['Enter a password'],
    };
  }

  if (password.length >= 8) score++; else tips.push('At least 8 characters');
  if (password.length >= 12) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else tips.push('Mix of uppercase & lowercase');

  if (/\d/.test(password)) score++;
  else tips.push('Include a number');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else tips.push('Include a special character (!@#$)');

  if (score <= 2) {
    return { score, label: 'weak', color: 'bg-red-500', tips };
  }

  if (score <= 4) {
    return { score, label: 'medium', color: 'bg-yellow-500', tips };
  }

  return { score, label: 'strong', color: 'bg-green-500', tips: ['Excellent password!'] };
}

