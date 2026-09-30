"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { ActivityIcon, BookOpen, Briefcase, CalendarDays, Check, Flame, LogOut, Plus, Target, Trophy } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CATEGORIES, type Activity, type Category, type DailyNote, type Goal, type Task } from "@/lib/types";
import { demoActivities, demoGoal, demoNotes, demoTasks } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";
import {
  getCurrentStreak,
  getDateRange,
  getGoalSummary,
  getLongestStreak,
  getWeeklyStats,
  groupActivitiesByDate
} from "@/lib/metrics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AuthMode = "login" | "signup";

const today = formatDate(new Date());

export default function Home() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [goal, setGoal] = useState<Goal>(demoGoal);
  const [activities, setActivities] = useState<Activity[]>(demoActivities);
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [notes, setNotes] = useState<DailyNote[]>(demoNotes);
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSessionUserId(data.session?.user.id ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user.id ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadData(userId: string) {
      if (!supabase) return;
      setLoading(true);

      const [goalsResult, activitiesResult, tasksResult, notesResult] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", userId).eq("status", "active").order("start_date").limit(1),
        supabase.from("activities").select("*").eq("user_id", userId).order("activity_date", { ascending: true }),
        supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
        supabase.from("daily_notes").select("*").eq("user_id", userId)
      ]);

      let activeGoal = goalsResult.data?.[0] as Goal | undefined;
      if (!activeGoal) {
        const { data } = await supabase
          .from("goals")
          .insert({
            user_id: userId,
            title: "Get an internship or job",
            description: "Build consistency across applications, outreach, interview prep, and projects.",
            start_date: today,
            status: "active"
          })
          .select()
          .single();
        activeGoal = data as Goal;
      }

      setGoal(activeGoal);
      setActivities((activitiesResult.data as Activity[]) ?? []);
      setTasks((tasksResult.data as Task[]) ?? []);
      setNotes((notesResult.data as DailyNote[]) ?? []);
      setLoading(false);
    }

    if (sessionUserId) {
      loadData(sessionUserId);
    }
  }, [sessionUserId]);

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");

    if (!supabase) {
      setAuthMessage("Demo mode is active because Supabase environment variables are not configured.");
      return;
    }

    const result =
      authMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setAuthMessage(result.error.message);
      return;
    }

    setAuthMessage(authMode === "signup" ? "Check your email if confirmations are enabled." : "Welcome back.");
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setSessionUserId(null);
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading your consistency map...</main>;
  }

  const isDemo = !isSupabaseConfigured || !sessionUserId;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-primary">
            <ActivityIcon className="size-4" />
            Consistency HQ
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Personal productivity, commit by commit.</h1>
        </div>
        <div className="flex items-center gap-2">
          {isDemo ? <AuthPanel authMode={authMode} setAuthMode={setAuthMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} authMessage={authMessage} onSubmit={handleAuth} /> : null}
          {!isDemo ? (
            <Button variant="secondary" onClick={logout}>
              <LogOut className="size-4" />
              Logout
            </Button>
          ) : null}
        </div>
      </header>

      {isDemo ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          Demo data is showing. Add Supabase keys to enable real signup, login, and persistence.
        </div>
      ) : null}

      <Dashboard
        userId={sessionUserId ?? "demo-user"}
        isDemo={isDemo}
        goal={goal}
        setGoal={setGoal}
        activities={activities}
        setActivities={setActivities}
        tasks={tasks}
        setTasks={setTasks}
        notes={notes}
        setNotes={setNotes}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
    </main>
  );
}

function AuthPanel({
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  authMessage,
  onSubmit
}: {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  authMessage: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="w-full p-3 sm:w-80">
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="grid grid-cols-2 rounded-md border border-border bg-background p-1">
          <button type="button" onClick={() => setAuthMode("login")} className={tabClass(authMode === "login")}>
            Login
          </button>
          <button type="button" onClick={() => setAuthMode("signup")} className={tabClass(authMode === "signup")}>
            Sign up
          </button>
        </div>
        <Input type="email" placeholder="email@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <Button className="w-full" type="submit">
          {authMode === "login" ? "Login" : "Create account"}
        </Button>
        {authMessage ? <p className="text-xs text-muted-foreground">{authMessage}</p> : null}
      </form>
    </Card>
  );
}

