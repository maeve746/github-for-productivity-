import { addDays, formatDate } from "@/lib/utils";
import type { Activity, DailyNote, Goal, Task } from "@/lib/types";

const userId = "demo-user";
const goalId = "demo-goal";
const today = new Date();

const categoryRotation = [
  "Learning",
  "Interview Prep",
  "Applications",
  "Outreach",
  "Project Work",
  "DSA"
] as const;

export const demoGoal: Goal = {
  id: goalId,
  user_id: userId,
  title: "Get an internship or job",
  description: "Build momentum through daily applications, interview prep, projects, and learning.",
  start_date: formatDate(addDays(today, -44)),
  status: "active"
};

export const demoActivities: Activity[] = Array.from({ length: 45 }).flatMap((_, index) => {
  const date = formatDate(addDays(today, index - 44));
  const count = index % 9 === 0 ? 0 : (index % 5) + 1;

  return Array.from({ length: count }).map((__, activityIndex) => {
    const category = categoryRotation[(index + activityIndex) % categoryRotation.length];
    return {
      id: `activity-${index}-${activityIndex}`,
      user_id: userId,
      goal_id: goalId,
      title:
        category === "Applications"
          ? `Applied to ${activityIndex + 2} roles`
          : category === "Outreach"
            ? "Sent focused outreach messages"
            : category === "DSA"
              ? "Solved DSA practice set"
              : `${category} session`,
      description:
        category === "Learning"
          ? "Worked through notes and summarized the key ideas."
          : "Small, trackable progress toward the main goal.",
      category,
      activity_date: date,
      created_at: `${date}T10:00:00.000Z`
    };
  });
});

export const demoTasks: Task[] = [
  "Review behavioral answers",
  "Apply to 3 roles",
  "Send 5 outreach notes",
  "Ship portfolio update",
  "Study LLM evaluation notes",
  "Solve 2 DSA problems",
  "Plan tomorrow"
].map((title, index) => ({
  id: `task-${index}`,
  user_id: userId,
  title,
  category: categoryRotation[index % categoryRotation.length],
  task_date: formatDate(today),
  completed: index < 4,
  created_at: `${formatDate(today)}T08:00:00.000Z`
}));

export const demoNotes: DailyNote[] = [
  {
    id: "note-today",
    user_id: userId,
    date: formatDate(today),
    note: "Studied transformers, applied to startups, and cleaned up the resume project section."
  }
];
