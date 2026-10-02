import { addDays, formatDate } from "@/lib/utils";
import type { Task } from "@/lib/types";

export function getDateRange(days: number, endDate = new Date()) {
  return Array.from({ length: days }, (_, index) => formatDate(addDays(endDate, index - days + 1)));
}

export function groupTasksByDate(tasks: Task[]) {
  return tasks.reduce<Record<string, Task[]>>((acc, task) => {
    acc[task.task_date] = acc[task.task_date] ?? [];
    acc[task.task_date].push(task);
    return acc;
  }, {});
}
