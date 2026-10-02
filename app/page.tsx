"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Check, LogOut, Plus, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getDateRange, groupTasksByDate } from "@/lib/metrics";
import type { Task } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "signup";

export default function Home() {
  const today = formatDate(new Date());
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authMessage, setAuthMessage] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadTasks(activeUserId: string) {
      if (!supabase) return;
      setLoading(true);

      const startDate = getDateRange(365)[0];
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", activeUserId)
        .gte("task_date", startDate)
        .order("task_date", { ascending: true })
        .order("created_at", { ascending: true });

      setTasks((data as Task[]) ?? []);
      setLoading(false);
    }

    if (userId) {
      loadTasks(userId);
    } else {
      setTasks([]);
    }
  }, [userId]);

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");

    if (!supabase) {
      setAuthMessage("Add Supabase environment variables to enable authentication and persistence.");
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

    setAuthMessage(authMode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Logged in.");
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setUserId(null);
  }

  async function addTask(title: string) {
    if (!title.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      user_id: userId ?? "local-user",
      title: title.trim(),
      task_date: today,
      completed: false,
      created_at: new Date().toISOString()
    };

    setTasks((current) => [...current, task]);
    setSelectedDate(today);

    if (userId && supabase) {
      const { data } = await supabase.from("tasks").insert(task).select().single();
      if (data) {
        setTasks((current) => current.map((item) => (item.id === task.id ? (data as Task) : item)));
      }
    }
  }

  async function toggleTask(task: Task) {
    const completed = !task.completed;
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, completed } : item)));
    setSelectedDate(task.task_date);

    if (userId && supabase) {
      await supabase.from("tasks").update({ completed }).eq("id", task.id);
    }
  }

  async function deleteTask(task: Task) {
    setTasks((current) => current.filter((item) => item.id !== task.id));

    if (userId && supabase) {
      await supabase.from("tasks").delete().eq("id", task.id);
    }
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</main>;
  }

  const isLoggedIn = Boolean(userId);
  const requiresLogin = isSupabaseConfigured && !isLoggedIn;
  const todaysTasks = tasks.filter((task) => task.task_date === today);
  const completedToday = todaysTasks.filter((task) => task.completed).length;
  const selectedTasks = tasks.filter((task) => task.task_date === selectedDate);
  const selectedCompletedCount = selectedTasks.filter((task) => task.completed).length;

  return (
    <>
      <video
        aria-hidden="true"
        className="fixed inset-0 z-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        src="/background.mp4"
      />
      <div className="fixed inset-0 z-0 bg-background/35 backdrop-blur-[1px]" />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm text-primary">
            <Check className="size-4" />
            Productivity Tracker
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Today, one task at a time.</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatReadableDate(today)}</p>
        </div>
        {isLoggedIn ? (
          <Button variant="secondary" className="bg-card/30 backdrop-blur-md" onClick={logout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        ) : (
          <Button variant="secondary" className="bg-card/30 backdrop-blur-md" onClick={() => setShowAuth((current) => !current)}>
            Login
          </Button>
        )}
      </header>

      {!isLoggedIn && showAuth ? (
        <div className="flex justify-end">
          <AuthPanel
            authMode={authMode}
            setAuthMode={setAuthMode}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            authMessage={authMessage}
            onSubmit={handleAuth}
          />
        </div>
      ) : null}

      {requiresLogin ? (
        <Card className="bg-card/35 p-8 text-center backdrop-blur-xl">
          <h2 className="text-lg font-semibold">Login to start tracking today&apos;s tasks.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your completed tasks will save to Supabase and update the contribution graph.</p>
        </Card>
      ) : null}

      {!isSupabaseConfigured ? (
        <div className="rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary backdrop-blur-md">
          Local mode is active. Add Supabase keys to enable signup, login, and database persistence.
        </div>
      ) : null}

      {!requiresLogin ? (
      <section className="grid gap-6">
        <Card className="bg-card/35 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Today&apos;s Tasks</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {completedToday} / {todaysTasks.length} completed
              </p>
            </div>
            <AddTaskForm onAdd={addTask} />
          </div>

          <div className="mt-5 space-y-2">
            {todaysTasks.length ? (
              todaysTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-md border border-border/70 bg-background/35 px-3 py-2 backdrop-blur-md transition-colors hover:bg-muted/45">
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    className={`flex size-5 items-center justify-center rounded border text-xs ${
                      task.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-transparent"
                    }`}
                    aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                  >
                    <Check className="size-3" />
                  </button>
                  <span className={task.completed ? "flex-1 text-sm text-muted-foreground line-through" : "flex-1 text-sm"}>{task.title}</span>
                  <button
                    type="button"
                    onClick={() => deleteTask(task)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Delete task"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-border/80 bg-background/20 px-3 py-6 text-center text-sm text-muted-foreground backdrop-blur-md">
                No tasks yet. Add one to start today&apos;s graph.
              </p>
            )}
          </div>
        </Card>

        <Card className="bg-card/35 p-5 backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Contributions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Completed tasks over the last year.</p>
            </div>
            <span className="text-xs text-muted-foreground">Last 365 days</span>
          </div>

          <ContributionGraph tasks={tasks} selectedDate={selectedDate} onSelect={setSelectedDate} />

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-medium">
              {formatReadableDate(selectedDate)}: {selectedCompletedCount} {selectedCompletedCount === 1 ? "task" : "tasks"} completed
            </p>
            {selectedTasks.length ? (
              <div className="mt-3 space-y-2">
                {selectedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/35 px-3 py-2 backdrop-blur-md">
                    <span className={task.completed ? "text-sm text-muted-foreground line-through" : "text-sm"}>{task.title}</span>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{task.completed ? "Done" : "Open"}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      </section>
      ) : null}
      </main>
    </>
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
    <Card className="w-full bg-card/35 p-3 backdrop-blur-xl sm:w-80">
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

function AddTaskForm({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState("");

  return (
    <form
      className="mt-3 flex gap-2 sm:mt-0"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd(title);
        setTitle("");
      }}
    >
      <Input className="min-w-0 sm:w-64" placeholder="Add task" value={title} onChange={(event) => setTitle(event.target.value)} />
      <Button type="submit">
        <Plus className="size-4" />
        Add
      </Button>
    </form>
  );
}

function ContributionGraph({ tasks, selectedDate, onSelect }: { tasks: Task[]; selectedDate: string; onSelect: (date: string) => void }) {
  const byDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const dates = getDateRange(365);
  const weeks = Array.from({ length: Math.ceil(dates.length / 7) }, (_, index) => dates.slice(index * 7, index * 7 + 7));
  const weekLabels = weeks.map((week, index) => {
    const firstDay = week[0];
    const previousFirstDay = weeks[index - 1]?.[0];
    const month = new Date(`${firstDay}T00:00:00`).getMonth();
    const previousMonth = previousFirstDay ? new Date(`${previousFirstDay}T00:00:00`).getMonth() : null;

    return index === 0 || month !== previousMonth ? new Date(`${firstDay}T00:00:00`).toLocaleString("en", { month: "short" }) : "";
  });

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-max">
        <div className="mb-1 ml-8 flex gap-1">
          {weekLabels.map((label, index) => (
            <div key={`${label}-${index}`} className="w-3 text-[10px] leading-3 text-muted-foreground">
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="grid w-6 grid-rows-7 gap-1 text-[10px] leading-3 text-muted-foreground">
            <span />
            <span>Mon</span>
            <span />
            <span>Wed</span>
            <span />
            <span>Fri</span>
            <span />
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {dates.map((date) => {
              const completed = byDate[date]?.filter((task) => task.completed).length ?? 0;
              return (
                <button
                  key={date}
                  type="button"
                  title={`${formatReadableDate(date)}: ${completed} ${completed === 1 ? "task" : "tasks"} completed`}
                  onClick={() => onSelect(date)}
                  className={`size-3 rounded-sm border ${heatClass(completed)} ${
                    selectedDate === date ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                  }`}
                  aria-label={`${formatReadableDate(date)}: ${completed} tasks completed`}
                />
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 3, 5, 8].map((count) => (
            <span key={count} className={`size-3 rounded-sm border ${heatClass(count)}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function heatClass(completed: number) {
  if (completed === 0) return "border-border bg-muted";
  if (completed <= 2) return "border-green-200/80 bg-green-200";
  if (completed <= 4) return "border-green-400/80 bg-green-400";
  if (completed <= 7) return "border-green-600/80 bg-green-600";
  return "border-green-800/80 bg-green-800";
}

function formatReadableDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function tabClass(active: boolean) {
  return `rounded px-2 py-1 text-sm ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`;
}
