export const CATEGORIES = [
  "Learning",
  "Interview Prep",
  "Applications",
  "Outreach",
  "Project Work",
  "DSA",
  "Other"
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string;
  status: "active" | "paused" | "completed";
};

export type Activity = {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description: string | null;
  category: Category;
  activity_date: string;
  created_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  category: Category;
  task_date: string;
  completed: boolean;
  created_at: string;
};

export type DailyNote = {
  id: string;
  user_id: string;
  date: string;
  note: string;
};
