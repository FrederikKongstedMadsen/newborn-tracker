create table feeds (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies (id),
  type text not null check (type in ('breast', 'formula')),
  started_at timestamptz not null,
  ended_at timestamptz,
  left_seconds integer not null default 0 check (left_seconds >= 0),
  right_seconds integer not null default 0 check (right_seconds >= 0),
  volume_ml integer check (volume_ml > 0),
  active_side text check (active_side in ('left', 'right')),
  active_side_started_at timestamptz,
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  constraint active_side_pair check (
    (active_side is null) = (active_side_started_at is null)
  )
);

alter table feeds enable row level security;

create policy "authenticated full access" on feeds
  for all to authenticated using (true) with check (true);
