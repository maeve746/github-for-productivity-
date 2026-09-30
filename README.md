# Consistency HQ

A basic MVP for a GitHub-inspired personal productivity platform. It tracks daily activities and tasks against one main goal, with streaks and a contribution heatmap optimized around the rule: consistency > intensity.

## Features

- Supabase email/password sign up, login, and logout
- One primary goal with editable title and description
- Daily activity logging by category
- Daily task creation and completion
- Daily notes per selected date
- GitHub-style contribution graph with day detail
- Current streak, longest streak, productive days, and weekly overview
- Realistic demo data when Supabase keys are not configured

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Add your keys to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Restart the dev server.

The app creates a default active goal for each new user after login. `supabase/seed-demo.sql` is optional if you want database-backed demo records for a specific user id.
