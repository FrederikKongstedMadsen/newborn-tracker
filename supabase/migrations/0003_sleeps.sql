create table sleeps (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies (id),
  started_at timestamptz not null,
  ended_at timestamptz,
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table sleeps enable row level security;

create policy "authenticated full access" on sleeps
  for all to authenticated using (true) with check (true);

create table sleep_pauses (
  id uuid primary key default gen_random_uuid(),
  sleep_id uuid not null references sleeps (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table sleep_pauses enable row level security;

create policy "authenticated full access" on sleep_pauses
  for all to authenticated using (true) with check (true);

-- Guard against concurrent double-starts: at most one running sleep per baby,
-- and at most one open pause per sleep.
create unique index one_open_sleep_per_baby on sleeps (baby_id) where ended_at is null;

create unique index one_open_pause_per_sleep on sleep_pauses (sleep_id) where ended_at is null;
