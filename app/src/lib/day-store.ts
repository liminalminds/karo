import { getDb } from "@/lib/db";
import { expectedHabitsOn, expectedOn } from "@/lib/day";
import { DAY, progressOn, startOfToday } from "@/lib/progress";
import { grantFreeze, spendFreeze } from "@/lib/prefs-store";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";
import type { DayRecord, DayStatus, Habit, Task } from "@/lib/types";

type RecordRow = {
  day: number;
  status: string;
};

type RecordItemRow = {
  day: number;
  kind: string;
  item_id: string;
  title: string;
  tags: string;
  done: number;
};

const recordsStore = createStore<DayRecord[]>({
  name: "day-records",
  initial: [],
  load: async () => {
    const [recordRows, itemRows] = await Promise.all([
      getDb().getAllAsync<RecordRow>(
        "SELECT day, status FROM day_records ORDER BY day DESC"
      ),
      getDb().getAllAsync<RecordItemRow>(
        "SELECT * FROM day_record_items ORDER BY day DESC"
      ),
    ]);
    const itemsByDay = new Map<number, DayRecord["items"]>();
    for (const row of itemRows) {
      const items = itemsByDay.get(row.day) ?? [];
      items.push({
        kind: row.kind === "habit" ? "habit" : "task",
        id: row.item_id,
        title: row.title,
        tags: JSON.parse(row.tags) as string[],
        done: row.done === 1,
      });
      itemsByDay.set(row.day, items);
    }
    return recordRows.map((row) => ({
      day: row.day,
      status:
        row.status === "complete" ||
        row.status === "frozen" ||
        row.status === "idle"
          ? row.status
          : "missed",
      items: itemsByDay.get(row.day) ?? [],
    }));
  },
  // Records are written per-day below; the table is never rewritten wholesale.
  persist: async () => {},
});

export function hydrateDayRecords() {
  return recordsStore.hydrate();
}

export function useDayRecords() {
  return useStore(recordsStore);
}

export function useDayRecordsReady() {
  return useStoreReady(recordsStore);
}

export function getDayRecords() {
  return recordsStore.getState();
}

/** Longest run of past days worth scanning before giving up. */
const MAX_LOOKBACK = 400;

async function writeRecord(record: DayRecord) {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "INSERT OR REPLACE INTO day_records (day, status, recorded_at) VALUES (?, ?, ?)",
      [record.day, record.status, Date.now()]
    );
    // Replacing a day rewrites its item list so a re-run can't leave stale rows.
    await db.runAsync("DELETE FROM day_record_items WHERE day = ?", [record.day]);
    for (const item of record.items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO day_record_items
           (day, kind, item_id, title, tags, done)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          record.day,
          item.kind,
          item.id,
          item.title,
          JSON.stringify(item.tags),
          item.done ? 1 : 0,
        ]
      );
    }
  });
}

/**
 * Builds the snapshot for a single day from current state. Habits decide the
 * status; tasks are recorded for the day detail view only — deadline tasks
 * that day, plus undated ones that were completed that day (a task deleted at
 * the next midnight still leaves its trace here).
 */
function buildRecord(
  tasks: Task[],
  habits: Habit[],
  completions: Record<string, number[]>,
  day: number
): DayRecord {
  const titles = new Map<string, { title: string; tags: string[] }>();
  for (const habit of habits) titles.set(`h:${habit.id}`, habit);
  for (const task of tasks) titles.set(`t:${task.id}`, task);

  const items: DayRecord["items"] = [];
  const habitCount = expectedHabitsOn(habits, day).length;

  for (const expected of expectedOn(tasks, habits, day)) {
    const source = titles.get(
      `${expected.kind === "habit" ? "h" : "t"}:${expected.id}`
    );
    items.push({
      kind: expected.kind,
      id: expected.id,
      title: source?.title ?? "Deleted item",
      tags: source?.tags ?? [],
      done: progressOn(completions, expected.id, day) >= expected.count,
    });
  }

  for (const task of tasks) {
    if (task.deadline != null) continue;
    // Undated tasks belong to no day; only a completion puts them on one, so
    // they appear exactly once — on the day they got finished.
    if (progressOn(completions, task.id, day) < (task.count ?? 1)) continue;
    items.push({
      kind: "task",
      id: task.id,
      title: task.title,
      tags: task.tags,
      done: true,
    });
  }

  const habitItems = items.filter((item) => item.kind === "habit");
  const status: DayStatus =
    habitCount === 0
      ? "idle"
      : habitItems.every((item) => item.done)
        ? "complete"
        : "missed";
  return { day, status, items };
}

