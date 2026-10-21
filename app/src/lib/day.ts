/**
 * Pure rules for what a day expects and how a streak grows. Kept free of store
 * and database imports so the calendar logic can be exercised directly.
 */

import { DAY, progressOn, startOfToday } from "@/lib/progress";
import type {
  DayRecord,
  DayStatus,
  Habit,
  ItemKind,
  Task,
} from "@/lib/types";

/** One thing expected on a given day. */
export type Expected = {
  kind: ItemKind;
  id: string;
  count: number;
};

/**
 * Habits that existed by the end of the day. Habits created after the day ended
 * don't count towards it, so adding one today can't retroactively mark every
 * past day incomplete. History and the streak are tracked for habits alone, so
 * this is what finished-day snapshots and day status are built from.
 */
export function expectedHabitsOn(habits: Habit[], day: number): Expected[] {
  const end = day + DAY - 1;
  const expected: Expected[] = [];
  for (const habit of habits) {
    if (habit.createdAt > end) continue;
    expected.push({ kind: "habit", id: habit.id, count: habit.count ?? 1 });
  }
  return expected;
}

/**
 * Everything a day might show, used only to compute live per-item progress for
 * the day list. Habits plus tasks whose deadline lands on the day.
 */
export function expectedOn(
  tasks: Task[],
  habits: Habit[],
  day: number
): Expected[] {
  const end = day + DAY - 1;
  const expected = expectedHabitsOn(habits, day);

  for (const task of tasks) {
    if (task.deadline == null) continue;
    // A task belongs to its deadline day only, not to every day after it.
    if (task.deadline < day || task.deadline > end) continue;
    if (task.createdAt > end) continue;
    expected.push({ kind: "task", id: task.id, count: task.count ?? 1 });
  }

  return expected;
}

/**
 * A day is complete only when every habit expected on it got done. Tasks don't
 * count: they are day-listed items, not part of the tracked habit history. A
 * day with no habits is neither complete nor missed, so it returns null and
 * gets skipped instead of padding the streak.
 */
export function dayStatus(
  habits: Habit[],
  progress: Record<string, number>,
  day: number
): DayStatus | null {
  const expected = expectedHabitsOn(habits, day);
  if (!expected.length) return null;
  return expected.every((item) => (progress[item.id] ?? 0) >= item.count)
    ? "complete"
    : "missed";
}

/**
 * Consecutive complete days, counting back from today. Today counts as soon as
 * it is finished; until then the run is measured from yesterday, so an
 * unfinished today never hides an existing streak. Days with nothing expected
 * are skipped rather than treated as failures, and the walk stops at the oldest
 * record because nothing older can exist.
 */
export function streakFrom(
  habits: Habit[],
  progress: Record<string, number>,
  records: DayRecord[]
): number {
  const today = startOfToday();
  const byDay = new Map(records.map((record) => [record.day, record]));

  let streak = 0;
  if (dayStatus(habits, progress, today) === "complete") streak++;

  let oldest = Infinity;
  for (const record of records) {
    if (record.day < oldest) oldest = record.day;
  }

  for (
    let day = today - DAY, steps = 0;
    day >= oldest && steps < streakFrom.MAX_SCAN;
    day -= DAY, steps++
  ) {
    const record = byDay.get(day);
    // Nothing was expected that day, so it can't break the run.
    if (!record) continue;
    // A frozen day was missed but paid for with a streak freeze: it keeps
    // the run alive without counting as a completed day.
    if (record.status === "frozen") {
      streak++;
      continue;
    }
    if (record.status === "missed") break;
    // Idle days (tasks only, nothing habit-tracked) are transparent.
    if (record.status !== "complete") continue;
    streak++;
  }

  return streak;
}
/** Hard cap on how far back the walk goes, independent of streak length. */
streakFrom.MAX_SCAN = 3650;

/**
 * Day progress per item, used to render counts like 3/8 without rescanning the
 * log for every row.
 */
export function progressMap(
  tasks: Task[],
  habits: Habit[],
  completions: Record<string, number[]>,
  day = startOfToday()
) {
  const progress: Record<string, number> = {};
  for (const item of expectedOn(tasks, habits, day)) {
    progress[item.id] = progressOn(completions, item.id, day);
  }
  return progress;
}

/**
 * Items expected today that are not finished. Surfaced on the main screen so a
 * day can't slip past unnoticed while a deadline quietly moves into the past.
 */
export function dueToday(
  tasks: Task[],
  habits: Habit[],
  progress: Record<string, number>
) {
  const today = startOfToday();
  const items: Expected[] = [];
  for (const item of expectedOn(tasks, habits, today)) {
    if ((progress[item.id] ?? 0) < item.count) items.push(item);
  }
  return items;
}