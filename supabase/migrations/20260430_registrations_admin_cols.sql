-- Add admin workflow columns to registrations
alter table registrations
  add column if not exists closed boolean     not null default false,
  add column if not exists notes  text not null default '';
