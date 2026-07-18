"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { API_URL } from "@/lib/api";

const getErrorMessage = (err: unknown): string => {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  const anyErr = err as any;
  if (anyErr?.detail) {
    return typeof anyErr.detail === "string" ? anyErr.detail : "Please check your inputs and try again.";
  }
  return "An unexpected error occurred. Please try again.";
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const targetUrl = `${API_URL}/auth/forgot-password`;

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to send reset code");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      console.error("❌ Fetch failed:", err);
      setError(err.message || getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">Forgot Password?</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your email and we'll send you an OTP to reset your password.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">{error}</div>
      )}
      
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
          Code sent! Redirecting...
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
          disabled={isLoading || success}
        />
      </div>

      <Button
        type="submit"
        className="w-full font-bold"
        disabled={isLoading || success}
      >
        {isLoading ? "Sending Code..." : "Send Reset Code"}
      </Button>

      <div className="text-center text-sm">
        <Link href="/login" className="underline">
          Back to Login
        </Link>
      </div>
    </form>
  );
}

