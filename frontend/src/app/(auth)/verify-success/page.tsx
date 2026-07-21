"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export default function VerifySuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/login");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-10">
      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-green-700">Email Confirmed!</h2>
      <p className="text-muted-foreground max-w-sm">
        Your account{email ? <> for <strong>{email}</strong></> : ""} has been successfully verified. You can now log in.
      </p>
      <p className="text-sm text-muted-foreground">
        Redirecting to login in <strong>{countdown}</strong> second{countdown !== 1 ? "s" : ""}...
      </p>
      <Link href="/login">
        <Button>Proceed to Login</Button>
      </Link>
    </div>
  );
}
