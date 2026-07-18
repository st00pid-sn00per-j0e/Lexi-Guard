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

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    companyName: "",
    aiModel: "Legal Bert By Nizami",
    twoFactorAuth: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Backend currently exposes auth info via /api/auth/me
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setSettings({
            companyName: data.company_name || "",
            aiModel: data.ai_model || "Legal Bert By Nizami",
            twoFactorAuth: Boolean(data.is_2fa_enabled),
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("company_name", settings.companyName);
      formData.append("ai_model", settings.aiModel);
      formData.append("two_factor_auth", String(settings.twoFactorAuth));

      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        toast({ title: "Success", description: "Settings updated successfully." });
      } else {
        const err = await res.json().catch(() => null);
        toast({
          title: "Error",
          description: err?.detail || "Failed to update settings.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
                placeholder="Enter your company name"
              />
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
                <span className="font-semibold text-primary">Legal Bert By Nizami</span>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}


