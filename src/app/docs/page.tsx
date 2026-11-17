import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CLUSTER, CLUSTER_LABEL, RPC_IS_PUBLIC_DEFAULT, SUPABASE_CONFIGURED } from "@/config/public-env";
import { getServerIntegrationFlags } from "@/config/server-env";
import { launchAdapters, meteoraGraduationAdapter } from "@/lib/adapters";
import { CURVE_PRESETS } from "@/lib/curve";
import { DEMO_PARAMS } from "@/lib/data/demo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Docs" };
// Integration status reads server env at request time.
export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "launching", label: "Launching a token" },
  { id: "bonding-curve", label: "Bonding curve" },
  { id: "graduation", label: "Graduation" },
  { id: "fees", label: "Fees" },
  { id: "security", label: "Wallet security" },
  { id: "integrations", label: "Integration status" },
  { id: "governance", label: "Governance" },
  { id: "configuration", label: "Configuration" },
  { id: "risk", label: "Risk disclosure" },
];

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 border-t border-line pt-10 text-xl font-medium tracking-[-0.015em] text-fg first:border-0 first:pt-0">
      {children}
    </h2>
  );
}
function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[14px] leading-[1.7] text-fg-2">{children}</p>;
}
function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-xs border border-line-2 bg-surface px-1 py-px font-mono text-[12.5px] text-fg">{children}</code>;
}
function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-fg-2">
          <span className="mt-[9px] size-1 shrink-0 rounded-full bg-fg-3" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
function Status({ ok, label }: { ok: boolean | "partial"; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-2xs uppercase",
        ok === true ? "text-up" : ok === "partial" ? "text-warn" : "text-fg-3",
      )}
    >
      <span className={cn("size-1.5 rounded-full", ok === true ? "bg-up" : ok === "partial" ? "bg-warn" : "bg-fg-3")} />
      {label ?? (ok === true ? "Live" : ok === "partial" ? "Partial" : "Not configured")}
    </span>
  );
}

