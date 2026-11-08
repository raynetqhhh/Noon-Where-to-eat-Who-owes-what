-- Noon: accounts, crews, vote + veto, itemised bills with multiple payers,
-- settlements (who pays whom).
-- Run AFTER 20261108000000_init.sql. This drops and recreates the bill tables,
-- which is safe on a new project that has no bills yet.

-- ---------------------------------------------------------------------------
-- Profiles: one per Supabase Auth user, created automatically on sign-up.
-- Dietary needs are a small fixed vocabulary so filters stay simple.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key,
  display_name text not null,
  dietary      text[] not null default '{}',
  allergies    text,
  paynow_id    text,
  created_at   timestamptz not null default now(),

  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint profiles_name_length check (char_length(display_name) between 1 and 40),
  constraint profiles_dietary_check
    check (dietary <@ array['halal', 'vegetarian', 'vegan', 'no_beef', 'no_pork']::text[]),
  constraint profiles_allergies_length check (char_length(allergies) <= 200),
  constraint profiles_paynow_length check (char_length(paynow_id) <= 40)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
        nullif(split_part(new.email, '@', 1), ''),
        'Friend'
      ),
      40
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Crews: recurring lunch groups saved as a template.
-- ---------------------------------------------------------------------------
create table public.crews (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null,
  name                  text not null,
  budget_per_head_cents integer,
  meeting_point         text,
  created_at            timestamptz not null default now(),

  constraint crews_owner_id_fkey foreign key (owner_id) references public.profiles (id) on delete cascade,
  constraint crews_name_length check (char_length(name) between 1 and 60),
  constraint crews_budget_check check (budget_per_head_cents > 0),
  constraint crews_meeting_point_length check (char_length(meeting_point) <= 120)
);

create index crews_owner_id_idx on public.crews (owner_id);

create table public.crew_members (
  id           uuid primary key default gen_random_uuid(),
  crew_id      uuid not null,
  profile_id   uuid,
  display_name text not null,
  dietary      text[] not null default '{}',
  created_at   timestamptz not null default now(),

  constraint crew_members_crew_id_fkey foreign key (crew_id) references public.crews (id) on delete cascade,
  constraint crew_members_profile_id_fkey foreign key (profile_id) references public.profiles (id) on delete set null,
  constraint crew_members_name_length check (char_length(display_name) between 1 and 40),
  constraint crew_members_dietary_check
    check (dietary <@ array['halal', 'vegetarian', 'vegan', 'no_beef', 'no_pork']::text[])
);

create unique index crew_members_crew_name_key on public.crew_members (crew_id, lower(display_name));
create index crew_members_profile_id_idx on public.crew_members (profile_id);

-- ---------------------------------------------------------------------------
-- Sessions: link to crew + host account, budget, countdown, host lock.
-- ---------------------------------------------------------------------------
alter table public.sessions
  add column crew_id               uuid,
  add column host_user_id          uuid,
  add column budget_per_head_cents integer,
  add column voting_deadline       timestamptz,
  add column is_locked             boolean not null default false,
  add column decided_at            timestamptz,
  add column decision_reason       text,
  add constraint sessions_crew_id_fkey
    foreign key (crew_id) references public.crews (id) on delete set null,
  add constraint sessions_host_user_id_fkey
    foreign key (host_user_id) references public.profiles (id) on delete set null,
  add constraint sessions_budget_check check (budget_per_head_cents > 0);

alter table public.sessions drop constraint sessions_status_check;
alter table public.sessions
  add constraint sessions_status_check check (status in ('voting', 'decided', 'settled', 'closed'));

create index sessions_crew_id_idx on public.sessions (crew_id);
create index sessions_host_user_id_idx on public.sessions (host_user_id);

-- ---------------------------------------------------------------------------
-- Participants: signed-in users are identified by user_id (no token needed);
-- guests keep using a token.
-- ---------------------------------------------------------------------------
alter table public.participants
  alter column token_hash drop not null,
  add column user_id        uuid,
  add column crew_member_id uuid,
  add column dietary        text[] not null default '{}',
  add constraint participants_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete set null,
  add constraint participants_crew_member_id_fkey
    foreign key (crew_member_id) references public.crew_members (id) on delete set null,
  add constraint participants_dietary_check
    check (dietary <@ array['halal', 'vegetarian', 'vegan', 'no_beef', 'no_pork']::text[]);

