import { getDb } from "@/lib/db";
import { newId } from "@/lib/id";
import { startOfToday } from "@/lib/progress";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";
import type { ItemKind } from "@/lib/types";

export type { Completions } from "@/lib/progress";

type TaskCompletionRow = {
  id: string;
  task_id: string;
  completed_at: number;
};

type HabitCompletionRow = {
  id: string;
  habit_id: string;
  completed_at: number;
};

const store = createStore<Record<string, number[]>>({
  name: "completions",
  initial: {},
  load: async () => {
    // Tasks and habits live in separate tables but share one in-memory log, so
    // day rules and history only ever read a single structure.
    const [taskRows, habitRows] = await Promise.all([
      getDb().getAllAsync<TaskCompletionRow>(
        "SELECT * FROM completions ORDER BY completed_at ASC"
      ),
      getDb().getAllAsync<HabitCompletionRow>(
        "SELECT * FROM habit_completions ORDER BY completed_at ASC"
      ),
    ]);
    const grouped: Record<string, number[]> = {};
    const add = (id: string, at: number) => {
      (grouped[id] ??= []).push(at);
    };
    for (const row of taskRows) add(row.task_id, row.completed_at);
    for (const row of habitRows) add(row.habit_id, row.completed_at);
    return grouped;
  },
  // Append-only; each mutation below writes only its own rows.
  persist: async () => {},
});

export function hydrateCompletions() {
  return store.hydrate();
}

export function useCompletions() {
  return useStore(store);
}

export function useCompletionsReady() {
  return useStoreReady(store);
}

export function getCompletions() {
  return store.getState();
}

function tableFor(kind: ItemKind) {
  return kind === "task"
    ? { table: "completions", column: "task_id" }
    : { table: "habit_completions", column: "habit_id" };
}

function logCompletion(kind: ItemKind, id: string, at: number) {
  const { table, column } = tableFor(kind);
  store.set((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), at] }));
  void getDb().runAsync(
    `INSERT INTO ${table} (id, ${column}, completed_at) VALUES (?, ?, ?)`,
    [newId(), id, at]
  );
}

/**
 * One tap adds a completion, or undoes today's progress once the item is
 * already finished, so the row can be tapped back and forth.
 */
export function toggleCompletion(
  id: string,
  count: number,
  kind: ItemKind
) {
  const since = startOfToday();
  const stamps = store.getState()[id] ?? [];
  const doneToday = stamps.filter((stamp) => stamp >= since).length;
  if (doneToday >= count) {
    clearCompletionsSince(id, since, kind);
    return;
  }
  logCompletion(kind, id, Date.now());
}

/** Undo: drops completions from `since` onward, keeping earlier days. */
export function clearCompletionsSince(
  id: string,
  since: number,
  kind: ItemKind
) {
  store.set((prev) => {
    const stamps = prev[id];
    if (!stamps) return prev;
    const kept = stamps.filter((stamp) => stamp < since);
    const next = { ...prev };
    if (kept.length) next[id] = kept;
    else delete next[id];
    return next;
  });
  const { table, column } = tableFor(kind);
  void getDb().runAsync(
    `DELETE FROM ${table} WHERE ${column} = ? AND completed_at >= ?`,
    [id, since]
  );
}

/** Removes every completion for a deleted item. */
export function dropCompletions(id: string, kind: ItemKind) {
  store.set((prev) => {
    if (!(id in prev)) return prev;
    const next = { ...prev };
    delete next[id];
    return next;
  });
  const { table, column } = tableFor(kind);
  void getDb().runAsync(`DELETE FROM ${table} WHERE ${column} = ?`, [id]);
}