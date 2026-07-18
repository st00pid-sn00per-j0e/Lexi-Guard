"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function VerifySuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-10">
      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-green-700">Email Confirmed!</h2>
      <p className="text-muted-foreground max-w-sm">
        Your account for <strong>{email}</strong> has been successfully verified. You can now log in.
      </p>
      <Link href="/login">
        <Button>Proceed to Login</Button>
      </Link>
    </div>
  );
}

