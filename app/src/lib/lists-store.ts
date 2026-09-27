import { useEffect, useState } from "react";

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

let lists: List[] = [];

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeLists(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Force re-render whenever the store changes. */
export function useLists() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const unsub = subscribeLists(() => setVersion((v) => v + 1));
    return unsub;
  }, []);
  void version;
  return lists;
}

export function getLists() {
  return lists;
}

export function addList(name: string) {
  lists = [
    ...lists,
    { id: Math.random().toString(36).slice(2), name, items: [] },
  ];
  notify();
}

export function deleteList(id: string) {
  lists = lists.filter((l) => l.id !== id);
  notify();
}

export function getList(id: string) {
  return lists.find((l) => l.id === id);
}

export function addItem(listId: string, text: string) {
  lists = lists.map((l) =>
    l.id === listId
      ? {
          ...l,
          items: [
            ...l.items,
            { id: Math.random().toString(36).slice(2), text, done: false },
          ],
        }
      : l
  );
  notify();
}

export function toggleItem(listId: string, itemId: string) {
  lists = lists.map((l) =>
    l.id === listId
      ? {
          ...l,
          items: l.items.map((i) =>
            i.id === itemId ? { ...i, done: !i.done } : i
          ),
        }
      : l
  );
  notify();
}

export function deleteItem(listId: string, itemId: string) {
  lists = lists.map((l) =>
    l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l
  );
  notify();
}
