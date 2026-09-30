create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  start_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('Learning', 'Interview Prep', 'Applications', 'Outreach', 'Project Work', 'DSA', 'Other')),
  activity_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('Learning', 'Interview Prep', 'Applications', 'Outreach', 'Project Work', 'DSA', 'Other')),
  task_date date not null default current_date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.goals enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_notes enable row level security;

create policy "Users can read themselves" on public.users
  for select using (auth.uid() = id);

create policy "Users can update themselves" on public.users
  for update using (auth.uid() = id);

create policy "Goal owner access" on public.goals
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Activity owner access" on public.activities
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Task owner access" on public.tasks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Daily note owner access" on public.daily_notes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists activities_user_date_idx on public.activities(user_id, activity_date);
create index if not exists tasks_user_date_idx on public.tasks(user_id, task_date);
create index if not exists daily_notes_user_date_idx on public.daily_notes(user_id, date);
