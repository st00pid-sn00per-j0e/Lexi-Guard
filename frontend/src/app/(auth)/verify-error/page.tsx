"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyErrorPage() {
  const searchParams = useSearchParams();
  const msg = searchParams.get("msg") || "The verification link is invalid or has expired.";

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-10">
      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-red-700">Verification Failed</h2>
      <p className="text-muted-foreground max-w-sm">{msg}</p>
      <div className="flex gap-3">
        <Link href="/signup">
          <Button variant="outline">Back to Sign Up</Button>
        </Link>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    </div>
  );
}
