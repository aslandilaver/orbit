import Link from "next/link";
import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-2",
  secondary: "bg-surface-2 text-fg border border-line-2 hover:bg-surface-3 hover:border-line-3",
  outline: "border border-line-2 text-fg hover:bg-surface hover:border-line-3",
  ghost: "text-fg-2 hover:text-fg hover:bg-surface",
  danger: "bg-down-dim text-down border border-down/25 hover:bg-down/15",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-sm [&_svg]:size-3.5",
  md: "h-9 px-3.5 text-[13px] rounded-md [&_svg]:size-4",
  lg: "h-11 px-5 text-sm rounded-md [&_svg]:size-4",
  icon: "size-9 rounded-md [&_svg]:size-4",
  "icon-sm": "size-7 rounded-sm [&_svg]:size-3.5",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
