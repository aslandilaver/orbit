"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, ArrowUpRight, Check, CircleX, LoaderCircle, Rocket, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useWalletModal } from "@/components/providers/solana-provider";
import { CLUSTER, CLUSTER_LABEL } from "@/config/public-env";
import { launchAdapters } from "@/lib/adapters";
import type { LaunchResult } from "@/lib/adapters/types";
import { assertLaunchParams } from "@/lib/launch/schema";
import { classifyError, type ClassifiedError } from "@/lib/solana/errors";
import { explorerUrl } from "@/lib/solana/explorer";
import type { TxPhase } from "@/lib/solana/send";
import { cn, fmt } from "@/lib/utils";
import { toParams, type LaunchFormApi } from "./use-launch-form";

const PHASES: { id: TxPhase; label: string; detail: string }[] = [
  { id: "building", label: "Build transaction", detail: "Fetch blockhash, simulate" },
  { id: "awaiting_signature", label: "Approve in wallet", detail: "Review the request in your wallet" },
  { id: "submitted", label: "Submitted", detail: "Sent to the network" },
  { id: "confirming", label: "Confirming", detail: "Waiting for confirmed commitment" },
  { id: "confirmed", label: "Confirmed on-chain", detail: "Transaction succeeded" },
];

import { LAUNCHES_KEY } from "@/lib/launch/storage";

type RunState =
  | { status: "idle" }
  | { status: "running"; phase: TxPhase; signature?: string }
  | { status: "success"; result: LaunchResult }
  | { status: "error"; error: ClassifiedError; phase: TxPhase; signature?: string };

