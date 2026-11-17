"use client";

import { ImagePlus, Info, Trash2 } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { IMAGE_LIMITS } from "@/lib/launch/schema";
import { cn } from "@/lib/utils";
import type { ImageAsset, LaunchFormApi } from "./use-launch-form";

function ImageDrop({
  kind,
  asset,
  onFile,
}: {
  kind: "logo" | "banner";
  asset: ImageAsset | null;
  onFile: (f: File | null) => string | null;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const limits = IMAGE_LIMITS[kind];

  function handle(file: File | null | undefined) {
    if (!file) return;
    setError(onFile(file));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    handle(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {kind === "logo" ? "Logo" : "Banner"}
          <span className="ml-1.5 font-normal text-fg-3">{kind === "logo" ? "Recommended" : "Optional"}</span>
        </label>
        <span className="text-xs text-fg-3">
          {kind === "logo" ? "Square, " : "3:1, "}up to {limits.maxBytes / 1024 / 1024}MB
        </span>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex items-center gap-4 overflow-hidden rounded-md border border-dashed bg-bg transition-colors",
          kind === "logo" ? "p-3" : "aspect-[3/1] max-h-36 justify-center",
          drag ? "border-accent/60 bg-accent-dim" : "border-line-3",
          error && "border-down/50",
        )}
      >
        {kind === "logo" ? (
          <>
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-line-2 bg-surface">
              {asset ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.url} alt="Logo preview" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-5 text-fg-3" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-xs">
              {asset ? (
                <>
                  <div className="truncate text-fg">{asset.name}</div>
                  <div className="text-fg-3">{(asset.size / 1024).toFixed(0)} KB</div>
                </>
              ) : (
                <div className="text-fg-2">Drop an image or browse. PNG, JPG, WEBP or GIF.</div>
              )}
            </div>
          </>
        ) : asset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt="Banner preview" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-xs text-fg-2">
            <ImagePlus className="size-5 text-fg-3" />
            Drop a banner image or browse
          </div>
        )}
        <div className={cn("flex gap-1.5", kind === "banner" && "absolute right-2 bottom-2")}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-7 rounded-sm border border-line-2 bg-surface px-2.5 text-xs text-fg hover:border-line-3"
          >
            {asset ? "Replace" : "Browse"}
          </button>
          {asset && (
            <button
              type="button"
              onClick={() => {
                onFile(null);
                setError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="grid size-7 place-items-center rounded-sm border border-line-2 bg-surface text-fg-2 hover:text-down"
              aria-label={`Remove ${kind}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={limits.types.join(",")}
          className="sr-only"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p className="text-xs text-down" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function StepDetails({ api, errors }: { api: LaunchFormApi; errors: Record<string, string> }) {
  const d = api.form.details;
  const set = (patch: Partial<typeof d>) => api.update("details", patch);
  const inv = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {});

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
        <Field label="Token name" htmlFor="name" error={errors.name} hint="Shown in wallets and explorers. 32 characters max.">
          <Input id="name" value={d.name} maxLength={32} placeholder="e.g. Northwind Radio" onChange={(e) => set({ name: e.target.value })} {...inv("name")} />
        </Field>
        <Field label="Ticker" htmlFor="ticker" error={errors.ticker} hint="2–10 letters or numbers">
          <Input
            id="ticker"
            value={d.ticker}
            maxLength={10}
            placeholder="NWR"
            className="font-mono uppercase"
            onChange={(e) => set({ ticker: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
            {...inv("ticker")}
          />
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor="description"
        error={errors.description}
        hint="What is this project, and who is it for? Be specific — holders read this first."
        aside={<span className="font-mono text-2xs text-fg-3 tabular">{d.description.length}/500</span>}
      >
        <Textarea
          id="description"
          value={d.description}
          maxLength={500}
          rows={4}
          onChange={(e) => set({ description: e.target.value })}
          {...inv("description")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-[1fr_1.6fr]">
        <ImageDrop kind="logo" asset={api.logo} onFile={(f) => api.setImage("logo", f)} />
        <ImageDrop kind="banner" asset={api.banner} onFile={(f) => api.setImage("banner", f)} />
      </div>
      <p className="-mt-3 flex gap-1.5 text-xs text-fg-3">
        <Info className="mt-px size-3.5 shrink-0" />
        Images are previewed in your browser only. No media storage is configured, so they are not uploaded or attached
        to on-chain metadata in this build.
      </p>

      <div className="border-t border-line pt-6">
        <div className="mb-4 text-[13px] font-medium text-fg">Links</div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website" htmlFor="website" optional error={errors.website}>
            <Input id="website" type="url" placeholder="https://" value={d.website} onChange={(e) => set({ website: e.target.value })} {...inv("website")} />
          </Field>
          <Field label="X / Twitter" htmlFor="x" optional error={errors.x}>
            <Input id="x" type="url" placeholder="https://x.com/…" value={d.x} onChange={(e) => set({ x: e.target.value })} {...inv("x")} />
          </Field>
          <Field label="Telegram" htmlFor="telegram" optional error={errors.telegram}>
            <Input id="telegram" type="url" placeholder="https://t.me/…" value={d.telegram} onChange={(e) => set({ telegram: e.target.value })} {...inv("telegram")} />
          </Field>
          <Field label="Discord" htmlFor="discord" optional error={errors.discord}>
            <Input id="discord" type="url" placeholder="https://discord.gg/…" value={d.discord} onChange={(e) => set({ discord: e.target.value })} {...inv("discord")} />
          </Field>
        </div>
      </div>
    </div>
  );
}
