"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Building2, Mail } from "lucide-react";
import Link from "next/link";

export default function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState<
    { email: string; company_name: string; role: string } | null
  >(null);

  useEffect(() => {
    if (!token) {
      setError("No invite token provided.");
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(
          `http://localhost:8001/api/company/invite/validate?token=${token}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Invalid link" }));
          setError(err.detail || "This invite link has expired.");
        } else {
          const data = await res.json();
          setInviteData(data);
        }
      } catch {
        setError("Failed to validate invite. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invite</CardTitle>
            <CardDescription>
              {error || "This link is no longer valid."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            You have been invited to join{' '}
            <strong>{inviteData.company_name}</strong> as a{' '}
            <strong>{inviteData.role}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{inviteData.email}</span>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Click below to create your account and get started. You will only have access to contracts you
            personally upload.
          </p>

          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              router.push(
                `/signup?email=${encodeURIComponent(inviteData.email)}` +
                  `&company_name=${encodeURIComponent(inviteData.company_name)}` +
                  `&role=${encodeURIComponent(inviteData.role)}` +
                  `&invite_token=${encodeURIComponent(token || "")}`
              );
            }}
          >
            Create Account & Join
          </Button>

          <Link
            href="/login"
            className="block text-center text-sm text-muted-foreground hover:underline"
          >
            Already have an account? Log in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

