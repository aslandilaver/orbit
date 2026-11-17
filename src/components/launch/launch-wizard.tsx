"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CLUSTER, CLUSTER_LABEL } from "@/config/public-env";
import { cn } from "@/lib/utils";
import { StepConfig } from "./step-config";
import { StepDetails } from "./step-details";
import { StepEconomics } from "./step-economics";
import { StepLaunch } from "./step-launch";
import { StepReview } from "./step-review";
import { useLaunchForm, validateStep } from "./use-launch-form";

const STEPS = [
  { title: "Token details", description: "Name, ticker, story and links" },
  { title: "Token economics", description: "Supply and allocation" },
  { title: "Launch configuration", description: "Launch type, curve and graduation" },
  { title: "Review", description: "Costs and requirements" },
  { title: "Launch", description: "Approve in your wallet" },
];

export function LaunchWizard() {
  const api = useLaunchForm();
  const { publicKey } = useWallet();
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  // Errors appear after the first failed attempt on a step, then update live as the user types.
  const [showErrors, setShowErrors] = useState(false);
  const errors = showErrors ? validateStep(step, api.form) : {};
  const setErrors = (e: Record<string, string>) => setShowErrors(Object.keys(e).length > 0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Default the creator wallet to the connected wallet when empty.
  const { update } = api;
  const creatorWallet = api.form.config.creatorWallet;
  useEffect(() => {
    if (publicKey && !creatorWallet) update("config", { creatorWallet: publicKey.toBase58() });
  }, [publicKey, creatorWallet, update]);

  function goTo(target: number) {
    // Moving forward requires every step in between to be valid.
    for (let s = 0; s < Math.min(target, 3); s++) {
      const errs = validateStep(s, api.form);
      if (Object.keys(errs).length) {
        setStep(s);
        setErrors(errs);
        headingRef.current?.focus();
        return;
      }
    }
    setErrors({});
    setStep(target);
    setMaxReached((m) => Math.max(m, target));
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  const current = STEPS[step]!;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
      {/* Stepper */}
      <nav aria-label="Launch steps" className="lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-center justify-between lg:hidden">
          <span className="font-mono text-xs text-fg-3">
            Step {step + 1} of {STEPS.length}
          </span>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span key={i} className={cn("h-1 w-6 rounded-full", i <= step ? "bg-accent" : "bg-surface-3")} />
            ))}
          </div>
        </div>
        <ol className="hidden flex-col lg:flex">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const reachable = i <= maxReached;
            return (
              <li key={s.title} className="relative pb-6 last:pb-0">
                {i < STEPS.length - 1 && (
                  <span className={cn("absolute top-7 bottom-1 left-[11px] w-px", done ? "bg-accent/50" : "bg-line-2")} aria-hidden />
                )}
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goTo(i)}
                  aria-current={active ? "step" : undefined}
                  className="flex w-full items-start gap-3 text-left disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border font-mono text-2xs",
                      done
                        ? "border-accent/60 bg-accent-dim text-accent"
                        : active
                          ? "border-fg bg-fg text-bg"
                          : "border-line-3 text-fg-3",
                    )}
                  >
                    {done ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span className="pt-0.5">
                    <span className={cn("block text-[13px]", active ? "text-fg" : reachable ? "text-fg-2" : "text-fg-3")}>{s.title}</span>
                    <span className="block text-xs text-fg-3">{s.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-8 hidden border-t border-line pt-5 text-xs text-fg-3 lg:block">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-warn" /> Solana {CLUSTER_LABEL[CLUSTER]}
          </div>
          {api.restored && <p className="mt-3">Draft restored from this browser.</p>}
          <button type="button" onClick={() => { api.reset(); setStep(0); setMaxReached(0); setErrors({}); }} className="mt-3 inline-flex items-center gap-1.5 hover:text-fg">
            <RotateCcw className="size-3" /> Start over
          </button>
        </div>
      </nav>

      {/* Step body */}
      <div className="min-w-0">
        <div className="mb-6">
          <div className="eyebrow">Step {String(step + 1).padStart(2, "0")}</div>
          <h2 ref={headingRef} tabIndex={-1} className="mt-2 text-xl font-medium tracking-[-0.015em] text-fg outline-none">
            {current.title}
          </h2>
          <p className="mt-1 text-sm text-fg-2">{current.description}</p>
        </div>

        {Object.keys(errors).length > 0 && (
          <div role="alert" className="mb-5 rounded-md border border-down/25 bg-down-dim px-3.5 py-2.5 text-[13px] text-down">
            Fix {Object.keys(errors).length === 1 ? "the highlighted field" : `${Object.keys(errors).length} highlighted fields`} to continue.
          </div>
        )}

        {step === 0 && <StepDetails api={api} errors={errors} />}
        {step === 1 && <StepEconomics api={api} errors={errors} />}
        {step === 2 && <StepConfig api={api} errors={errors} />}
        {step === 3 && <StepReview api={api} goTo={goTo} />}
        {step === 4 && (
          <StepLaunch
            api={api}
            onSwitchToFixed={() => {
              api.update("config", { launchType: "fixed" });
              goTo(3);
            }}
          />
        )}

        <div className="mt-10 flex items-center justify-between border-t border-line pt-5">
          <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0}>
            <ArrowLeft /> Back
          </Button>
          {step < 4 && (
            <Button variant="primary" onClick={() => goTo(step + 1)}>
              {step === 3 ? "Continue to launch" : "Continue"} <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
