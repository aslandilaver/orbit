import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

/**
 * Launch form validation. These rules run in the browser for UX and again
 * immediately before a transaction is built (`assertLaunchParams`), so a
 * tampered form state cannot reach the wallet.
 */

const optionalUrl = (hosts?: string[], label?: string) =>
  z
    .string()
    .trim()
    .max(200)
    .refine(
      (v) => {
        if (!v) return true;
        try {
          const u = new URL(v);
          if (u.protocol !== "https:") return false;
          if (!hosts) return true;
          return hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
        } catch {
          return false;
        }
      },
      { message: hosts ? `Enter an https:// ${label} link` : "Enter a valid https:// URL" },
    );

export const DetailsSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(32, "32 characters max"),
  ticker: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(10, "10 characters max")
    .regex(/^[A-Z0-9]+$/, "Letters and numbers only"),
  description: z.string().trim().min(20, "Describe the project in at least 20 characters").max(500, "500 characters max"),
  website: optionalUrl(),
  x: optionalUrl(["x.com", "twitter.com"], "X"),
  telegram: optionalUrl(["t.me", "telegram.me"], "Telegram"),
  discord: optionalUrl(["discord.gg", "discord.com"], "Discord"),
});

export const EconomicsSchema = z
  .object({
    totalSupply: z
      .number({ message: "Enter a number" })
      .int("Whole tokens only")
      .min(1_000_000, "Minimum 1,000,000")
      .max(1_000_000_000_000, "Maximum 1,000,000,000,000"),
    curve: z.number().min(50, "At least 50% must be sold through the curve").max(100),
    creator: z.number().min(0).max(20, "Creator allocation is capped at 20%"),
    community: z.number().min(0).max(50),
    treasury: z.number().min(0).max(50),
    initialBuySol: z.number({ message: "Enter a number" }).min(0, "Cannot be negative").max(50, "Maximum 50 SOL"),
  })
  .refine((v) => Math.abs(v.curve + v.creator + v.community + v.treasury - 100) < 0.001, {
    message: "Allocations must add up to exactly 100%",
    path: ["allocations"],
  });

export const LAUNCH_TYPES = ["curve", "fixed"] as const;
export const LIQUIDITY_DESTINATIONS = ["meteora-damm-v2", "meteora-dlmm"] as const;

export const ConfigSchema = z.object({
  launchType: z.enum(LAUNCH_TYPES),
  curvePreset: z.enum(["standard", "gentle", "steep"]),
  graduationTargetSol: z.number({ message: "Enter a number" }).min(20, "Minimum 20 SOL").max(500, "Maximum 500 SOL"),
  liquidityDestination: z.enum(LIQUIDITY_DESTINATIONS),
  creatorWallet: z
    .string()
    .trim()
    .refine((v) => {
      try {
        new PublicKey(v);
        return v.length >= 32 && v.length <= 44;
      } catch {
        return false;
      }
    }, "Enter a valid Solana address"),
});

export type DetailsInput = z.infer<typeof DetailsSchema>;
export type EconomicsInput = z.infer<typeof EconomicsSchema>;
export type ConfigInput = z.infer<typeof ConfigSchema>;
export type LaunchParams = DetailsInput & EconomicsInput & ConfigInput;

export const LaunchParamsSchema = z.object({
  details: DetailsSchema,
  economics: EconomicsSchema,
  config: ConfigSchema,
});

/** Throws if anything is invalid. Called right before building a transaction. */
export function assertLaunchParams(p: { details: unknown; economics: unknown; config: unknown }): LaunchParams {
  const parsed = LaunchParamsSchema.parse(p);
  return { ...parsed.details, ...parsed.economics, ...parsed.config };
}

export function zodFieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const IMAGE_LIMITS = {
  logo: { maxBytes: 2 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp", "image/gif"] },
  banner: { maxBytes: 5 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp"] },
} as const;
