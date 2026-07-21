"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkPasswordStrength } from "@/lib/passwordStrength";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordStrength = checkPasswordStrength(newPassword);
  const isStrong = passwordStrength.label === "strong";
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = otp.length === 6 && isStrong && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otp, new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      console.error("❌ Reset password error:", err);
      setError(err.message || getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
          Password reset successfully! Redirecting to login...
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="otp">OTP Code</Label>
        <Input
          id="otp"
          type="text"
          placeholder="123456"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="text-center tracking-widest text-lg"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        {newPassword.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i <= passwordStrength.score
                      ? passwordStrength.color
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
            <p
              className={`text-xs capitalize ${
                passwordStrength.label === "strong" ? "text-green-500" : "text-red-500"
              }`}
            >
              {passwordStrength.label} {passwordStrength.tips[0]}
            </p>
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
          required
        />
        {newPassword && confirmPassword && !passwordsMatch && (
          <p className="text-xs text-red-500">Passwords do not match.</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full font-bold"
        disabled={!canSubmit || isLoading || success}
      >
        {isLoading ? "Resetting..." : success ? "Password Reset!" : "Reset Password"}
      </Button>
    </form>
  );
}

