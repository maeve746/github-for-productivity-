create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  task_date date not null default current_date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "Task owner access" on public.tasks;
create policy "Task owner access" on public.tasks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists tasks_user_date_idx on public.tasks(user_id, task_date);
