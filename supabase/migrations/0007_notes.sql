create table notes (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies (id),
  noted_at timestamptz not null,
  body text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table notes enable row level security;

create policy "authenticated full access" on notes
  for all to authenticated using (true) with check (true);
