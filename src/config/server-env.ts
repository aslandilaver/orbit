import "server-only";
import { z } from "zod";

/**
 * Server-only configuration. Importing this from a client component fails the
 * build (via `server-only`), which keeps secrets out of the browser bundle.
 */
const ServerEnv = z.object({
  HELIUS_API_KEY: z.string().min(1).optional(),
  METEORA_DBC_CONFIG: z.string().min(32).max(44).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const parsed = ServerEnv.safeParse({
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || undefined,
  METEORA_DBC_CONFIG: process.env.METEORA_DBC_CONFIG || undefined,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
});

export const serverEnv: z.infer<typeof ServerEnv> = parsed.success ? parsed.data : {};

/** Booleans only — safe to hand to client components. Never return the values. */
export function getServerIntegrationFlags() {
  return {
    helius: Boolean(serverEnv.HELIUS_API_KEY),
    meteora: Boolean(serverEnv.METEORA_DBC_CONFIG),
    supabaseService: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
  };
}
