import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURED, SUPABASE_URL } from "@/config/public-env";

/**
 * Browser/server-safe Supabase client using the public anon key. Data access
 * is governed by Row Level Security (see supabase/schema.sql). Returns null
 * when not configured so callers fall back to demo data — and label it.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED) return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  return client;
}
