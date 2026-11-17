# ORBIT — Solana Community Launchpad

*Launch Together. Grow Beyond.*

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Solana Wallet Adapter · Token-2022 · lightweight-charts v5

## Quick start

```bash
npm install
cp .env.example .env.local   # defaults to Solana devnet
npm run dev
```

Checks: `npm run typecheck`, `npm run lint`, `npm run build`, and `npx tsx scripts/verify-launch-tx.ts`
(builds and signs the launch transaction offline and asserts it fits Solana's 1232-byte limit).

## What is real and what is demo

| Area | Status |
| --- | --- |
| Wallet connect / disconnect / balance / copy address | **Live** — Wallet Standard (Phantom, Solflare, Backpack…) |
| Portfolio: holdings, transaction history | **Live** — read from RPC (SPL Token + Token-2022) |
| Token page for any real mint address | **Live** — supply, authorities, metadata, largest holders, risk checks |
| Fixed-supply launch | **Live on devnet** — Token-2022 mint + on-chain metadata, full supply to creator, mint authority revoked, one atomic tx, confirmed before success |
| Bonding-curve launch, curve trading, graduation | **Not configured** — `MeteoraDbc*` adapters report unavailable with requirements |
| Jupiter swaps | Implemented, **mainnet-only**, disabled on test clusters |
| Explorer, trending, communities, charts | **Demo data**, labeled everywhere with a `Demo data` badge |

Trade quotes (output, price impact, minimum received, fees) use real constant-product curve math
(`src/lib/curve.ts`). They are applied to demo state; execution is refused with an explanation.

## Architecture

```
src/
  app/                    routes: / /explore /launch /token/[address] /community /community/[slug] /portfolio /docs /api/health
  config/
    public-env.ts         NEXT_PUBLIC_* only (zod-validated; mainnet gated behind NEXT_PUBLIC_ENABLE_MAINNET)
    server-env.ts         secrets, guarded by `server-only`; exposes booleans only
  lib/
    adapters/             LaunchAdapter / TradeAdapter / GraduationAdapter contracts + implementations
    solana/               send-and-confirm, error classification, mint inspection, explorer links, hooks
    data/                 provider facade (every payload tagged with its source), demo dataset, Supabase client
    launch/schema.ts      zod validation, re-run immediately before building a transaction
    curve.ts              bonding-curve + CPMM quote math
    risk.ts               heuristic risk flags (never implies safety)
  components/             ui primitives, layout, token, launch wizard, community, portfolio
supabase/schema.sql       tables + RLS for off-chain community content
```

### Going live with Meteora

1. Pin `@meteora-ag/dynamic-bonding-curve-sdk` and create a DBC pool config on devnet.
2. Set `METEORA_DBC_CONFIG`.
3. Implement `src/lib/adapters/meteora.ts` (create pool, swap, migration state) against the existing interfaces.
4. Test end to end on devnet, then set `NEXT_PUBLIC_ENABLE_MAINNET=true` deliberately.

No UI changes are needed: availability, costs and quotes flow through the adapters.

### Going live with data

Replace the functions in `src/lib/data/provider.ts` with indexer-backed versions (Helius DAS + Supabase)
that return `source: "indexer"`. Demo labels disappear automatically because they key off `source`.

## Security notes

- No private keys or seed phrases are ever requested, handled or stored.
- The only generated key is the one-time mint address keypair, which must co-sign its own account creation.
- Transactions are simulated before the wallet prompt; success is shown only after `confirmed` commitment with no error.
- Signatures link to Solana Explorer; rejected, expired and RPC failures are classified and explained.
- Security headers are set in `next.config.ts`; external links use `rel="noopener noreferrer"`.
