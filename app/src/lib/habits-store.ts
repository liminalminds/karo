import { getDb } from "@/lib/db";
import { newId } from "@/lib/id";
import { dropCompletions, toggleCompletion } from "@/lib/completions-store";
import { refreshFinishedDays } from "@/lib/day-store";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";
import type { Habit } from "@/lib/types";

type HabitRow = {
  id: string;
  title: string;
  tags: string;
  count: number;
  created_at: number;
};

const habitsStore = createStore<Habit[]>({
  name: "habits",
  initial: [],
  load: async () => {
    const rows = await getDb().getAllAsync<HabitRow>(
      // rowid breaks ties when two habits land in the same millisecond.
      "SELECT * FROM habits ORDER BY created_at DESC, rowid DESC"
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      tags: JSON.parse(row.tags) as string[],
      count: row.count,
      createdAt: row.created_at,
    }));
  },
  // Rows are written per-mutation below, so rewriting the table is not needed.
  persist: async () => {},
});

export function hydrateHabits() {
  return habitsStore.hydrate();
}

export function useHabits() {
  return useStore(habitsStore);
}

export function useHabitsReady() {
  return useStoreReady(habitsStore);
}

export function getHabits() {
  return habitsStore.getState();
}

export function addHabit(title: string, tags: string[], count: number) {
  const habit: Habit = {
    id: newId(),
    title,
    tags,
    count,
    createdAt: Date.now(),
  };
  habitsStore.set((prev) => [habit, ...prev]);
  void getDb().runAsync(
    "INSERT INTO habits (id, title, tags, count, created_at) VALUES (?, ?, ?, ?, ?)",
    [habit.id, habit.title, JSON.stringify(habit.tags), count, habit.createdAt]
  );
  refreshFinishedDays();
}

export function updateHabit(id: string, title: string, tags: string[], count: number) {
  habitsStore.set((prev) =>
    prev.map((h) => (h.id === id ? { ...h, title, tags, count } : h))
  );
  void getDb().runAsync(
    "UPDATE habits SET title = ?, tags = ?, count = ? WHERE id = ?",
    [title, JSON.stringify(tags), count, id]
  );
  refreshFinishedDays();
}

/** Taps a habit once per needed count, or undo once it is complete. */
export function bumpHabit(id: string) {
  const habit = habitsStore.getState().find((h) => h.id === id);
  if (!habit) return;
  toggleCompletion(id, habit.count ?? 1, "habit");
}

export function deleteHabit(id: string) {
  habitsStore.set((prev) => prev.filter((h) => h.id !== id));
  dropCompletions(id, "habit");
  // ON DELETE CASCADE takes the habit's completions with it.
  void getDb().runAsync("DELETE FROM habits WHERE id = ?", [id]);
  refreshFinishedDays();
}

function rewriteTags(
  pick: (habit: Habit) => string[] | null,
  sql: (id: string, tags: string[]) => void
) {
  const changes = habitsStore
    .getState()
    .map((habit) => ({ habit, tags: pick(habit) }))
    .filter((c): c is { habit: Habit; tags: string[] } => c.tags !== null)
    .map(({ habit, tags }) => ({ id: habit.id, tags }));
  if (!changes.length) return;
  habitsStore.set((prev) =>
    prev.map((habit) => {
      const change = changes.find((c) => c.id === habit.id);
      return change ? { ...habit, tags: change.tags } : habit;
    })
  );
  for (const { id, tags } of changes) sql(id, tags);
}

function updateTagsSql(id: string, tags: string[]) {
  void getDb().runAsync("UPDATE habits SET tags = ? WHERE id = ?", [
    JSON.stringify(tags),
    id,
  ]);
}

export function retagHabits(oldTag: string, newTag: string) {
  rewriteTags(
    (habit) =>
      habit.tags.includes(oldTag)
        ? [...new Set(habit.tags.map((g) => (g === oldTag ? newTag : g)))]
        : null,
    updateTagsSql
  );
}

export function removeTagFromHabits(tag: string) {
  rewriteTags(
    (habit) =>
      habit.tags.includes(tag) ? habit.tags.filter((g) => g !== tag) : null,
    updateTagsSql
  );
}