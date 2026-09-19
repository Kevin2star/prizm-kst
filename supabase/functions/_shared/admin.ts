import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function num(value: unknown): number {
  return Number(value);
}

export function requireText(value: unknown, error: string, message: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    const err = new Error(message) as Error & { code?: string; status?: number };
    err.code = error;
    err.status = 400;
    throw err;
  }
  return value.trim();
}

export function parseJsonArray<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
