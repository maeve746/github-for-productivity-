# Productivity Tracker

A very simple GitHub-inspired productivity MVP. Users add daily tasks, mark them complete, and see a contribution graph based directly on completed tasks.

## Features

- Supabase email/password signup, login, and logout
- Today's task list
- Add, complete, uncomplete, and delete tasks
- GitHub-style 365-day contribution graph
- Day details showing completed task count and tasks for the selected day
- Single `tasks` table with row level security

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
