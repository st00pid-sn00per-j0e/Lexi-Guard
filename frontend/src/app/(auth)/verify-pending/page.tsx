"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";

export default function VerifyPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "";
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string>("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (!email) return;

    let intervalId: number | null = null;

    const poll = async () => {
      setIsChecking(true);
      setError("");
      try {
        const res = await fetch(
          `${API_URL}/auth/check-verification?email=${encodeURIComponent(email)}`,
          { method: "GET", credentials: "include" }
        );

        if (!res.ok) throw new Error("Failed to check verification");

        const data = await res.json();
        if (data?.is_verified) {
          if (intervalId) window.clearInterval(intervalId);
          router.push(`/verify-success?email=${encodeURIComponent(email)}`);
        }
      } catch (e) {
        // keep polling; optionally surface transient error
        setError(e instanceof Error ? e.message : "Polling error");
      } finally {
        setIsChecking(false);
      }
    };

    // initial poll quickly
    poll();
    intervalId = window.setInterval(poll, 3000);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [email, router]);

  const handleResend = async () => {
    if (!email || resendStatus === "sending") return;
    setResendStatus("sending");
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to resend");
      setResendStatus("sent");
      // Reset after 30 seconds so user can try again
      setTimeout(() => setResendStatus("idle"), 30000);
    } catch {
      setResendStatus("error");
      setTimeout(() => setResendStatus("idle"), 5000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-10">
      <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
        <Mail className="h-8 w-8 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold">Check your email</h2>
      <p className="text-muted-foreground max-w-sm">
        We sent a confirmation link to <strong>{email}</strong>. Please open your email and click{" "}
        <strong>&quot;Yes, this is me&quot;</strong> to activate your account.
      </p>

      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full">
        {isChecking ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        ) : (
          <div className="h-4 w-4 rounded-full bg-gray-300" />
        )}
        <span>Waiting for confirmation...</span>
      </div>

      {error ? <div className="text-xs text-red-500">{error}</div> : null}

      {resendStatus === "sent" && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-4 py-2">
          Verification email resent! Check your inbox.
        </div>
      )}
      {resendStatus === "error" && (
        <div className="text-sm text-red-600">Failed to resend email. Please try again.</div>
      )}

      <div className="flex flex-col gap-3 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resendStatus === "sending" || resendStatus === "sent"}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${resendStatus === "sending" ? "animate-spin" : ""}`} />
          {resendStatus === "sending"
            ? "Resending..."
            : resendStatus === "sent"
            ? "Email Sent!"
            : "Resend verification email"}
        </Button>

        <Button variant="ghost" size="sm" onClick={() => router.push("/signup")}>
          Back to Sign up
        </Button>
      </div>
    </div>
  );
}
