"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { login, setStoredUser } from "@/lib/auth";
import { checkPasswordStrength } from "@/lib/passwordStrength";


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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(password);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      setStoredUser(response.user);
      router.push(from.startsWith("/") ? from : "/dashboard");
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
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
<Link
              href="/forgot-password"
              className="ml-auto inline-block text-sm underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          {password.length > 0 && (
            <div className="flex gap-1 mt-1 items-center">
              {[1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    index <= passwordStrength.score
                      ? passwordStrength.color
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
              <span
                className={`text-xs ml-2 capitalize ${
                  passwordStrength.label === "weak"
                    ? "text-red-500"
                    : passwordStrength.label === "medium"
                      ? "text-yellow-500"
                      : "text-green-500"
                }`}
              >
                {passwordStrength.label}
              </span>
            </div>
          )}

        </div>
        <Button type="submit" className="w-full font-bold" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>
    </>
  );
}

