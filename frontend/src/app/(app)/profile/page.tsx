"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/lib/api";
import { fetchJsonWithAuth } from "@/lib/api-client";
import type { User } from "@/lib/auth";

interface ProfileUpdateResponse {
  message: string;
  user: User;
}

interface ProfileState {
  firstName: string;
  lastName: string;
  email: string;
  accountType: string;
  companyName: string;
  avatarUrl: string | null;
}

function userInitials(profile: ProfileState) {
  const initials = `${profile.firstName[0] || ""}${profile.lastName[0] || ""}`.trim();
  return (initials || profile.email[0] || "A").toUpperCase();
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<ProfileState>({
    firstName: "",
    lastName: "",
    email: "",
    accountType: "",
    companyName: "",
    avatarUrl: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await fetchJsonWithAuth<User>(`${API_URL}/users/me`, {
          method: "GET",
        });
        setProfile({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          accountType: data.account_type || "",
          companyName: data.company_name || "",
          avatarUrl: data.avatar_url || null,
        });
      } catch (error) {
        console.error("Failed to fetch profile", error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };
    void fetchProfile();
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchJsonWithAuth<ProfileUpdateResponse>(`${API_URL}/users/profile`, {
        method: "PATCH",
        body: JSON.stringify({
          first_name: profile.firstName,
          last_name: profile.lastName,
        }),
      });

      setProfile((current) => ({
        ...current,
        firstName: data.user.first_name || "",
        lastName: data.user.last_name || "",
        email: data.user.email || current.email,
        accountType: data.user.account_type || current.accountType,
        companyName: data.user.company_name || "",
        avatarUrl: data.user.avatar_url || null,
      }));
      toast({ title: "Success", description: "Profile updated successfully." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.email || "Account";

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" />
      <p className="text-sm text-muted-foreground">Manage your personal information.</p>
      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border">
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt={fullName} />
                ) : null}
                <AvatarFallback className="text-xl font-semibold">
                  {userInitials(profile)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium">{isLoadingProfile ? "Loading profile..." : fullName}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {profile.companyName ? (
                  <p className="text-sm text-muted-foreground">{profile.companyName}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">Email cannot be changed here. Contact support if needed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Input id="accountType" value={profile.accountType || "individual"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={profile.companyName || "No company workspace"}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={loading || isLoadingProfile}>
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

