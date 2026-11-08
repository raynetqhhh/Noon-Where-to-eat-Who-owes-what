-- Noon: initial schema
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Money is stored as integer cents to avoid floating-point rounding errors.

-- ---------------------------------------------------------------------------
-- Sessions: one per lunch outing, shared via a short code in the link.
-- ---------------------------------------------------------------------------
create table public.sessions (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null,
  title                 text not null,
  status                text not null default 'voting',
  decided_suggestion_id uuid,
  created_at            timestamptz not null default now(),
  expires_at            timestamptz not null,

  constraint sessions_code_key unique (code),
  constraint sessions_code_format check (code ~ '^[A-Z0-9]{6}$'),
  constraint sessions_title_length check (char_length(title) between 1 and 80),
  constraint sessions_status_check check (status in ('voting', 'decided', 'settled'))
);

-- ---------------------------------------------------------------------------
-- Participants: no accounts. Each person gets a random token on join;
-- only its SHA-256 hash is stored.
-- ---------------------------------------------------------------------------
create table public.participants (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null,
  display_name text not null,
  token_hash   text not null,
  is_host      boolean not null default false,
  created_at   timestamptz not null default now(),

  constraint participants_session_id_fkey
    foreign key (session_id) references public.sessions (id) on delete cascade,
  constraint participants_token_hash_key unique (token_hash),
  constraint participants_name_length check (char_length(display_name) between 1 and 40)
);

create unique index participants_session_name_key
  on public.participants (session_id, lower(display_name));
create unique index participants_one_host_per_session
  on public.participants (session_id) where is_host;

-- ---------------------------------------------------------------------------
-- Suggestions: restaurants proposed for a session.
-- ---------------------------------------------------------------------------
create table public.suggestions (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null,
  suggested_by uuid,
  name         text not null,
  cuisine      text,
  price_level  smallint,
  location     text,
  url          text,
  created_at   timestamptz not null default now(),

  constraint suggestions_session_id_fkey
    foreign key (session_id) references public.sessions (id) on delete cascade,
  constraint suggestions_suggested_by_fkey
    foreign key (suggested_by) references public.participants (id) on delete set null,
  constraint suggestions_name_length check (char_length(name) between 1 and 100),
  constraint suggestions_price_level check (price_level between 1 and 4)
);

create index suggestions_session_id_idx on public.suggestions (session_id);

alter table public.sessions
  add constraint sessions_decided_suggestion_id_fkey
  foreign key (decided_suggestion_id) references public.suggestions (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Votes: one vote per participant per session (changing your vote = upsert).
-- ---------------------------------------------------------------------------
create table public.votes (
  session_id     uuid not null,
  participant_id uuid not null,
  suggestion_id  uuid not null,
  created_at     timestamptz not null default now(),

  constraint votes_pkey primary key (session_id, participant_id),
  constraint votes_session_id_fkey
    foreign key (session_id) references public.sessions (id) on delete cascade,
  constraint votes_participant_id_fkey
    foreign key (participant_id) references public.participants (id) on delete cascade,
  constraint votes_suggestion_id_fkey
    foreign key (suggestion_id) references public.suggestions (id) on delete cascade
);

create index votes_suggestion_id_idx on public.votes (suggestion_id);

-- ---------------------------------------------------------------------------
-- Bills: at most one per session. Shares = what each person owes the payer.
-- ---------------------------------------------------------------------------
create table public.bills (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null,
  paid_by            uuid not null,
  split_method       text not null,
  subtotal_cents     integer not null,
  service_charge_pct numeric(5, 2) not null default 0,
  tax_pct            numeric(5, 2) not null default 0,
  total_cents        integer not null,
  created_at         timestamptz not null default now(),

  constraint bills_session_id_key unique (session_id),
  constraint bills_session_id_fkey
    foreign key (session_id) references public.sessions (id) on delete cascade,
  constraint bills_paid_by_fkey
    foreign key (paid_by) references public.participants (id) on delete cascade,
  constraint bills_split_method_check check (split_method in ('equal', 'itemized')),
  constraint bills_amounts_check check (subtotal_cents >= 0 and total_cents >= subtotal_cents)
);

create table public.bill_shares (
  bill_id        uuid not null,
  participant_id uuid not null,
  amount_cents   integer not null,
  is_paid        boolean not null default false,
  paid_at        timestamptz,

  constraint bill_shares_pkey primary key (bill_id, participant_id),
  constraint bill_shares_bill_id_fkey
    foreign key (bill_id) references public.bills (id) on delete cascade,
  constraint bill_shares_participant_id_fkey
    foreign key (participant_id) references public.participants (id) on delete cascade,
  constraint bill_shares_amount_check check (amount_cents >= 0)
);

-- ---------------------------------------------------------------------------
-- replace_bill: delete any existing bill and insert the new bill + shares
-- in ONE transaction, so a failure never leaves a bill without shares.
-- The payer's own share is marked paid automatically.
-- ---------------------------------------------------------------------------
create or replace function public.replace_bill(
  p_session_id         uuid,
  p_paid_by            uuid,
  p_split_method       text,
  p_subtotal_cents     integer,
  p_service_charge_pct numeric,
  p_tax_pct            numeric,
  p_total_cents        integer,
  p_shares             jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_bill_id uuid;
begin
  delete from bills where session_id = p_session_id;

  insert into bills (
    session_id, paid_by, split_method, subtotal_cents,
    service_charge_pct, tax_pct, total_cents
  )
  values (
    p_session_id, p_paid_by, p_split_method, p_subtotal_cents,
    p_service_charge_pct, p_tax_pct, p_total_cents
  )
  returning id into v_bill_id;

  insert into bill_shares (bill_id, participant_id, amount_cents, is_paid, paid_at)
  select
    v_bill_id,
    (share ->> 'participant_id')::uuid,
    (share ->> 'amount_cents')::integer,
    (share ->> 'participant_id')::uuid = p_paid_by,
    case when (share ->> 'participant_id')::uuid = p_paid_by then now() end
  from jsonb_array_elements(p_shares) as share;

  return v_bill_id;
end;
$$;

revoke execute on function public.replace_bill(uuid, uuid, text, integer, numeric, numeric, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_bill(uuid, uuid, text, integer, numeric, numeric, integer, jsonb)
  to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security: ON with no policies. The anon/public key cannot read
-- or write anything; only the backend (service role) can.
-- ---------------------------------------------------------------------------
alter table public.sessions     enable row level security;
alter table public.participants enable row level security;
alter table public.suggestions  enable row level security;
alter table public.votes        enable row level security;
alter table public.bills        enable row level security;
alter table public.bill_shares  enable row level security;
