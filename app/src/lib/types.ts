export type Frequency =
  | "once"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "trimonthly"
  | "yearly";

export type Task = {
  id: string;
  title: string;
  tags: string[];
  frequency: Frequency;
  createdAt: number;
  deadline?: number | null;
  count?: number;
};

/** A task decorated with values derived from today's completions. */
export type TaskView = Task & {
  done: boolean;
  progress: number;
};

/** Something that happens every day, independent of any deadline. */
export type Habit = {
  id: string;
  title: string;
  tags: string[];
  createdAt: number;
  /** Completions needed per day. Defaults to 1. */
  count?: number;
};

export type HabitView = Habit & {
  done: boolean;
  progress: number;
};

export type ItemKind = "task" | "habit";

/**
 * How a finished day scored. Tasks never affect the score, only the habits
 * that existed by the end of the day do:
 * - complete: every expected habit was finished
 * - missed: at least one expected habit was left undone
 * - frozen: missed, but a streak freeze was spent to keep the run alive
 * - idle: nothing habit-tracked happened that day (tasks only or empty)
 */
export type DayStatus = "complete" | "missed" | "frozen" | "idle";

/**
 * A finished day, snapshotted when it ended. Titles are copied in so editing or
 * deleting an item later cannot rewrite what history says happened.
 */
export type DayRecord = {
  /** Local midnight stamp of the day. */
  day: number;
  status: DayStatus;
  items: {
    kind: ItemKind;
    id: string;
    title: string;
    tags: string[];
    done: boolean;
  }[];
};

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "trimonthly", label: "Trimonthly" },
  { value: "yearly", label: "Yearly" },
];
