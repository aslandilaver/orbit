import Image from "next/image";
import { cn } from "@/lib/utils";

/** ORBIT mark: ringed planet. Source: public/logo.png (transparent background). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      aria-hidden
      width={256}
      height={256}
      priority
      className={cn("size-9 shrink-0 object-contain", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-fg", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[0.14em]">ORBIT</span>
    </span>
  );
}
