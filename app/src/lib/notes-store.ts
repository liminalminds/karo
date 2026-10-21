import { getDb } from "@/lib/db";
import { newId } from "@/lib/id";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";

/** A short free-form note. Samsung-Notes territory: text in, text out. */
export type Note = {
  id: string;
  text: string;
  /** Last edit, shown as "2d ago" on the card grid. */
  updatedAt: number;
};

type NoteRow = { id: string; text: string; updated_at: number };

const store = createStore<Note[]>({
  name: "notes",
  initial: [],
  load: async () => {
    const rows = await getDb().getAllAsync<NoteRow>(
      // Newest edit first, which is also the grid's reading order.
      "SELECT * FROM notes ORDER BY updated_at DESC"
    );
    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      updatedAt: row.updated_at,
    }));
  },
  // Written per-mutation below; the table is rewritten only by its own writes.
  persist: async () => {},
});

export function hydrateNotes() {
  return store.hydrate();
}

export function useNotes() {
  return useStore(store);
}

export function useNotesReady() {
  return useStoreReady(store);
}

export function getNote(id: string) {
  return store.getState().find((n) => n.id === id);
}

function mapNote(id: string, fn: (note: Note) => Note) {
  store.set((prev) => prev.map((n) => (n.id === id ? fn(n) : n)));
}

function touch(note: Note, text: string) {
  const next = { ...note, text, updatedAt: Date.now() };
  mapNote(note.id, () => next);
  void getDb().runAsync(
    "UPDATE notes SET text = ?, updated_at = ? WHERE id = ?",
    [next.text, next.updatedAt, note.id]
  );
}

/** Creates an empty note and opens it by id; text lands via `saveNote`. */
export function addNote(): string {
  const note: Note = { id: newId(), text: "", updatedAt: Date.now() };
  store.set((prev) => [note, ...prev]);
  void getDb().runAsync(
    "INSERT INTO notes (id, text, updated_at) VALUES (?, ?, ?)",
    [note.id, note.text, note.updatedAt]
  );
  return note.id;
}

export function saveNote(id: string, text: string) {
  const note = getNote(id);
  if (note) touch(note, text);
}

export function deleteNote(id: string) {
  store.set((prev) => prev.filter((n) => n.id !== id));
  void getDb().runAsync("DELETE FROM notes WHERE id = ?", [id]);
}
