import { getDb } from "@/lib/db";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";

export type CheckItem = {
  id: string;
  text: string;
  done: boolean;
};

export type List = {
  id: string;
  name: string;
  items: CheckItem[];
};

type ListRow = { id: string; name: string };
type ItemRow = { id: string; list_id: string; text: string; done: number };

function newId() {
  return Math.random().toString(36).slice(2);
}

const store = createStore<List[]>({
  name: "lists",
  initial: [],
  load: async () => {
    const db = getDb();
    const [listRows, itemRows] = await Promise.all([
      db.getAllAsync<ListRow>("SELECT * FROM lists ORDER BY rowid ASC"),
      db.getAllAsync<ItemRow>("SELECT * FROM list_items"),
    ]);
    const byList = new Map<string, CheckItem[]>();
    for (const row of itemRows) {
      const items = byList.get(row.list_id) ?? [];
      items.push({ id: row.id, text: row.text, done: row.done === 1 });
      byList.set(row.list_id, items);
    }
    return listRows.map((row) => ({
      id: row.id,
      name: row.name,
      items: byList.get(row.id) ?? [],
    }));
  },
  // Written per-mutation below; a full rewrite would cascade-delete children.
  persist: async () => {},
});

export function hydrateLists() {
  return store.hydrate();
}

export function useLists() {
  return useStore(store);
}

export function useListsReady() {
  return useStoreReady(store);
}

export function getLists() {
  return store.getState();
}

export function getList(id: string) {
  return store.getState().find((l) => l.id === id);
}

function mapList(id: string, fn: (list: List) => List) {
  store.set((prev) => prev.map((l) => (l.id === id ? fn(l) : l)));
}

export function addList(name: string) {
  const list: List = { id: newId(), name, items: [] };
  store.set((prev) => [...prev, list]);
  void getDb().runAsync("INSERT INTO lists (id, name) VALUES (?, ?)", [
    list.id,
    list.name,
  ]);
}

export function deleteList(id: string) {
  store.set((prev) => prev.filter((l) => l.id !== id));
  // ON DELETE CASCADE removes the list's items.
  void getDb().runAsync("DELETE FROM lists WHERE id = ?", [id]);
}

export function addItem(listId: string, text: string) {
  const item: CheckItem = { id: newId(), text, done: false };
  mapList(listId, (l) => ({ ...l, items: [...l.items, item] }));
  void getDb().runAsync(
    "INSERT INTO list_items (id, list_id, text, done) VALUES (?, ?, ?, 0)",
    [item.id, listId, item.text]
  );
}

export function toggleItem(listId: string, itemId: string) {
  const list = getList(listId);
  const item = list?.items.find((i) => i.id === itemId);
  if (!item) return;
  const done = !item.done;
  mapList(listId, (l) => ({
    ...l,
    items: l.items.map((i) => (i.id === itemId ? { ...i, done } : i)),
  }));
  void getDb().runAsync("UPDATE list_items SET done = ? WHERE id = ?", [
    done ? 1 : 0,
    itemId,
  ]);
}

export function deleteItem(listId: string, itemId: string) {
  mapList(listId, (l) => ({
    ...l,
    items: l.items.filter((i) => i.id !== itemId),
  }));
  void getDb().runAsync("DELETE FROM list_items WHERE id = ?", [itemId]);
}
