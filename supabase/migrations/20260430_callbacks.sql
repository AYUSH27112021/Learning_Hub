-- Drop old table if it exists (clean slate)
drop table if exists callbacks;

create table callbacks (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  phone      text        not null,
  closed     boolean     not null default false,
  created_at timestamptz not null default now()
);

-- RLS: anyone can insert (public form), only service role can read/update
alter table callbacks enable row level security;

create policy "public insert"
  on callbacks for insert
  to anon
  with check (true);

create policy "service role full access"
  on callbacks for all
  using (auth.role() = 'service_role');
