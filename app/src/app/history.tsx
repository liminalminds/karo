import { useMemo } from "react";
import { Pressable, SectionList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { UIText } from "@/components/ui-text";
import { useCompletions } from "@/lib/completions-store";
import { expectedHabitsOn } from "@/lib/day";
import { useDayRecords, useDayRecordsReady } from "@/lib/day-store";
import { useHabits, useHabitsReady } from "@/lib/habits-store";
import { progressOn, startOfToday } from "@/lib/progress";
import { tagColor, useTagColors } from "@/lib/tags";
import type { DayRecord } from "@/lib/types";

type Entry = {
  id: string;
  title: string;
  tags: string[];
  done: boolean;
  /** Completion time, when the log has one for today. */
  at?: number;
};

type Section = {
  title: string;
  missed: number;
  data: Entry[];
};

function dayLabel(day: number) {
  const today = startOfToday();
  const diff = day - today;
  if (diff === 0) return "Today";
  if (diff === -86400000) return "Yesterday";
  return new Date(day).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function History() {
  const habits = useHabits();
  const completions = useCompletions();
  const records = useDayRecords();
  const tagColors = useTagColors();
  const habitsReady = useHabitsReady();
  const recordsReady = useDayRecordsReady();
  const ready = habitsReady && recordsReady;

  const sections = useMemo(
    () => buildSections(habits, completions, records),
    [habits, completions, records]
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText className="text-lg font-semibold">History</UIText>
        <View className="w-6" />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-10"
        stickySectionHeadersEnabled
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            {ready ? "Nothing logged yet." : ""}
          </UIText>
        }
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-center justify-between bg-zinc-950 py-2">
            <UIText className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {section.title}
            </UIText>
            {section.missed > 0 ? (
              <UIText className="text-[11px] font-medium text-amber-400">
                {section.missed} missed
              </UIText>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <View className="mb-2 flex-row items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <Ionicons
              name={item.done ? "checkmark-circle" : "close-circle"}
              size={18}
              color={item.done ? "#f00359" : "#fbbf24"}
            />
            <View className="flex-1 gap-1">
              <UIText className={item.done ? "" : "text-zinc-400"}>{item.title}</UIText>
              {item.tags.length > 0 && (
                <View className="flex-row flex-wrap items-center gap-1.5">
                  {item.tags.map((tag) => (
                    <View
                      key={tag}
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${tagColor(tag, tagColors)}26` }}
                    >
                      <UIText
                        className="text-[10px] font-medium"
                        style={{ color: tagColor(tag, tagColors) }}
                      >
                        {tag}
                      </UIText>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {item.at !== undefined && (
              <UIText muted className="text-xs">
                {new Date(item.at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </UIText>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function buildSections(
  habits: ReturnType<typeof useHabits>,
  completions: ReturnType<typeof useCompletions>,
  records: DayRecord[]
): Section[] {
  const today = startOfToday();
  const sections: Section[] = [];

  // Today is still running, so it is read live from the current items rather
  // than from a snapshot that doesn't exist yet. History tracks habits only.
  const titles = new Map<string, { title: string; tags: string[] }>();
  for (const habit of habits) titles.set(habit.id, habit);

  const todayEntries = expectedHabitsOn(habits, today).map((expected) => {
    const source = titles.get(expected.id);
    const stamps = completions[expected.id] ?? [];
    const last = [...stamps].reverse().find((stamp) => stamp >= today);
    return {
      id: `today-${expected.kind}-${expected.id}`,
      title: source?.title ?? "Deleted item",
      tags: source?.tags ?? [],
      done: progressOn(completions, expected.id, today) >= expected.count,
      at: last,
    };
  });
  if (todayEntries.length) {
    sections.push({
      title: "Today",
      missed: todayEntries.filter((e) => !e.done).length,
      data: todayEntries,
    });
  }

  for (const record of records) {
    sections.push({
      title: dayLabel(record.day),
      missed: record.items.filter((item) => !item.done).length,
      data: record.items.map((item) => ({
        id: `${record.day}-${item.kind}-${item.id}`,
        title: item.title,
        tags: item.tags,
        done: item.done,
      })),
    });
  }

  return sections;
}