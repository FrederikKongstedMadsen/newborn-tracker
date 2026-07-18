create table profiles (
  id uuid primary key references auth.users (id),
  display_name text not null,
  color text not null
);

alter table profiles enable row level security;

create policy "authenticated full access" on profiles
  for all to authenticated using (true) with check (true);

-- Guard against concurrent double-starts on feeds (clears deferred backlog item).
create unique index one_open_feed_per_baby on feeds (baby_id) where ended_at is null;
