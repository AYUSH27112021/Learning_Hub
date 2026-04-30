-- Run in Supabase SQL Editor

create table if not exists registrations (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  course_name   text        not null,
  student_name  text        not null,
  father_name   text        not null,
  mother_name   text        not null,
  birth_date    date        not null,
  gender        text        not null,
  full_address  text        not null,
  district      text        not null,
  pincode       text        not null,
  religion      text,
  nationality   text        not null,
  phone         text        not null,
  email         text,
  blood_group   text,
  occupation    text,
  marital_status text,
  closed        boolean     not null default false
);

-- Row Level Security
alter table registrations enable row level security;

-- Anyone (anon) can submit
create policy "anon insert"
  on registrations for insert
  to anon
  with check (true);

-- Only logged-in admin can read
create policy "admin select"
  on registrations for select
  to authenticated
  using (true);

-- Only logged-in admin can toggle closed
create policy "admin update"
  on registrations for update
  to authenticated
  using (true)
  with check (true);