export function StepLaunch({ api, onSwitchToFixed }: { api: LaunchFormApi; onSwitchToFixed: () => void }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setOpen } = useWalletModal();
  const [ack, setAck] = useState(false);
  const [run, setRun] = useState<RunState>({ status: "idle" });

  const type = api.form.config.launchType;
  const adapter = launchAdapters[type];
  const avail = adapter.availability();

  async function launch() {
    let params;
    try {
      // Re-validate immediately before building: never trust UI state alone.
      params = assertLaunchParams(toParams(api.form));
    } catch {
      setRun({ status: "error", phase: "building", error: { kind: "unknown", message: "Launch parameters are invalid. Go back and review them." } });
      return;
    }
    let lastPhase: TxPhase = "building";
    let lastSig: string | undefined;
    setRun({ status: "running", phase: "building" });
    try {
      const result = await adapter.launch({
        connection,
        wallet,
        params,
        onPhase: (phase, sig) => {
          lastPhase = phase;
          if (sig) lastSig = sig;
          setRun({ status: "running", phase, signature: sig ?? lastSig });
        },
      });
      setRun({ status: "success", result });
      try {
        const prev = JSON.parse(localStorage.getItem(LAUNCHES_KEY) || "[]") as unknown[];
        localStorage.setItem(
          LAUNCHES_KEY,
          JSON.stringify([{ ...result, name: params.name, ticker: params.ticker, cluster: CLUSTER, at: Date.now() }, ...prev].slice(0, 20)),
        );
      } catch {
        /* storage unavailable — launch still succeeded on-chain */
      }
    } catch (e) {
      setRun({ status: "error", error: classifyError(e), phase: lastPhase, signature: lastSig });
    }
  }

  /* ─── Adapter not available: explain, don't pretend ───────────── */
  if (!avail.available) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-warn/25 bg-warn-dim p-4">
          <div className="flex items-center gap-2 text-[13px] font-medium text-warn">
            <Wrench className="size-4" />
            {adapter.label} launches are not available on this deployment
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-warn/90">{avail.reason} No transaction will be created.</p>
        </div>
        {avail.requirements && (
          <div className="rounded-md border border-line bg-bg p-4">
            <div className="text-[13px] font-medium text-fg">What an operator needs to do</div>
            <ol className="mt-3 flex flex-col gap-2">
              {avail.requirements.map((r, i) => (
                <li key={r} className="flex gap-3 text-[13px] text-fg-2">
                  <span className="font-mono text-xs text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                  {r}
                </li>
              ))}
            </ol>
            <Link href="/docs#integrations" className="mt-4 inline-flex items-center gap-1 text-xs text-fg hover:underline">
              Integration guide <ArrowUpRight className="size-3" />
            </Link>
          </div>
        )}
        {type === "curve" && launchAdapters.fixed.availability().available && (
          <div className="flex flex-col gap-3 rounded-md border border-line bg-bg-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[13px] font-medium text-fg">Launch as a fixed-supply mint instead</div>
              <p className="mt-0.5 text-xs text-fg-2">Creates the token on {CLUSTER_LABEL[CLUSTER]} now. You can review the change first.</p>
            </div>
            <Button onClick={onSwitchToFixed}>
              Switch and review <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    );
  }

  /* ─── Success ───────────────────────────────────────────────── */
  if (run.status === "success") {
    const { mint, signature, slot } = run.result;
    return (
      <div className="rounded-md border border-up/25 bg-up-dim/50 p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-up-dim text-up">
            <Check className="size-4" />
          </span>
          <div>
            <div className="text-[15px] font-medium text-fg">
              {api.form.details.name} is live on {CLUSTER_LABEL[CLUSTER]}
            </div>
            <div className="text-xs text-fg-2">Confirmed at slot {fmt.int(slot)}</div>
          </div>
        </div>
        <dl className="mt-5 flex flex-col gap-3 text-[13px]">
          <div>
            <dt className="text-xs text-fg-3">Mint address</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-mono break-all text-fg">
              {mint}
              <CopyButton value={mint} label="Copy mint address" />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-3">Transaction signature</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-mono break-all text-fg-2">
              {fmt.address(signature, 10)}
              <CopyButton value={signature} label="Copy signature" />
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/token/${mint}`} className={buttonClass("primary", "md")}>
            View token page <ArrowRight />
          </Link>
          <a href={explorerUrl("tx", signature)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
            View transaction <ArrowUpRight />
          </a>
        </div>
        <p className="mt-5 text-xs text-fg-3">
          Indexing: ORBIT lists the token on its page by reading the chain directly. It will appear in Explore once an
          indexer is connected.
        </p>
      </div>
    );
  }

  const running = run.status === "running";
  const currentIdx = run.status === "running" || run.status === "error" ? PHASES.findIndex((p) => p.id === run.phase) : -1;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-line bg-bg p-4">
        <div className="text-[13px] font-medium text-fg">What will happen</div>
        <ol className="mt-3 flex flex-col gap-2 text-[13px] text-fg-2">
          <li>1. A new Token-2022 mint is created with name “{api.form.details.name}” and symbol “{api.form.details.ticker}”.</li>
          <li>2. {fmt.int(Number(api.form.economics.totalSupply))} tokens are minted to {fmt.address(api.form.config.creatorWallet, 5)}.</li>
          <li>3. Mint authority is revoked permanently. No freeze authority is set.</li>
        </ol>
        <p className="mt-3 text-xs text-fg-3">All three happen in one transaction: either everything succeeds, or nothing changes.</p>
      </div>

      {(running || run.status === "error") && (
        <ol className="rounded-md border border-line bg-bg-2 p-4" aria-live="polite">
          {PHASES.map((p, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            const failed = run.status === "error" && active;
            return (
              <li key={p.id} className="flex items-start gap-3 py-1.5">
                <span
                  className={cn(
                    "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                    done ? "bg-up-dim text-up" : failed ? "bg-down-dim text-down" : active ? "text-accent" : "text-fg-3",
                  )}
                >
                  {done ? (
                    <Check className="size-3" />
                  ) : failed ? (
                    <CircleX className="size-3.5" />
                  ) : active ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-fg-3" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className={cn("text-[13px]", active || done ? "text-fg" : "text-fg-3")}>{p.label}</div>
                  <div className="text-xs text-fg-3">{p.detail}</div>
                </div>
              </li>
            );
          })}
          {(run.status === "running" || run.status === "error") && run.signature && (
            <li className="mt-2 border-t border-line pt-3 text-xs text-fg-2">
              Signature{" "}
              <a href={explorerUrl("tx", run.signature)} target="_blank" rel="noopener noreferrer" className="font-mono text-fg hover:underline">
                {fmt.address(run.signature, 8)}
              </a>
            </li>
          )}
        </ol>
      )}

      {run.status === "error" && (
        <div role="alert" className="rounded-md border border-down/25 bg-down-dim p-3.5 text-[13px] text-down">
          <div className="font-medium">
            {run.error.kind === "rejected" ? "Request declined" : run.signature ? "Transaction not confirmed" : "Launch failed"}
          </div>
          <p className="mt-1 text-xs break-words text-down/90">{run.error.message}</p>
          {run.signature && run.error.kind !== "rejected" && (
            <p className="mt-1 text-xs text-down/90">
              Check the signature in the explorer before retrying — do not assume it failed until the explorer confirms it.
            </p>
          )}
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-bg p-3.5 text-[13px] text-fg-2">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          disabled={running}
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
        />
        I understand this creates a real token on Solana {CLUSTER_LABEL[CLUSTER]}, that the supply is permanently fixed,
        and that this cannot be undone.
      </label>

      {!wallet.connected ? (
        <Button variant="primary" size="lg" onClick={() => setOpen(true)}>
          Connect Wallet to Launch
        </Button>
      ) : (
        <Button variant="primary" size="lg" onClick={launch} disabled={!ack} loading={running}>
          {running ? (run.phase === "awaiting_signature" ? "Waiting for approval…" : "Launching…") : run.status === "error" ? "Try again" : (
            <>
              <Rocket /> Launch on {CLUSTER_LABEL[CLUSTER]}
            </>
          )}
        </Button>
      )}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-fg-3">
        <ShieldCheck className="size-3.5" />
        Your wallet shows the full transaction. ORBIT never signs on your behalf.
      </p>
    </div>
  );
}