function Dashboard({
  userId,
  isDemo,
  goal,
  setGoal,
  activities,
  setActivities,
  tasks,
  setTasks,
  notes,
  setNotes,
  selectedDate,
  setSelectedDate
}: {
  userId: string;
  isDemo: boolean;
  goal: Goal;
  setGoal: (goal: Goal) => void;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notes: DailyNote[];
  setNotes: React.Dispatch<React.SetStateAction<DailyNote[]>>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  const byDate = useMemo(() => groupActivitiesByDate(activities), [activities]);
  const currentStreak = getCurrentStreak(activities);
  const longestStreak = getLongestStreak(activities);
  const weekly = getWeeklyStats(activities, tasks);
  const goalSummary = getGoalSummary(goal, activities);
  const todaysTasks = tasks.filter((task) => task.task_date === today);
  const todaysCompletedTasks = todaysTasks.filter((task) => task.completed).length;
  const selectedActivities = byDate[selectedDate] ?? [];
  const note = notes.find((entry) => entry.date === selectedDate)?.note ?? "";

  async function saveGoal(title: string, description: string) {
    const next = { ...goal, title, description };
    setGoal(next);

    if (!isDemo && supabase) {
      await supabase.from("goals").update({ title, description }).eq("id", goal.id);
    }
  }

  async function addActivity(input: { title: string; category: Category; description: string; activity_date: string }) {
    const activity: Activity = {
      id: crypto.randomUUID(),
      user_id: userId,
      goal_id: goal.id,
      title: input.title,
      description: input.description || null,
      category: input.category,
      activity_date: input.activity_date,
      created_at: new Date().toISOString()
    };

    setActivities((current) => [...current, activity]);
    if (!isDemo && supabase) {
      const { data } = await supabase.from("activities").insert(activity).select().single();
      if (data) setActivities((current) => current.map((item) => (item.id === activity.id ? (data as Activity) : item)));
    }
  }

  async function addTask(input: { title: string; category: Category; task_date: string }) {
    const task: Task = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: input.title,
      category: input.category,
      task_date: input.task_date,
      completed: false,
      created_at: new Date().toISOString()
    };

    setTasks((current) => [...current, task]);
    if (!isDemo && supabase) {
      const { data } = await supabase.from("tasks").insert(task).select().single();
      if (data) setTasks((current) => current.map((item) => (item.id === task.id ? (data as Task) : item)));
    }
  }

  async function toggleTask(task: Task) {
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, completed: !item.completed } : item)));
    if (!isDemo && supabase) {
      await supabase.from("tasks").update({ completed: !task.completed }).eq("id", task.id);
    }
  }

  async function saveNote(value: string) {
    const existing = notes.find((entry) => entry.date === selectedDate);

    if (existing) {
      setNotes((current) => current.map((entry) => (entry.id === existing.id ? { ...entry, note: value } : entry)));
      if (!isDemo && supabase) await supabase.from("daily_notes").update({ note: value }).eq("id", existing.id);
      return;
    }

    const created: DailyNote = { id: crypto.randomUUID(), user_id: userId, date: selectedDate, note: value };
    setNotes((current) => [...current, created]);
    if (!isDemo && supabase) await supabase.from("daily_notes").insert(created);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="size-4 text-primary" />
                Main goal
              </div>
              <h2 className="mt-2 text-2xl font-semibold">{goal.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{goal.description}</p>
            </div>
            <GoalEditor goal={goal} onSave={saveGoal} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Metric icon={<Flame className="size-4" />} label="Current streak" value={`${currentStreak} days`} />
            <Metric icon={<Trophy className="size-4" />} label="Longest streak" value={`${longestStreak} days`} />
            <Metric icon={<CalendarDays className="size-4" />} label="Days active" value={`${goalSummary.daysActive}`} />
            <Metric icon={<ActivityIcon className="size-4" />} label="Goal activities" value={`${goalSummary.totalActivities}`} />
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium">Contribution graph</h3>
              <span className="text-xs text-muted-foreground">Consistency &gt; Intensity</span>
            </div>
            <ContributionGraph activities={activities} selectedDate={selectedDate} onSelect={setSelectedDate} />
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-medium">{selectedDate}</p>
              <div className="mt-3 space-y-2">
                {selectedActivities.length ? (
                  selectedActivities.map((activity) => (
                    <div key={activity.id} className="rounded-md border border-border bg-background px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">{activity.title}</span>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{activity.category}</span>
                      </div>
                      {activity.description ? <p className="mt-1 text-xs text-muted-foreground">{activity.description}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No logged activities for this day.</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-medium">Weekly overview</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric icon={<ActivityIcon className="size-4" />} label="Activities" value={`${weekly.totalActivities}`} compact />
              <Metric icon={<Check className="size-4" />} label="Tasks done" value={`${weekly.tasksCompleted}`} compact />
              <Metric icon={<Briefcase className="size-4" />} label="Applications" value={`${weekly.applications}`} compact />
              <Metric icon={<BookOpen className="size-4" />} label="Learning" value={`${weekly.learning}`} compact />
            </div>
            <div className="mt-4 space-y-2">
              {weekly.dates.map((date) => {
                const count = byDate[date]?.length ?? 0;
                return (
                  <div key={date} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-muted-foreground">{date.slice(5)}</span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, count * 20)}%` }} />
                    </div>
                    <span className="w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      <aside className="space-y-6">
        <Card className="p-5">
          <h3 className="text-sm font-medium">Today</h3>
          <p className="mt-2 text-2xl font-semibold">
            {todaysCompletedTasks} / {todaysTasks.length} tasks completed
          </p>
          <div className="mt-4 space-y-2">
            {todaysTasks.map((task) => (
              <label key={task.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} className="size-4 accent-green-500" />
                <span className={task.completed ? "text-muted-foreground line-through" : ""}>{task.title}</span>
              </label>
            ))}
          </div>
        </Card>

        <ActivityForm onAdd={addActivity} />
        <TaskForm onAdd={addTask} />
        <NoteForm selectedDate={selectedDate} note={note} onSave={saveNote} />
      </aside>
    </div>
  );
}

function ContributionGraph({ activities, selectedDate, onSelect }: { activities: Activity[]; selectedDate: string; onSelect: (date: string) => void }) {
  const byDate = groupActivitiesByDate(activities);
  const dates = getDateRange(98);

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
      {dates.map((date) => {
        const count = byDate[date]?.length ?? 0;
        return (
          <button
            key={date}
            type="button"
            title={`${date}: ${count} activities`}
            onClick={() => onSelect(date)}
            className={`size-4 shrink-0 rounded-sm border ${heatClass(count)} ${selectedDate === date ? "ring-2 ring-primary" : ""}`}
            aria-label={`${date}: ${count} activities`}
          />
        );
      })}
    </div>
  );
}

function ActivityForm({ onAdd }: { onAdd: (input: { title: string; category: Category; description: string; activity_date: string }) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Learning");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium">Log activity</h3>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onAdd({ title, category, description, activity_date: date });
          setTitle("");
          setDescription("");
        }}
      >
        <Input placeholder="Interview prep, outreach, project work..." value={title} onChange={(event) => setTitle(event.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
            {CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <Textarea placeholder="Optional description" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Button type="submit" className="w-full">
          <Plus className="size-4" />
          Add activity
        </Button>
      </form>
    </Card>
  );
}

function TaskForm({ onAdd }: { onAdd: (input: { title: string; category: Category; task_date: string }) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Applications");

  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium">Create daily task</h3>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onAdd({ title, category, task_date: today });
          setTitle("");
        }}
      >
        <Input placeholder="Apply to 3 roles" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
          {CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" className="w-full">
          <Plus className="size-4" />
          Add task
        </Button>
      </form>
    </Card>
  );
}

function NoteForm({ selectedDate, note, onSave }: { selectedDate: string; note: string; onSave: (note: string) => void }) {
  const [value, setValue] = useState(note);

  useEffect(() => setValue(note), [note, selectedDate]);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium">Daily note</h3>
      <p className="mt-1 text-xs text-muted-foreground">{selectedDate}</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(value);
        }}
      >
        <Textarea placeholder="Studied transformers and applied to 4 startups." value={value} onChange={(event) => setValue(event.target.value)} />
        <Button type="submit" variant="secondary" className="w-full">
          Save note
        </Button>
      </form>
    </Card>
  );
}

function GoalEditor({ goal, onSave }: { goal: Goal; onSave: (title: string, description: string) => void }) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");

  return (
    <form
      className="grid gap-2 md:w-80"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(title, description);
      }}
    >
      <Input value={title} onChange={(event) => setTitle(event.target.value)} />
      <Textarea className="min-h-16" value={description} onChange={(event) => setDescription(event.target.value)} />
      <Button type="submit" variant="secondary">
        Save goal
      </Button>
    </form>
  );
}

function Metric({ icon, label, value, compact = false }: { icon: React.ReactNode; label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className={compact ? "mt-2 text-xl font-semibold" : "mt-2 text-2xl font-semibold"}>{value}</div>
    </div>
  );
}

function heatClass(count: number) {
  if (count >= 5) return "border-green-500/30 bg-green-500";
  if (count >= 3) return "border-green-600/30 bg-green-700";
  if (count >= 1) return "border-green-800/30 bg-green-950";
  return "border-border bg-muted";
}

function tabClass(active: boolean) {
  return `rounded px-2 py-1 text-sm ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`;
}
