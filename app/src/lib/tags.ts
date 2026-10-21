import { getDb } from "@/lib/db";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";

const PALETTE = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#4ade80",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#f472b6",
];

/** tag name -> chosen colour. Absent means use the default hash colour. */
type TagColors = Record<string, string>;

type TagRow = { name: string; color: string | null };

const store = createStore<TagColors>({
  name: "tags",
  initial: {},
  load: async () => {
    const rows = await getDb().getAllAsync<TagRow>(
      "SELECT * FROM tags WHERE color IS NOT NULL"
    );
    return Object.fromEntries(rows.map((r) => [r.name, r.color as string]));
  },
  persist: async () => {},
});

export function hydrateTags() {
  return store.hydrate();
}

export function useTagColors() {
  return useStore(store);
}

export function useTagsReady() {
  return useStoreReady(store);
}

export function defaultTagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function tagColor(tag: string, overrides: TagColors = store.getState()) {
  return overrides[tag] ?? defaultTagColor(tag);
}

/**
 * Registers a tag with a stable colour, without touching an existing choice.
 * Every place that can put a tag on an item calls this instead of assigning a
 * colour, so re-adding a tag never resets a colour picked in the manager.
 */
export function ensureTag(tag: string) {
  if (store.getState()[tag]) return;
  setTagColor(tag, defaultTagColor(tag));
}

/**
 * Stores a colour. The row always exists once a tag has a colour, so the
 * colour is read from the store from then on — never recomputed from the name.
 */
export function setTagColor(tag: string, color: string) {
  store.set((prev) => ({ ...prev, [tag]: color }));
  void getDb().runAsync(
    "INSERT INTO tags (name, color) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET color = excluded.color",
    [tag, color]
  );
}

export function renameTagColor(oldTag: string, newTag: string) {
  const color = store.getState()[oldTag];
  store.set((prev) => {
    const next = { ...prev };
    delete next[oldTag];
    if (color) next[newTag] = color;
    return next;
  });
  void getDb().runAsync("DELETE FROM tags WHERE name = ?", [oldTag]);
  if (color) {
    void getDb().runAsync(
      "INSERT INTO tags (name, color) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET color = excluded.color",
      [newTag, color]
    );
  }
}

export function deleteTagColor(tag: string) {
  store.set((prev) => {
    if (!(tag in prev)) return prev;
    const next = { ...prev };
    delete next[tag];
    return next;
  });
  void getDb().runAsync("DELETE FROM tags WHERE name = ?", [tag]);
}

/** Steps a tag to the next palette entry. */
export function cycleTagColor(tag: string) {
  const current = tagColor(tag);
  const idx = PALETTE.indexOf(current);
  setTagColor(tag, PALETTE[(idx + 1) % PALETTE.length]);
}