create unique index participants_session_user_key
  on public.participants (session_id, user_id) where user_id is not null;
create index participants_user_id_idx on public.participants (user_id);

-- ---------------------------------------------------------------------------
-- Suggestions: dietary + mood tags, price per head, sponsored label.
-- ---------------------------------------------------------------------------
alter table public.suggestions
  add column tags                 text[] not null default '{}',
  add column price_per_head_cents integer,
  add column is_sponsored         boolean not null default false,
  add column deal                 text,
  add constraint suggestions_price_check check (price_per_head_cents > 0),
  add constraint suggestions_tags_count check (cardinality(tags) <= 12);

-- ---------------------------------------------------------------------------
-- Votes: each person has one 'vote' and one 'veto'.
-- ---------------------------------------------------------------------------
alter table public.votes drop constraint votes_pkey;
alter table public.votes
  add column kind text not null default 'vote',
  add constraint votes_kind_check check (kind in ('vote', 'veto')),
  add constraint votes_pkey primary key (session_id, participant_id, kind);

-- ---------------------------------------------------------------------------
-- Bills (rebuilt): items shared by one or more people, several payers,
-- computed shares, and settlements = the fewest transfers that square up.
-- ---------------------------------------------------------------------------
drop function if exists public.replace_bill(uuid, uuid, text, integer, numeric, numeric, integer, jsonb);
drop table if exists public.bill_shares;
drop table if exists public.bills;

create table public.bills (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null,
  subtotal_cents     integer not null,
  discount_cents     integer not null default 0,
  service_charge_pct numeric(5, 2) not null default 10,
  tax_pct            numeric(5, 2) not null default 9,
  service_cents      integer not null default 0,
  tax_cents          integer not null default 0,
  total_cents        integer not null,
  created_by         uuid,
  created_at         timestamptz not null default now(),

  constraint bills_session_id_key unique (session_id),
  constraint bills_session_id_fkey foreign key (session_id) references public.sessions (id) on delete cascade,
  constraint bills_created_by_fkey foreign key (created_by) references public.participants (id) on delete set null,
  constraint bills_amounts_check check (
    subtotal_cents >= 0 and discount_cents >= 0 and service_cents >= 0
    and tax_cents >= 0 and total_cents >= 0
  )
);

create table public.bill_items (
  id           uuid primary key default gen_random_uuid(),
  bill_id      uuid not null,
  name         text not null,
  amount_cents integer not null,
  position     integer not null default 0,

  constraint bill_items_bill_id_fkey foreign key (bill_id) references public.bills (id) on delete cascade,
  constraint bill_items_name_length check (char_length(name) between 1 and 80),
  constraint bill_items_amount_check check (amount_cents > 0)
);

create index bill_items_bill_id_idx on public.bill_items (bill_id);

create table public.bill_item_shares (
  item_id        uuid not null,
  participant_id uuid not null,

  constraint bill_item_shares_pkey primary key (item_id, participant_id),
  constraint bill_item_shares_item_id_fkey foreign key (item_id) references public.bill_items (id) on delete cascade,
  constraint bill_item_shares_participant_id_fkey
    foreign key (participant_id) references public.participants (id) on delete cascade
);

create table public.bill_payers (
  bill_id        uuid not null,
  participant_id uuid not null,
  amount_cents   integer not null,

  constraint bill_payers_pkey primary key (bill_id, participant_id),
  constraint bill_payers_bill_id_fkey foreign key (bill_id) references public.bills (id) on delete cascade,
  constraint bill_payers_participant_id_fkey
    foreign key (participant_id) references public.participants (id) on delete cascade,
  constraint bill_payers_amount_check check (amount_cents >= 0)
);

create table public.bill_shares (
  bill_id        uuid not null,
  participant_id uuid not null,
  owed_cents     integer not null,

  constraint bill_shares_pkey primary key (bill_id, participant_id),
  constraint bill_shares_bill_id_fkey foreign key (bill_id) references public.bills (id) on delete cascade,
  constraint bill_shares_participant_id_fkey
    foreign key (participant_id) references public.participants (id) on delete cascade,
  constraint bill_shares_amount_check check (owed_cents >= 0)
);

