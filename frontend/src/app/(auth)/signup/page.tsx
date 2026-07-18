'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { signup, setStoredUser } from '@/lib/auth';
import { checkPasswordStrength } from '@/lib/passwordStrength';

const getErrorMessage = (err: unknown): string => {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;

  const anyErr = err as any;

  // Axios error
  if (anyErr?.response?.data?.detail) {
    return typeof anyErr.response.data.detail === 'string'
      ? anyErr.response.data.detail
      : 'Please check your inputs and try again.';
  }

  // Raw thrown object with detail
  if (anyErr?.detail) {
    return typeof anyErr.detail === 'string'
      ? anyErr.detail
      : 'Please check your inputs and try again.';
  }

  return 'An unexpected error occurred. Please try again.';
};

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteToken = searchParams.get('invite_token');
  const prefillEmail = searchParams.get('email') || '';
  const prefillCompanyName = searchParams.get('company_name') || '';
  const prefillRole = searchParams.get('role') || '';

  const initialAccountType = useMemo(() => {
    // If invite link is used, user should be company account.
    if (inviteToken) return 'company';
    return 'individual';
  }, [inviteToken]);

  const [accountType, setAccountType] = useState(initialAccountType);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Prefill when using invite links
    setEmail(prefillEmail);
    if (inviteToken) {
      setAccountType('company');
      setCompanyName(prefillCompanyName);
    }
  }, [inviteToken, prefillCompanyName, prefillEmail]);

  const passwordsMatch = password === confirmPassword;
  const passwordIsNotEmpty = password.length > 0;
  const passwordStrength = checkPasswordStrength(password);
  const isStrongPassword = passwordStrength.label === 'strong';
  // ✅ FIX: If inviteToken is present, bypass companyName requirement.
  // The backend resolves the company from the invite token payload.
  const canSubmit =
    passwordsMatch &&
    passwordIsNotEmpty &&
    firstName &&
    lastName &&
    email &&
    isStrongPassword &&
    (accountType === 'individual' || !!companyName || !!inviteToken);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!canSubmit) return;

    setIsLoading(true);

    try {
      await signup({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        // backend expects account_type values like "individual" / "company"
        account_type: accountType as 'individual' | 'company',
        company_name: accountType === 'company' ? companyName : undefined,
        // Only attach invite_token when present
        invite_token: inviteToken || undefined,
      } as any).then((response: any) => {
        if (response?.requires_verification) {
          router.push(`/verify-pending?email=${encodeURIComponent(email)}`);
          return;
        }
        setStoredUser(response.user);
        router.push('/dashboard');
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
        )}

        <div className="grid gap-2">
          <Label>Account Type</Label>
          <RadioGroup
            value={accountType}
            onValueChange={setAccountType}
            className="grid grid-cols-2 gap-4"
            disabled={!!inviteToken}
          >
            <div>
              <RadioGroupItem
                value="individual"
                id="individual"
                className="peer sr-only"
              />
              <Label
                htmlFor="individual"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Individual
              </Label>
            </div>
            <div>
              <RadioGroupItem value="company" id="company" className="peer sr-only" />
              <Label
                htmlFor="company"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Company
              </Label>
            </div>
          </RadioGroup>
        </div>

        {accountType === 'company' && (
          <div className="grid gap-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              placeholder="Your Company LLC"
              required={!inviteToken}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading || !!inviteToken}
            />

          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">First name</Label>
            <Input
              id="first-name"
              placeholder="Max"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Last name</Label>
            <Input
              id="last-name"
              placeholder="Robinson"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || !!inviteToken}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          {passwordIsNotEmpty && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      index <= passwordStrength.score
                        ? passwordStrength.color
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center">
                <p
                  className={`text-xs font-medium capitalize ${
                    passwordStrength.label === 'weak'
                      ? 'text-red-500'
                      : passwordStrength.label === 'medium'
                        ? 'text-yellow-500'
                        : 'text-green-500'
                  }`}
                >
                  {passwordStrength.label} Password
                </p>
                {!isStrongPassword && passwordStrength.tips.length > 0 && (
                  <p className="text-xs text-muted-foreground">{passwordStrength.tips[0]}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {passwordIsNotEmpty && !passwordsMatch && (
          <Alert variant="destructive" className="p-2 bg-destructive/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">Passwords do not match.</AlertDescription>
            </div>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full font-bold"
          disabled={!canSubmit || isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create an account'}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </div>
    </>
  );
}

