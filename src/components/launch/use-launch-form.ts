"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CURVE_PRESETS, quoteBuy, type CurvePresetId } from "@/lib/curve";
import {
  ConfigSchema,
  DetailsSchema,
  EconomicsSchema,
  IMAGE_LIMITS,
  zodFieldErrors,
  type LaunchParams,
} from "@/lib/launch/schema";

export interface ImageAsset {
  name: string;
  size: number;
  url: string;
}

export interface FormState {
  details: { name: string; ticker: string; description: string; website: string; x: string; telegram: string; discord: string };
  economics: { totalSupply: string; curve: string; creator: string; community: string; treasury: string; initialBuySol: string };
  config: {
    launchType: "curve" | "fixed";
    curvePreset: CurvePresetId;
    graduationTargetSol: string;
    liquidityDestination: "meteora-damm-v2" | "meteora-dlmm";
    creatorWallet: string;
  };
}

export const INITIAL: FormState = {
  details: { name: "", ticker: "", description: "", website: "", x: "", telegram: "", discord: "" },
  economics: { totalSupply: "1000000000", curve: "80", creator: "5", community: "10", treasury: "5", initialBuySol: "0" },
  config: {
    launchType: "fixed",
    curvePreset: "standard",
    graduationTargetSol: "85",
    liquidityDestination: "meteora-damm-v2",
    creatorWallet: "",
  },
};

const DRAFT_KEY = "orbit:launch-draft:v1";
const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

export function toEconomics(e: FormState["economics"]) {
  return {
    totalSupply: num(e.totalSupply),
    curve: num(e.curve),
    creator: num(e.creator),
    community: num(e.community),
    treasury: num(e.treasury),
    initialBuySol: num(e.initialBuySol || "0"),
  };
}

export function toConfig(c: FormState["config"]) {
  return { ...c, graduationTargetSol: num(c.graduationTargetSol) };
}

export function validateStep(step: number, f: FormState): Record<string, string> {
  const schema = step === 0 ? DetailsSchema : step === 1 ? EconomicsSchema : step === 2 ? ConfigSchema : null;
  if (!schema) return {};
  const input = step === 0 ? f.details : step === 1 ? toEconomics(f.economics) : toConfig(f.config);
  const r = schema.safeParse(input);
  return r.success ? {} : zodFieldErrors(r.error);
}

export function toParams(f: FormState): { details: unknown; economics: unknown; config: unknown } {
  return { details: f.details, economics: toEconomics(f.economics), config: toConfig(f.config) };
}

/** Tokens the creator would receive for the initial buy on the selected curve. */
export function initialBuyPreview(f: FormState) {
  const e = toEconomics(f.economics);
  const target = num(f.config.graduationTargetSol);
  if (!(e.initialBuySol > 0) || !(e.totalSupply > 0) || !(target > 0) || !(e.curve > 0)) return null;
  const preset = CURVE_PRESETS[f.config.curvePreset];
  const q = quoteBuy(
    {
      virtualSol: preset.virtualSol,
      curveTokens: (e.totalSupply * e.curve) / 100,
      totalSupply: e.totalSupply,
      targetSol: target,
      feeBps: 100,
      raisedSol: 0,
    },
    e.initialBuySol,
    0,
  );
  return q ? { tokens: q.outputAmount, pctOfSupply: (q.outputAmount / e.totalSupply) * 100, quote: q } : null;
}

export function useLaunchForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [logo, setLogo] = useState<ImageAsset | null>(null);
  const [banner, setBanner] = useState<ImageAsset | null>(null);
  const [restored, setRestored] = useState(false);
  const loaded = useRef(false);

  // Restore a text-only draft. Images are never persisted.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Partial<FormState>;
        if (d.details && d.economics && d.config) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restore from localStorage after hydration to avoid SSR mismatch
          setForm({
            details: { ...INITIAL.details, ...d.details },
            economics: { ...INITIAL.economics, ...d.economics },
            config: { ...INITIAL.config, ...d.config },
          });
          setRestored(true);
        }
      }
    } catch {
      /* storage unavailable */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {
        /* storage unavailable */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [form]);

  // Release object URLs.
  useEffect(() => () => void (logo && URL.revokeObjectURL(logo.url)), [logo]);
  useEffect(() => () => void (banner && URL.revokeObjectURL(banner.url)), [banner]);

  const update = useCallback(
    <S extends keyof FormState>(section: S, patch: Partial<FormState[S]>) =>
      setForm((f) => ({ ...f, [section]: { ...f[section], ...patch } })),
    [],
  );

  const reset = useCallback(() => {
    setForm(INITIAL);
    setLogo(null);
    setBanner(null);
    setRestored(false);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setImage = useCallback((kind: "logo" | "banner", file: File | null): string | null => {
    const setter = kind === "logo" ? setLogo : setBanner;
    if (!file) {
      setter(null);
      return null;
    }
    const limits = IMAGE_LIMITS[kind];
    if (!(limits.types as readonly string[]).includes(file.type)) return `Use ${limits.types.map((t) => t.split("/")[1]).join(", ").toUpperCase()}`;
    if (file.size > limits.maxBytes) return `Maximum ${limits.maxBytes / 1024 / 1024}MB`;
    setter({ name: file.name, size: file.size, url: URL.createObjectURL(file) });
    return null;
  }, []);

  return { form, update, reset, logo, banner, setImage, restored };
}

export type LaunchFormApi = ReturnType<typeof useLaunchForm>;
export type { LaunchParams };
