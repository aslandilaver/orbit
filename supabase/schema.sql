-- ORBIT application data. On-chain state (balances, supply, curve reserves)
-- is NOT stored here as a source of truth — it is read from the chain or an
-- indexer. These tables hold off-chain project content and index caches.

create table if not exists public.tokens (
  mint            text primary key,              -- base58 mint address
  cluster         text not null check (cluster in ('devnet','testnet','mainnet-beta')),
  name            text not null check (char_length(name) between 2 and 32),
  ticker          text not null check (ticker ~ '^[A-Z0-9]{2,10}$'),
  description     text check (char_length(description) <= 500),
  category        text,
  creator         text not null,
  launch_type     text not null check (launch_type in ('curve','fixed')),
  graduation_target_sol numeric check (graduation_target_sol between 20 and 500),
  launch_signature text not null,                -- verified on-chain before insert
  created_at      timestamptz not null default now()
);

create table if not exists public.communities (
  slug        text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  token_mint  text not null references public.tokens(mint) on delete cascade,
  name        text not null,
  tagline     text,
  about       text,
  links       jsonb not null default '{}'::jsonb,
  featured    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.community_updates (
  id          uuid primary key default gen_random_uuid(),
  community   text not null references public.communities(slug) on delete cascade,
  kind        text not null check (kind in ('update','announcement','milestone')),
  title       text not null check (char_length(title) <= 120),
  body        text not null check (char_length(body) <= 4000),
  author      text not null,                     -- wallet that signed the post message
  signature   text not null,                     -- ed25519 signature over the post, verified server-side
  created_at  timestamptz not null default now()
);

-- Governance (future). Results are computed from on-chain snapshots; this
-- table only references proposals that exist on-chain.
create table if not exists public.proposals (
  id            uuid primary key default gen_random_uuid(),
  community     text not null references public.communities(slug) on delete cascade,
  onchain_id    text not null unique,
  title         text not null,
  snapshot_slot bigint not null,
  created_at    timestamptz not null default now()
);

alter table public.tokens            enable row level security;
alter table public.communities       enable row level security;
alter table public.community_updates enable row level security;
alter table public.proposals         enable row level security;

-- Public read. Writes only via server routes using the service role, after
-- verifying a wallet signature and the on-chain transaction.
create policy "public read tokens"      on public.tokens            for select using (true);
create policy "public read communities" on public.communities       for select using (true);
create policy "public read updates"     on public.community_updates for select using (true);
create policy "public read proposals"   on public.proposals         for select using (true);
