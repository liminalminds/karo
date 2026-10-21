import { getDb } from "@/lib/db";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";

/** Simple persisted key/value settings. */
type Prefs = Record<string, string>;

const store = createStore<Prefs>({
  name: "prefs",
  initial: {},
  load: async () => {
    const rows = await getDb().getAllAsync<{ key: string; value: string }>(
      "SELECT * FROM prefs"
    );
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  },
  // Writes happen per-key below; nothing rewrites the table wholesale.
  persist: async () => {},
});

export function hydratePrefs() {
  return store.hydrate();
}

export function usePref(key: string) {
  const prefs = useStore(store);
  return prefs[key];
}

export function usePrefsReady() {
  return useStoreReady(store);
}

export function getPref(key: string) {
  return store.getState()[key];
}

export function setPref(key: string, value: string) {
  store.set((prev) => ({ ...prev, [key]: value }));
  void getDb().runAsync(
    "INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value]
  );
}

/** --- streak freezes ----------------------------------------------------- */

const FREEZES_KEY = "streak_freezes";

export const MAX_FREEZES = 2;

export function useFreezes() {
  return parseFreezes(usePref(FREEZES_KEY));
}

export function getFreezes() {
  return parseFreezes(getPref(FREEZES_KEY));
}

function parseFreezes(raw: string | undefined) {
  if (!raw) return 0;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? Math.min(2, Math.max(0, value)) : 0;
}

/** Grants a freeze unless the pocket already holds the max of two. */
export function grantFreeze() {
  const current = getFreezes();
  if (current >= 2) return false;
  setPref(FREEZES_KEY, String(current + 1));
  return true;
}

/** Spends a freeze to keep a streak alive; false when the pocket is empty. */
export function spendFreeze() {
  const current = getFreezes();
  if (current <= 0) return false;
  setPref(FREEZES_KEY, String(current - 1));
  return true;
}
