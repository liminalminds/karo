import { File } from "expo-file-system";
import { getDb } from "@/lib/db";
import { createStore, useStore, useStoreReady } from "@/lib/sqlite-store";

export type Recording = {
  id: string;
  uri: string;
  durationMs: number;
  createdAt: number;
  transcript: string | null;
};

type Row = {
  id: string;
  uri: string;
  duration_ms: number;
  created_at: number;
  transcript: string | null;
};

function newId() {
  return Math.random().toString(36).slice(2);
}

const store = createStore<Recording[]>({
  name: "recordings",
  initial: [],
  load: async () => {
    const rows = await getDb().getAllAsync<Row>(
      // rowid breaks ties: Date.now() collides for takes recorded in the
      // same millisecond, which would otherwise reshuffle order on reload.
      "SELECT * FROM recordings ORDER BY created_at DESC, rowid DESC"
    );
    return rows.map((r) => ({
      id: r.id,
      uri: r.uri,
      durationMs: r.duration_ms,
      createdAt: r.created_at,
      transcript: r.transcript ?? null,
    }));
  },
  persist: async () => {},
});

export function hydrateRecordings() {
  return store.hydrate();
}

export function useRecordings() {
  return useStore(store);
}

export function useRecordingsReady() {
  return useStoreReady(store);
}

export function addRecording(uri: string, durationMs: number, transcript: string | null = null) {
  const recording: Recording = {
    id: newId(),
    uri,
    durationMs,
    createdAt: Date.now(),
    transcript,
  };
  store.set((prev) => [recording, ...prev]);
  void getDb().runAsync(
    "INSERT INTO recordings (id, uri, duration_ms, created_at, transcript) VALUES (?, ?, ?, ?, ?)",
    [recording.id, recording.uri, recording.durationMs, recording.createdAt, recording.transcript]
  );
  return recording;
}

/** Removes the row and the audio file, so nothing is left on disk. */
export function deleteRecording(id: string) {
  const recording = store.getState().find((r) => r.id === id);
  store.set((prev) => prev.filter((r) => r.id !== id));
  void getDb().runAsync("DELETE FROM recordings WHERE id = ?", [id]);
  if (!recording) return;
  try {
    const file = new File(recording.uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn("[recordings] failed to delete audio file", error);
  }
}

/** Best-effort cleanup for a take the user released too quickly to keep. */
export function discardRecordingFile(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn("[recordings] failed to discard audio file", error);
  }
}
