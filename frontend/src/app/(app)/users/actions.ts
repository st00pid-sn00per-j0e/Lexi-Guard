"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";

export async function requireCompanyAccount() {
  const cookieStore = await cookies();

  // Backend sets this HttpOnly cookie name (see Backend/app/routes/auth.py)
  const accessToken = cookieStore.get("lexiguard_access_token")?.value;




  if (!accessToken) {
    console.error("🚫 No access token found in cookies.");
    redirect("/login");
  }

  // Fetch current authenticated user
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Cookie: `lexiguard_access_token=${accessToken}`,
    },
    credentials: "include",
  });



  if (!res.ok) {
    console.error("🚫 Backend fetch failed. Status:", res.status);
    redirect("/login");
  }

  const user = await res.json();

  if (user.account_type !== "company") {
    console.error("🚫 Access Denied: User account_type is", user.account_type);
    redirect("/dashboard");
  }

  return user;
}

export async function sendInvite(email: string, role: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("lexiguard_access_token")?.value;

  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/company/invite?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`, {
    method: "POST",
    headers: {
      Cookie: `lexiguard_access_token=${accessToken}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || "Failed to send invite");
  }

  return await res.json();
}

export async function getCompanyUsers() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("lexiguard_access_token")?.value;

  if (!accessToken) return [];

  const res = await fetch(`${API_URL}/company/users`, {
    headers: {
      Cookie: `lexiguard_access_token=${accessToken}`,
    },
    credentials: "include",
  });

  if (!res.ok) return [];

  return await res.json();
}


