import { getDb } from "@/lib/db";
import {
  dropCompletions,
  getCompletions,
  toggleCompletion,
} from "@/lib/completions-store";
import { newId } from "@/lib/id";
import { refreshFinishedDays } from "@/lib/day-store";
import { startOfToday } from "@/lib/progress";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";
import type { Frequency, Task } from "@/lib/types";

type TaskRow = {
  id: string;
  title: string;
  tags: string;
  frequency: string;
  count: number;
  deadline: number | null;
  created_at: number;
};

const tasksStore = createStore<Task[]>({
  name: "tasks",
  initial: [],
  load: async () => {
    const rows = await getDb().getAllAsync<TaskRow>(
      // rowid breaks ties: Date.now() collides for tasks added in the same
      // millisecond, which would otherwise reshuffle order on reload.
      "SELECT * FROM tasks ORDER BY created_at DESC, rowid DESC"
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      tags: JSON.parse(row.tags) as string[],
      frequency: row.frequency as Frequency,
      count: row.count,
      createdAt: row.created_at,
      deadline: row.deadline,
    }));
  },
  // Rows are written per-mutation below. Rewriting the whole table here would
  // cascade through ON DELETE CASCADE and wipe the completions table.
  persist: async () => {},
});

export function hydrateTasks() {
  return tasksStore.hydrate();
}

export function useTasks() {
  return useStore(tasksStore);
}

export function useTasksReady() {
  return useStoreReady(tasksStore);
}

export function getTasks() {
  return tasksStore.getState();
}

export function addTask(
  title: string,
  tags: string[],
  frequency: Frequency,
  deadline: number | null,
  count: number
) {
  const task: Task = {
    id: newId(),
    title,
    tags,
    frequency,
    count,
    createdAt: Date.now(),
    deadline,
  };
  tasksStore.set((prev) => [task, ...prev]);
  void getDb().runAsync(
    `INSERT INTO tasks (id, title, tags, frequency, count, deadline, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.title,
      JSON.stringify(task.tags),
      task.frequency,
      count,
      deadline,
      task.createdAt,
    ]
  );
  refreshFinishedDays();
}

export function updateTask(
  id: string,
  title: string,
  tags: string[],
  frequency: Frequency,
  deadline: number | null,
  count: number
) {
  tasksStore.set((prev) =>
    prev.map((t) =>
      t.id === id ? { ...t, title, tags, frequency, deadline, count } : t
    )
  );
  void getDb().runAsync(
    "UPDATE tasks SET title = ?, tags = ?, frequency = ?, deadline = ?, count = ? WHERE id = ?",
    [title, JSON.stringify(tags), frequency, deadline, count, id]
  );
  refreshFinishedDays();
}

/** Appends a completion, or clears today's if the task is already done. */
export function bumpTask(id: string) {
  const task = tasksStore.getState().find((t) => t.id === id);
  if (!task) return;
  toggleCompletion(id, task.count ?? 1, "task");
}

export function deleteTask(id: string) {
  tasksStore.set((prev) => prev.filter((t) => t.id !== id));
  dropCompletions(id, "task");
  // ON DELETE CASCADE takes the task's completions with it.
  void getDb().runAsync("DELETE FROM tasks WHERE id = ?", [id]);
  refreshFinishedDays();
}

/**
 * Day rollover cleanup: a checked once-task leaves with the day it was
 * finished on. Any completion stamped before today's midnight marks a task that
 * was checked in a day that is over, and it gets deleted outright — the todo
 * list starts every morning at zero. Recurring tasks survive the purge, since
 * their periods are still ahead of them.
 */
export function purgeCheckedOnceTasks() {
  const today = startOfToday();
  const completions = getCompletions();
  const victims = tasksStore.getState().filter((task) => {
    if (task.frequency !== "once") return false;
    const stamps = completions[task.id] ?? [];
    return stamps.some((stamp) => stamp < today);
  });
  if (!victims.length) return;

  const victimIds = victims.map((v) => v.id);
  tasksStore.set((prev) =>
    prev.filter((t) => !victimIds.includes(t.id))
  );
  const db = getDb();
  for (const task of victims) {
    // Completions leave the in-memory log too; the task row itself goes with
    // one statement, taking its completion rows via cascade.
    void dropCompletions(task.id, "task");
  }
  void db.runAsync(
    `DELETE FROM tasks WHERE id IN (${victimIds.map(() => "?").join(", ")})`,
    victimIds
  );
}

function rewriteTags(
  pick: (task: Task) => string[] | null,
  sql: (id: string, tags: string[]) => void
) {
  const changes = tasksStore
    .getState()
    .map((task) => ({ task, tags: pick(task) }))
    .filter((c): c is { task: Task; tags: string[] } => c.tags !== null)
    .map(({ task, tags }) => ({ id: task.id, tags }));
  if (!changes.length) return;
  tasksStore.set((prev) =>
    prev.map((task) => {
      const change = changes.find((c) => c.id === task.id);
      return change ? { ...task, tags: change.tags } : task;
    })
  );
  for (const { id, tags } of changes) sql(id, tags);
}

function updateTagsSql(id: string, tags: string[]) {
  void getDb().runAsync("UPDATE tasks SET tags = ? WHERE id = ?", [
    JSON.stringify(tags),
    id,
  ]);
}

export function retagTasks(oldTag: string, newTag: string) {
  rewriteTags(
    (task) =>
      task.tags.includes(oldTag)
        ? [...new Set(task.tags.map((g) => (g === oldTag ? newTag : g)))]
        : null,
    updateTagsSql
  );
}

export function removeTagFromTasks(tag: string) {
  rewriteTags(
    (task) =>
      task.tags.includes(tag) ? task.tags.filter((g) => g !== tag) : null,
    updateTagsSql
  );
}
