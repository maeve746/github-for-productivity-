import { addDays, daysBetween, formatDate } from "@/lib/utils";
import type { Activity, Goal, Task } from "@/lib/types";

export function getDateRange(days: number, endDate = new Date()) {
  return Array.from({ length: days }, (_, index) => formatDate(addDays(endDate, index - days + 1)));
}

export function groupActivitiesByDate(activities: Activity[]) {
  return activities.reduce<Record<string, Activity[]>>((acc, activity) => {
    acc[activity.activity_date] = acc[activity.activity_date] ?? [];
    acc[activity.activity_date].push(activity);
    return acc;
  }, {});
}

export function getCurrentStreak(activities: Activity[]) {
  const productiveDays = new Set(activities.map((activity) => activity.activity_date));
  let streak = 0;
  let cursor = new Date();

  while (productiveDays.has(formatDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getLongestStreak(activities: Activity[]) {
  const sortedDays = Array.from(new Set(activities.map((activity) => activity.activity_date))).sort();
  let longest = 0;
  let current = 0;
  let previous: string | null = null;

  for (const day of sortedDays) {
    const expectedPrevious = previous ? formatDate(addDays(new Date(`${day}T00:00:00`), -1)) : null;
    current = previous && expectedPrevious === previous ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = day;
  }

  return longest;
}

export function getWeeklyStats(activities: Activity[], tasks: Task[]) {
  const dates = getDateRange(7);
  const dateSet = new Set(dates);
  const weekActivities = activities.filter((activity) => dateSet.has(activity.activity_date));
  const weekTasks = tasks.filter((task) => dateSet.has(task.task_date));

  return {
    dates,
    totalActivities: weekActivities.length,
    tasksCompleted: weekTasks.filter((task) => task.completed).length,
    applications: weekActivities.filter((activity) => activity.category === "Applications").length,
    learning: weekActivities.filter((activity) => activity.category === "Learning").length,
    projects: weekActivities.filter((activity) => activity.category === "Project Work").length
  };
}

export function getGoalSummary(goal: Goal, activities: Activity[]) {
  return {
    daysActive: daysBetween(goal.start_date),
    totalActivities: activities.filter((activity) => activity.goal_id === goal.id).length
  };
}
