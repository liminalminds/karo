/**
 * Pure derivations over the completion log. Kept free of store and database
 * imports so the rules can be exercised directly.
 */

export const DAY = 86400000;

/** itemId -> ascending completion timestamps. Tasks and habits share one log. */
export type Completions = Record<string, number[]>;

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfDay(stamp: number) {
  const d = new Date(stamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Completions for an item since local midnight, so progress resets daily. */
export function progressToday(
  completions: Completions,
  itemId: string,
  since = startOfToday()
) {
  const stamps = completions[itemId];
  if (!stamps) return 0;
  let n = 0;
  for (const stamp of stamps) if (stamp >= since) n++;
  return n;
}

/**
 * Completions for one specific calendar day, so past days can be scored from
 * the same log that drives today.
 */
export function progressOn(
  completions: Completions,
  itemId: string,
  day: number
) {
  const from = startOfDay(day);
  const until = from + DAY;
  const stamps = completions[itemId];
  if (!stamps) return 0;
  let n = 0;
  for (const stamp of stamps) if (stamp >= from && stamp < until) n++;
  return n;
}

export function isDoneToday(
  completions: Completions,
  item: { id: string; count?: number }
) {
  return progressToday(completions, item.id) >= (item.count ?? 1);
}