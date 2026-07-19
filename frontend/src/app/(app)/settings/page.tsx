"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/lib/api";
import { fetchJsonWithAuth } from "@/lib/api-client";
import type { User } from "@/lib/auth";

interface SettingsUpdateResponse {
  message: string;
  user: User;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [settings, setSettings] = useState({
    companyName: "",
    aiModel: "Legal Bert By Nizami",
    twoFactorAuth: false,
    accountType: "individual",
    role: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await fetchJsonWithAuth<User>(`${API_URL}/users/me`, {
          method: "GET",
        });
        setSettings({
          companyName: data.company_name || "",
          aiModel: data.ai_model || "Legal Bert By Nizami",
          twoFactorAuth: Boolean(data.is_2fa_enabled),
          accountType: data.account_type || "individual",
          role: data.role || "",
        });
      } catch (err) {
        console.error("Failed to fetch settings", err);
        toast({
          title: "Error",
          description: "Failed to load account settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    void fetchSettings();
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchJsonWithAuth<SettingsUpdateResponse>(`${API_URL}/users/settings`, {
        method: "PATCH",
        body: JSON.stringify({
          company_name: settings.companyName,
          ai_model: settings.aiModel,
          two_factor_auth: settings.twoFactorAuth,
        }),
      });

      setSettings((current) => ({
        ...current,
        companyName: data.user.company_name || "",
        aiModel: data.user.ai_model || current.aiModel,
        twoFactorAuth: Boolean(data.user.is_2fa_enabled),
        accountType: data.user.account_type || current.accountType,
        role: data.user.role || current.role,
      }));
      toast({ title: "Success", description: "Settings updated successfully." });
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

  const isCompanyAccount = settings.accountType === "company";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <p className="text-sm text-muted-foreground">Manage your account and application preferences.</p>
      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder={isCompanyAccount ? "Enter your company name" : "No company account"}
                disabled={isLoadingSettings || !isCompanyAccount}
              />
              <p className="text-sm text-muted-foreground">
                {isCompanyAccount
                  ? `Signed in as ${settings.role || "member"} for ${settings.companyName || "your company"}.`
                  : "This individual account is not linked to a company workspace."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiModel">AI Analysis Model</Label>
              <Select value={settings.aiModel} onValueChange={(value) => setSettings({ ...settings, aiModel: value })}>
                <SelectTrigger id="aiModel">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Legal Bert By Nizami">Legal Bert By Nizami</SelectItem>
                  <SelectItem value="Default GPT-4">Default GPT-4</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Currently active:{" "}
                <span className="font-semibold text-primary">{settings.aiModel}</span>
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="twoFactorAuth">Two-Factor Authentication (2FA)</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading || isLoadingSettings}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}


