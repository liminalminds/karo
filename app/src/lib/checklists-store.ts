import { getDb } from "@/lib/db";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";

export type CheckItem = {
  id: string;
  text: string;
  done: boolean;
};

/**
 * A routine checklist: the same list run again and again, so the template is
 * kept while its checked-off state is disposable.
 */
export type Checklist = {
  id: string;
  name: string;
  items: CheckItem[];
};

type ChecklistRow = { id: string; name: string };
type ItemRow = { id: string; checklist_id: string; text: string; done: number };

function newId() {
  return Math.random().toString(36).slice(2);
}

const store = createStore<Checklist[]>({
  name: "checklists",
  initial: [],
  load: async () => {
    const db = getDb();
    const [checklistRows, itemRows] = await Promise.all([
      db.getAllAsync<ChecklistRow>("SELECT * FROM checklists ORDER BY rowid ASC"),
      db.getAllAsync<ItemRow>("SELECT * FROM checklist_items"),
    ]);
    const byChecklist = new Map<string, CheckItem[]>();
    for (const row of itemRows) {
      const items = byChecklist.get(row.checklist_id) ?? [];
      items.push({ id: row.id, text: row.text, done: row.done === 1 });
      byChecklist.set(row.checklist_id, items);
    }
    return checklistRows.map((row) => ({
      id: row.id,
      name: row.name,
      items: byChecklist.get(row.id) ?? [],
    }));
  },
  // Written per-mutation below; a full rewrite would cascade-delete children.
  persist: async () => {},
});

export function hydrateChecklists() {
  return store.hydrate();
}

export function useChecklists() {
  return useStore(store);
}

export function useChecklistsReady() {
  return useStoreReady(store);
}

export function getChecklist(id: string) {
  return store.getState().find((c) => c.id === id);
}

function mapChecklist(id: string, fn: (checklist: Checklist) => Checklist) {
  store.set((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
}

export function addChecklist(name: string) {
  const checklist: Checklist = { id: newId(), name, items: [] };
  store.set((prev) => [...prev, checklist]);
  void getDb().runAsync(
    "INSERT INTO checklists (id, name, runs) VALUES (?, ?, 0)",
    [checklist.id, checklist.name]
  );
}

export function deleteChecklist(id: string) {
  store.set((prev) => prev.filter((c) => c.id !== id));
  // ON DELETE CASCADE removes the checklist's items.
  void getDb().runAsync("DELETE FROM checklists WHERE id = ?", [id]);
}

export function addItem(checklistId: string, text: string) {
  const item: CheckItem = { id: newId(), text, done: false };
  mapChecklist(checklistId, (c) => ({ ...c, items: [...c.items, item] }));
  void getDb().runAsync(
    "INSERT INTO checklist_items (id, checklist_id, text, done) VALUES (?, ?, ?, 0)",
    [item.id, checklistId, item.text]
  );
}

export function toggleItem(checklistId: string, itemId: string) {
  const checklist = getChecklist(checklistId);
  const item = checklist?.items.find((i) => i.id === itemId);
  if (!item) return;
  const done = !item.done;
  mapChecklist(checklistId, (c) => ({
    ...c,
    items: c.items.map((i) => (i.id === itemId ? { ...i, done } : i)),
  }));
  void getDb().runAsync("UPDATE checklist_items SET done = ? WHERE id = ?", [
    done ? 1 : 0,
    itemId,
  ]);
}

export function deleteItem(checklistId: string, itemId: string) {
  mapChecklist(checklistId, (c) => ({
    ...c,
    items: c.items.filter((i) => i.id !== itemId),
  }));
  void getDb().runAsync("DELETE FROM checklist_items WHERE id = ?", [itemId]);
}

/**
 * Clears a run without touching the template, so the same list is ready for
 * its next pass.
 */
export function resetChecklist(id: string) {
  const checklist = getChecklist(id);
  if (!checklist) return;

  mapChecklist(id, (c) => ({
    ...c,
    items: c.items.map((item) => ({ ...item, done: false })),
  }));
  void getDb().runAsync(
    "UPDATE checklist_items SET done = 0 WHERE checklist_id = ?",
    [id]
  );
}
