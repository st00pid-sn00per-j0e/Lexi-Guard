import { API_URL } from "./api";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_type: string;
  company_name?: string;
}

export interface AuthResponse {
  // Cookie-based auth: backend sets HttpOnly cookies.
  access_token?: string;
  token_type?: string;
  user: User;
}


export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  account_type: "individual" | "company";
  company_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Cookie-based auth: tokens are HttpOnly and cannot be read by JS.
// Keep exported helpers as no-ops/backward-compatible stubs for any existing imports.
export const TOKEN_KEY = "lexiguard_access_token";

export function getToken(): string | null {
  // Intentionally not readable (HttpOnly)
  return null;
}

export function setToken(_token: string): void {
  // Intentionally no-op (backend sets cookies)
}

export function removeToken(): void {
  // Intentionally no-op; logout endpoint clears cookies.
}

export function getStoredUser(): User | null {
  return null;
}

export function setStoredUser(_user: User): void {
  // Intentionally no-op.
}


export async function signup(data: SignupData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Signup failed");
  }
  return response.json();
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }
  return response.json();
}


export async function getCurrentUser(): Promise<User> {
  const { fetchJsonWithAuth } = await import("./api-client");
  return fetchJsonWithAuth<User>(`${API_URL}/auth/me`, { method: "GET" });
}


export function isAuthenticated(): boolean {
  return !!getToken();
}

