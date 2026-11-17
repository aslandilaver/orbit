import type { Metadata } from "next";
import { LaunchWizard } from "@/components/launch/launch-wizard";

export const metadata: Metadata = { title: "Launch a token" };

export default function LaunchPage() {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <div className="mb-10 max-w-2xl border-b border-line pb-8">
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-fg sm:text-[28px]">Launch a token</h1>
        <p className="mt-2 text-sm text-fg-2">
          Five steps. Every parameter is validated, every cost is shown before you sign, and nothing is submitted
          without your approval in your wallet.
        </p>
      </div>
      <LaunchWizard />
    </div>
  );
}
