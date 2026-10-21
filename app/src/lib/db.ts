import type { SQLiteDatabase } from "expo-sqlite";

export const DATABASE_NAME = "karo.db";

const DATABASE_VERSION = 7;

let db: SQLiteDatabase | null = null;

/** Called from SQLiteProvider.onInit so module-level stores can reach the db. */
export function registerDb(instance: SQLiteDatabase) {
  db = instance;
}

export function getDb(): SQLiteDatabase {
  if (!db) {
    throw new Error("Database accessed before SQLiteProvider.onInit ran.");
  }
  return db;
}

/**
 * Called by SQLiteProvider.onInit. Connection settings are applied on every
 * launch because journal_mode and foreign_keys are per-connection, then the
 * schema is brought up to DATABASE_VERSION.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // Must run before any version check: ON DELETE CASCADE only fires while
  // foreign keys are enabled, and some platform SQLite builds ship them off.
  await db.execAsync("PRAGMA journal_mode = WAL");
  await db.execAsync("PRAGMA foreign_keys = ON");

  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const current = row?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  if (current === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        frequency TEXT NOT NULL DEFAULT 'once',
        count INTEGER NOT NULL DEFAULT 1,
        deadline INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS completions (
        id TEXT PRIMARY KEY NOT NULL,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        completed_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS completions_task_time
        ON completions(task_id, completed_at);
      CREATE INDEX IF NOT EXISTS completions_time
        ON completions(completed_at);

      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS list_items (
        id TEXT PRIMARY KEY NOT NULL,
        list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS list_items_list ON list_items(list_id);

      CREATE TABLE IF NOT EXISTS tags (
        name TEXT PRIMARY KEY NOT NULL,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS recordings (
        id TEXT PRIMARY KEY NOT NULL,
        uri TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  }

  // v2: habits, and a snapshot of how each finished day went.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      count INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      completed_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS habit_completions_habit_time
      ON habit_completions(habit_id, completed_at);

    CREATE TABLE IF NOT EXISTS day_records (
      day INTEGER PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      recorded_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS day_record_items (
      day INTEGER NOT NULL REFERENCES day_records(day) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      item_id TEXT NOT NULL,
      title TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      done INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, kind, item_id)
    );
  `);

  // v3: a stored on-device transcription for each voice take.
  const transcriptCol = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM pragma_table_info('recordings') WHERE name = 'transcript'"
  );
  if (!transcriptCol) {
    await db.execAsync("ALTER TABLE recordings ADD COLUMN transcript TEXT");
  }

  // v4: history is tracked for habits only, so finished-day snapshots stop
  // carrying task rows. Old rows are dropped, days left with nothing are
  // removed, and surviving days are re-scored against their habit items alone.
  await db.execAsync(`
    DELETE FROM day_record_items WHERE kind = 'task';
    DELETE FROM day_records
      WHERE day NOT IN (SELECT DISTINCT day FROM day_record_items);
    UPDATE day_records SET status = CASE
      WHEN (SELECT COUNT(*) FROM day_record_items
            WHERE day = day_records.day AND done = 0) = 0
      THEN 'complete' ELSE 'missed' END;
  `);

  // v5: routine checklists. Unlike plain lists these get run over and over, so
  // the done-state is disposable while the template stays. The runs column is
  // vestigial, kept to avoid rewriting a schema users already migrated to.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      runs INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY NOT NULL,
      checklist_id TEXT NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS checklist_items_checklist
      ON checklist_items(checklist_id);
  `);

  // v6: notes. Plain text, no structure, saved as it is typed.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      text TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // v7: key/value prefs — home of the streak-freeze balance.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS prefs (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
