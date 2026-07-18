create table babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sex text not null check (sex in ('male', 'female')),
  birth_date date not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table babies enable row level security;

create policy "authenticated full access" on babies
  for all to authenticated using (true) with check (true);

create table growth_measurements (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies (id),
  measured_at date not null,
  weight_g integer,
  height_cm numeric(4, 1),
  head_circumference_cm numeric(4, 1),
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  constraint at_least_one_measurement check (
    weight_g is not null
    or height_cm is not null
    or head_circumference_cm is not null
  )
);

alter table growth_measurements enable row level security;

create policy "authenticated full access" on growth_measurements
  for all to authenticated using (true) with check (true);
