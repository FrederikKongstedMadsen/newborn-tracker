create table diapers (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies (id),
  happened_at timestamptz not null,
  type text not null check (type in ('pee', 'poop', 'both', 'nothing')),
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table diapers enable row level security;

create policy "authenticated full access" on diapers
  for all to authenticated using (true) with check (true);