export default function DocsPage() {
  const server = getServerIntegrationFlags();
  const fixed = launchAdapters.fixed.availability();
  const curve = launchAdapters.curve.availability();
  const grad = meteoraGraduationAdapter.availability();

  const integrations: { name: string; scope: string; status: boolean | "partial"; note: string }[] = [
    {
      name: "Solana Wallet Adapter",
      scope: "Wallet connection",
      status: true,
      note: "Wallet Standard discovery: Phantom, Solflare, Backpack and other compatible wallets.",
    },
    {
      name: "Solana RPC",
      scope: "Balances, holdings, history, mint inspection",
      status: RPC_IS_PUBLIC_DEFAULT ? "partial" : true,
      note: RPC_IS_PUBLIC_DEFAULT
        ? `Using the public ${CLUSTER_LABEL[CLUSTER]} endpoint (rate limited). Set NEXT_PUBLIC_SOLANA_RPC_URL.`
        : "Custom RPC endpoint configured.",
    },
    {
      name: "Fixed-supply launch (Token-2022)",
      scope: "Token creation",
      status: fixed.available,
      note: fixed.available ? "Creates mint + metadata, mints supply, revokes mint authority." : fixed.reason ?? "",
    },
    { name: "Meteora Dynamic Bonding Curve", scope: "Curve launches and trading", status: curve.available, note: curve.reason ?? "" },
    { name: "Meteora migration", scope: "Graduation", status: grad.available, note: grad.reason ?? "" },
    {
      name: "Jupiter",
      scope: "Swaps for graduated tokens",
      status: CLUSTER === "mainnet-beta" ? "partial" : false,
      note: "Quote and swap client implemented; mainnet only. Disabled on test clusters.",
    },
    {
      name: "Helius",
      scope: "Indexing (DAS, enhanced transactions)",
      status: server.helius ? "partial" : false,
      note: server.helius ? "API key present. Indexer jobs are not yet implemented." : "HELIUS_API_KEY not set.",
    },
    {
      name: "Supabase",
      scope: "Communities, updates",
      status: SUPABASE_CONFIGURED ? "partial" : false,
      note: SUPABASE_CONFIGURED ? "Client configured. Schema in supabase/schema.sql." : "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY not set.",
    },
  ];

  return (
    <div className="container-page pt-10 sm:pt-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Documentation" className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="eyebrow mb-3 hidden lg:block">Documentation</div>
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:px-0">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  className="block rounded-sm border border-line-2 px-2.5 py-1.5 text-[13px] text-fg-2 hover:text-fg lg:border-0 lg:px-2 lg:py-1"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-[720px] min-w-0 pb-10">
          <h1 className="text-[28px] font-medium tracking-[-0.02em] text-fg">ORBIT protocol</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-fg-2">
            How launches, bonding curves and graduation work — and exactly which parts of this deployment are live.
          </p>

          <div className="mt-10 flex flex-col gap-0">
            <H2 id="overview">Overview</H2>
            <P>
              ORBIT is a community launchpad for Solana tokens, from memecoins to utility projects. A token moves through
              four public stages: <strong className="font-medium text-fg">New launch → Bonding curve → Graduation ready → Graduated</strong>.
              Every stage is defined by on-chain state and parameters fixed at launch, not by editorial decisions.
            </P>
            <P>
              Wherever ORBIT shows sample data, it carries a <Code>Demo data</Code> label. On-chain reads carry an{" "}
              <Code>On-chain</Code> label.
            </P>

            <H2 id="launching">Launching a token</H2>
            <List
              items={[
                <>
                  <strong className="font-medium text-fg">Details</strong> — name (≤32 chars), ticker (2–10 alphanumerics),
                  description, images and https links. X, Telegram and Discord links are checked against their domains.
                </>,
                <>
                  <strong className="font-medium text-fg">Economics</strong> — fixed supply (1M–1T, 6 decimals). Allocations must
                  sum to exactly 100%; at least 50% goes to the curve, and the creator share is capped at 20%.
                </>,
                <>
                  <strong className="font-medium text-fg">Configuration</strong> — launch type, curve shape, graduation threshold
                  (20–500 SOL), liquidity destination and creator wallet.
                </>,
                <>
                  <strong className="font-medium text-fg">Review</strong> — rent is read from the RPC, total cost and wallet
                  balance are checked, and warnings are listed.
                </>,
                <>
                  <strong className="font-medium text-fg">Launch</strong> — parameters are re-validated, the transaction is
                  simulated, and only then does your wallet ask for approval. Success is reported only after the signature is
                  confirmed on-chain.
                </>,
              ]}
            />
            <P>
              A fixed-supply launch runs one atomic transaction: create the Token-2022 mint with the MetadataPointer extension,
              write name and symbol on-chain, mint the full supply to the creator wallet, and revoke the mint authority. No
              freeze authority is ever set.
            </P>

            <H2 id="bonding-curve">Bonding curve</H2>
            <P>Curve pricing is constant-product with a virtual SOL reserve <Code>V₀</Code>:</P>
            <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-bg-2 p-4 font-mono text-[12.5px] leading-relaxed text-fg">
{`k        = V₀ · T₀
price    = (V₀ + raised) / T
tokens   = T − k / (V₀ + raised + sol_in)
T₀       = curve_tokens · (V₀ + target) / target`}
            </pre>
            <P>
              <Code>T₀</Code> is chosen so the curve sells exactly its allocation when the graduation target is reached. Presets
              change <Code>V₀</Code>:
            </P>
            <div className="mt-4 overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[460px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-fg-3">
                    <th className="px-4 py-2 font-normal">Preset</th>
                    <th className="px-4 py-2 font-normal">V₀</th>
                    <th className="px-4 py-2 font-normal">Character</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(CURVE_PRESETS).map((p) => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-fg">{p.label}</td>
                      <td className="px-4 py-2.5 font-mono text-fg-2">{p.virtualSol} SOL</td>
                      <td className="px-4 py-2.5 text-fg-2">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <P>
              The trade panel computes quotes, price impact and minimum output locally with this math. Execution requires the
              on-chain program; see Integration status.
            </P>

            <H2 id="graduation">Graduation</H2>
            <P>
              The creator sets the graduation threshold before launch, and it is shown on the token page. When the curve has
              raised that much SOL it stops accepting buys, and its liquidity is meant to migrate to a Meteora pool
              (DAMM v2 or DLMM) chosen at launch. A token is &ldquo;Graduation ready&rdquo; from 80% of its target.
            </P>
            <P>
              Migration is performed by the Meteora program and its migration keeper — not by this frontend. ORBIT reads
              graduation through a <Code>GraduationAdapter</Code>. Until that adapter is configured, ORBIT does not claim that
              any migration happened. Demo tokens use a {DEMO_PARAMS.graduationTargetSol} SOL demo threshold.
            </P>

            <H2 id="fees">Fees</H2>
            <List
              items={[
                "Fixed-supply launches: Solana rent for the mint and token account, plus network fees. ORBIT charges nothing.",
                `Bonding-curve trades: a fee taken on the SOL side. Demo tokens model ${DEMO_PARAMS.tradeFeeBps / 100}%; the real rate comes from the Meteora pool config.`,
                "Graduated tokens: the destination pool's fee, plus any router fee shown in the quote.",
              ]}
            />

            <H2 id="security">Wallet security</H2>
            <List
              items={[
                "ORBIT never asks for a seed phrase or private key, in any form. Anyone who does is attempting theft.",
                "Every transaction is built in your browser, simulated, and shown in your wallet. Nothing is signed automatically.",
                "The only key ORBIT generates is a one-time keypair for a new mint's address, which must co-sign its own creation. It controls nothing afterwards and is never stored.",
                "Success is shown only after the signature reaches confirmed commitment without error. Signatures link to Solana Explorer.",
                "Mainnet is disabled unless NEXT_PUBLIC_ENABLE_MAINNET=true is set explicitly.",
              ]}
            />

            <H2 id="integrations">Integration status</H2>
            <P>Live status of this deployment, on Solana {CLUSTER_LABEL[CLUSTER]}.</P>
            <div className="mt-4 overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-fg-3">
                    <th className="px-4 py-2 font-normal">Integration</th>
                    <th className="px-4 py-2 font-normal">Status</th>
                    <th className="px-4 py-2 font-normal">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {integrations.map((i) => (
                    <tr key={i.name} className="border-b border-line align-top last:border-0">
                      <td className="px-4 py-3">
                        <div className="text-fg">{i.name}</div>
                        <div className="text-xs text-fg-3">{i.scope}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Status ok={i.status} />
                      </td>
                      <td className="px-4 py-3 text-xs leading-relaxed text-fg-2">{i.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <P>
              To enable bonding-curve launches: pin <Code>@meteora-ag/dynamic-bonding-curve-sdk</Code>, create a pool config on
              devnet, set <Code>METEORA_DBC_CONFIG</Code>, and implement <Code>src/lib/adapters/meteora.ts</Code> against the{" "}
              <Code>LaunchAdapter</Code>, <Code>TradeAdapter</Code> and <Code>GraduationAdapter</Code> interfaces. No UI changes
              are needed.
            </P>

            <H2 id="governance">Governance</H2>
            <P>
              Community governance is designed but not live. Proposals will be created on-chain and tallies will be computed from
              token balances at a snapshot slot; ORBIT will only display results it can read from the chain. No proposal, vote
              or result shown on ORBIT today is real, because none are shown.
            </P>

            <H2 id="configuration">Configuration</H2>
            <P>
              Public variables (prefixed <Code>NEXT_PUBLIC_</Code>) are bundled into the browser and must never contain secrets.
              Server-only variables are read in server code guarded by <Code>server-only</Code>.
            </P>
            <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-bg-2 p-4 font-mono text-[12.5px] leading-relaxed text-fg-2">
{`NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=
NEXT_PUBLIC_ENABLE_MAINNET=false
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# server only
HELIUS_API_KEY=
METEORA_DBC_CONFIG=
SUPABASE_SERVICE_ROLE_KEY=`}
            </pre>

            <H2 id="risk">Risk disclosure</H2>
            <P>
              Anyone can launch a token on ORBIT. A listing is not an endorsement, audit or recommendation, and ORBIT does not
              verify the claims projects make about themselves. Automated risk checks look for known patterns — active mint or
              freeze authority, concentrated holdings, large creator allocations — and can miss others. A token with no flags can
              still lose all of its value.
            </P>
            <P>
              Bonding-curve tokens are highly volatile and often illiquid. Only use funds you can afford to lose entirely.
              Nothing on ORBIT is financial advice.
            </P>
          </div>
        </article>
      </div>
    </div>
  );
}
