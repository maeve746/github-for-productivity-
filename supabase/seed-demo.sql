-- Optional development seed for a logged-in user.
-- Replace the UUID below with a user id from auth.users before running.
do $$
declare
  demo_user uuid := '00000000-0000-0000-0000-000000000000';
  demo_goal uuid;
begin
  insert into public.users (id, email)
  values (demo_user, 'demo@example.com')
  on conflict (id) do nothing;

  insert into public.goals (user_id, title, description, start_date, status)
  values (
    demo_user,
    'Get an internship or job',
    'Build momentum through daily applications, interview prep, projects, and learning.',
    current_date - interval '44 days',
    'active'
  )
  returning id into demo_goal;

  insert into public.activities (user_id, goal_id, title, description, category, activity_date)
  select
    demo_user,
    demo_goal,
    case category
      when 'Applications' then 'Applied to targeted roles'
      when 'Outreach' then 'Sent focused outreach messages'
      when 'DSA' then 'Solved DSA practice set'
      else category || ' session'
    end,
    'Small, trackable progress toward the main goal.',
    category,
    current_date - (offset_days || ' days')::interval
  from generate_series(0, 44) as offset_days
  cross join lateral (
    select unnest(array['Learning', 'Interview Prep', 'Applications', 'Outreach', 'Project Work', 'DSA']) as category
    limit ((offset_days % 5) + 1)
  ) categories
  where offset_days % 9 <> 0;

  insert into public.tasks (user_id, title, category, task_date, completed)
  values
    (demo_user, 'Review behavioral answers', 'Interview Prep', current_date, true),
    (demo_user, 'Apply to 3 roles', 'Applications', current_date, true),
    (demo_user, 'Send 5 outreach notes', 'Outreach', current_date, true),
    (demo_user, 'Ship portfolio update', 'Project Work', current_date, true),
    (demo_user, 'Study LLM evaluation notes', 'Learning', current_date, false),
    (demo_user, 'Solve 2 DSA problems', 'DSA', current_date, false),
    (demo_user, 'Plan tomorrow', 'Other', current_date, false);

  insert into public.daily_notes (user_id, date, note)
  values (demo_user, current_date, 'Studied transformers and applied to 4 startups.')
  on conflict (user_id, date) do update set note = excluded.note;
end $$;
