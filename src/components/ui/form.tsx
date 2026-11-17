import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-10 w-full rounded-md border border-line-2 bg-bg px-3 text-[14px] text-fg placeholder:text-fg-3 transition-colors outline-none hover:border-line-3 focus:border-accent/60 focus:ring-2 focus:ring-accent/15 aria-invalid:border-down/60 disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "h-auto min-h-24 resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
  aside,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg">
          {label}
          {optional && <span className="ml-1.5 font-normal text-fg-3">Optional</span>}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-down" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-fg-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Input with a fixed suffix (unit) inside the border. */
export function AffixInput({
  suffix,
  prefix,
  className,
  ...props
}: ComponentProps<"input"> & { suffix?: ReactNode; prefix?: ReactNode }) {
  return (
    <div className={cn("relative", className)}>
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-3 [&_svg]:size-4">
          {prefix}
        </span>
      )}
      <input className={cn(inputClass, "font-mono tabular", prefix && "pl-9", suffix && "pr-14")} {...props} />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-fg-3">
          {suffix}
        </span>
      )}
    </div>
  );
}