create index bill_shares_participant_id_idx on public.bill_shares (participant_id);

create table public.settlements (
  id                  uuid primary key default gen_random_uuid(),
  bill_id             uuid not null,
  from_participant_id uuid not null,
  to_participant_id   uuid not null,
  amount_cents        integer not null,
  is_paid             boolean not null default false,
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),

  constraint settlements_bill_id_fkey foreign key (bill_id) references public.bills (id) on delete cascade,
  constraint settlements_from_participant_id_fkey
    foreign key (from_participant_id) references public.participants (id) on delete cascade,
  constraint settlements_to_participant_id_fkey
    foreign key (to_participant_id) references public.participants (id) on delete cascade,
  constraint settlements_amount_check check (amount_cents > 0),
  constraint settlements_distinct_people check (from_participant_id <> to_participant_id)
);

create index settlements_bill_id_idx on public.settlements (bill_id);
create index settlements_from_idx on public.settlements (from_participant_id);
create index settlements_to_idx on public.settlements (to_participant_id);

-- replace_bill: swap the whole bill in ONE transaction.
-- p_bill = { subtotal_cents, discount_cents, service_charge_pct, tax_pct,
--            service_cents, tax_cents, total_cents, created_by,
--            items: [{ name, amount_cents, participant_ids: [] }],
--            payers: [{ participant_id, amount_cents }],
--            shares: [{ participant_id, owed_cents }],
--            settlements: [{ from_participant_id, to_participant_id, amount_cents }] }
create or replace function public.replace_bill(p_session_id uuid, p_bill jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_bill_id  uuid;
  v_item     jsonb;
  v_item_id  uuid;
  v_position integer := 0;
begin
  delete from bills where session_id = p_session_id;

  insert into bills (
    session_id, subtotal_cents, discount_cents, service_charge_pct, tax_pct,
    service_cents, tax_cents, total_cents, created_by
  )
  values (
    p_session_id,
    (p_bill ->> 'subtotal_cents')::integer,
    (p_bill ->> 'discount_cents')::integer,
    (p_bill ->> 'service_charge_pct')::numeric,
    (p_bill ->> 'tax_pct')::numeric,
    (p_bill ->> 'service_cents')::integer,
    (p_bill ->> 'tax_cents')::integer,
    (p_bill ->> 'total_cents')::integer,
    (p_bill ->> 'created_by')::uuid
  )
  returning id into v_bill_id;

  for v_item in select value from jsonb_array_elements(p_bill -> 'items') loop
    insert into bill_items (bill_id, name, amount_cents, position)
    values (v_bill_id, v_item ->> 'name', (v_item ->> 'amount_cents')::integer, v_position)
    returning id into v_item_id;

    insert into bill_item_shares (item_id, participant_id)
    select v_item_id, value::uuid
    from jsonb_array_elements_text(v_item -> 'participant_ids');

    v_position := v_position + 1;
  end loop;

  insert into bill_payers (bill_id, participant_id, amount_cents)
  select v_bill_id, (p ->> 'participant_id')::uuid, (p ->> 'amount_cents')::integer
  from jsonb_array_elements(p_bill -> 'payers') as p;

  insert into bill_shares (bill_id, participant_id, owed_cents)
  select v_bill_id, (s ->> 'participant_id')::uuid, (s ->> 'owed_cents')::integer
  from jsonb_array_elements(p_bill -> 'shares') as s;

  insert into settlements (bill_id, from_participant_id, to_participant_id, amount_cents)
  select
    v_bill_id,
    (t ->> 'from_participant_id')::uuid,
    (t ->> 'to_participant_id')::uuid,
    (t ->> 'amount_cents')::integer
  from jsonb_array_elements(p_bill -> 'settlements') as t;

  return v_bill_id;
end;
$$;

revoke execute on function public.replace_bill(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_bill(uuid, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- RLS on, no policies: only the backend (service role) can read or write.
-- The frontend uses the anon key for Auth and Realtime broadcast only.
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.crews            enable row level security;
alter table public.crew_members     enable row level security;
alter table public.bills            enable row level security;
alter table public.bill_items       enable row level security;
alter table public.bill_item_shares enable row level security;
alter table public.bill_payers      enable row level security;
alter table public.bill_shares      enable row level security;
alter table public.settlements      enable row level security;