/** Serializes record writes: overlapping transactions would fail to start. */
let writeQueue: Promise<void> = Promise.resolve();

function queueRecord(record: DayRecord) {
  writeQueue = writeQueue
    .then(() => writeRecord(record))
    .catch((error) => {
      console.error("[day-records] failed to persist", error);
    });
}

/**
 * How many consecutive completed days sit immediately before `day`? Frozen
 * days count as keeping the run alive; a gap stops the walk, as does any
 * missed day.
 */
function streakEndingAt(
  day: number,
  lookup: Map<number, DayRecord>,
  habits: Habit[]
): number {
  let streak = 0;
  for (let d = day - DAY, steps = 0; steps < MAX_LOOKBACK; d -= DAY, steps++) {
    const record = lookup.get(d);
    if (!record) {
      // No snapshot there: walk on through days nothing was expected,
      // otherwise the run before this day can't be verified.
      if (!expectedHabitsOn(habits, d).length) continue;
      break;
    }
    if (record.status === "complete" || record.status === "frozen") {
      streak++;
      continue;
    }
    break;
  }
  return streak;
}

/**
 * Closes out every past day that had items but no snapshot yet. Called
 * after item edits and on launch, so gaps left by a closed app get closed the
 * next time it opens. Days already recorded are never touched again, which is
 * what keeps later renames or deletions from rewriting history.
 *
 * This is also where streak freezes settle: a completed day grants one (up to
 * two), and a missed day that landed inside a running streak spends one to
 * score as frozen instead.
 */
export function finalizeFinishedDays(
  tasks: Task[],
  habits: Habit[],
  completions: Record<string, number[]>
) {
  const today = startOfToday();
  const known = new Set(recordsStore.getState().map((r) => r.day));
  const lookup = new Map(
    recordsStore.getState().map((r) => [r.day, r] as const)
  );
  const fresh: DayRecord[] = [];

  for (let i = 1; i <= MAX_LOOKBACK; i++) {
    const day = today - i * DAY;
    if (known.has(day)) break;
    const record = buildRecord(tasks, habits, completions, day);
    // Nothing tracked that day: no snapshot, no streak impact, no freeze.
    if (record.status === "idle") continue;

    if (record.status === "missed" && streakEndingAt(day, lookup, habits) > 0) {
      if (spendFreeze()) record.status = "frozen";
    }
    if (record.status === "complete") grantFreeze();

    lookup.set(day, record);
    known.add(day);
    fresh.push(record);
  }

  if (!fresh.length) return;
  recordsStore.set((prev) => [...fresh, ...prev].sort((a, b) => b.day - a.day));
  for (const record of fresh) queueRecord(record);
}

/** Snapshots one day from live state; used for today's calendar detail. */
export function buildDayRecord(
  tasks: Task[],
  habits: Habit[],
  completions: Record<string, number[]>,
  day: number
): DayRecord {
  return buildRecord(tasks, habits, completions, day);
}

type DaySources = {
  tasks: Task[];
  habits: Habit[];
  completions: Record<string, number[]>;
};

// Registered by the root layout so the item stores can refresh history without
// importing each other.
let sources: (() => DaySources) | null = null;

export function registerDaySources(read: () => DaySources) {
  sources = read;
}

/** Re-scores any past day that gained, lost, or moved a habit. */
export function refreshFinishedDays() {
  if (!sources) return;
  const { tasks, habits, completions } = sources();
  finalizeFinishedDays(tasks, habits, completions);
}