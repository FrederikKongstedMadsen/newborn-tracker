create table temperatures (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies (id),
  measured_at timestamptz not null,
  celsius numeric(3,1) not null,
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table temperatures enable row level security;

create policy "authenticated full access" on temperatures
  for all to authenticated using (true) with check (true);

create table medicine_doses (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies (id),
  given_at timestamptz not null,
  medicine text not null default 'paracetamol',
  amount numeric(6,1) not null,
  unit text not null check (unit in ('ml', 'mg')),
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table medicine_doses enable row level security;

create policy "authenticated full access" on medicine_doses
  for all to authenticated using (true) with check (true);
