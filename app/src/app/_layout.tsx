import "../../global.css";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DATABASE_NAME, migrateDbIfNeeded, registerDb } from "@/lib/db";
import { hydrateCompletions, getCompletions } from "@/lib/completions-store";
import {
  hydrateDayRecords,
  refreshFinishedDays,
  registerDaySources,
} from "@/lib/day-store";
import { getHabits, hydrateHabits } from "@/lib/habits-store";
import { hydrateLists } from "@/lib/lists-store";
import { hydrateRecordings } from "@/lib/recordings-store";
import { hydrateTags } from "@/lib/tags";
import { getTasks, hydrateTasks } from "@/lib/tasks-store";
import { hydrateChecklists } from "@/lib/checklists-store";
import { hydrateNotes } from "@/lib/notes-store";
import { hydratePrefs } from "@/lib/prefs-store";

async function openDb(db: Parameters<typeof migrateDbIfNeeded>[0]) {
  registerDb(db);
  await migrateDbIfNeeded(db);
  // Lets the item stores refresh day history without importing each other.
  registerDaySources(() => ({
    tasks: getTasks(),
    habits: getHabits(),
    completions: getCompletions(),
  }));
  // Loads run after migrations so the stores read a fully-formed schema.
  await Promise.all([
    hydrateTasks(),
    hydrateCompletions(),
    hydrateHabits(),
    hydrateDayRecords(),
    hydrateLists(),
    hydrateTags(),
    hydrateRecordings(),
    hydrateChecklists(),
    hydrateNotes(),
    hydratePrefs(),
  ]);
  // Closes out days left behind while the app was closed.
  refreshFinishedDays();
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1 bg-zinc-950">
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={openDb}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <ThemeProvider value={DarkTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#09090b" },
              }}
            />
          </ThemeProvider>
        </SafeAreaProvider>
      </SQLiteProvider>
    </GestureHandlerRootView >
  );
}
