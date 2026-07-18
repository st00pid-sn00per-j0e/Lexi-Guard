"use server";

import { revalidatePath } from "next/cache";

export async function saveSettings(formData: FormData) {
  const companyName = (formData.get("companyName") as string) ?? "";
  const darkMode = formData.get("darkMode") === "on";
  const twoFactorAuth = formData.get("twoFactorAuth") === "on";
  const sessionTimeoutRaw = (formData.get("sessionTimeout") as string) ?? "0";
  const aiModel = (formData.get("aiModel") as string) ?? "";
  const emailNotifications = formData.get("emailNotifications") === "on";

  const sessionTimeout = Number.parseInt(sessionTimeoutRaw, 10);

  console.log("Saving settings to database:", {
    companyName,
    darkMode,
    twoFactorAuth,
    sessionTimeout: Number.isNaN(sessionTimeout) ? 0 : sessionTimeout,
    aiModel,
    emailNotifications,
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  revalidatePath("/settings");
}

