import { useMemo, useRef, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import type { SwipeableMethods } from "react-native-gesture-handler/lib/typescript/components/ReanimatedSwipeable/ReanimatedSwipeableProps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { CheckRow } from "@/components/check-row";
import { CalendarModal } from "@/components/calendar-modal";
import { HabitModal } from "@/components/habit-modal";
import { UIText } from "@/components/ui-text";
import { useCompletions } from "@/lib/completions-store";
import { streakFrom } from "@/lib/day";
import { useDayRecords } from "@/lib/day-store";
import {
  addHabit,
  bumpHabit,
  deleteHabit,
  updateHabit,
  useHabits,
  useHabitsReady,
} from "@/lib/habits-store";
import { useFreezes, MAX_FREEZES } from "@/lib/prefs-store";
import { useTasks } from "@/lib/tasks-store";
import { DAY, progressOn, startOfToday } from "@/lib/progress";
import { useTagColors } from "@/lib/tags";
import type { Habit, HabitView } from "@/lib/types";

const PRIMARY = "#f00359";
const GREEN = "#22c55e";

type Row =
  | { key: string; type: "habit"; habit: HabitView }
  /** A row read back from a finished day's snapshot. */
  | { key: string; type: "past"; title: string; tags: string[]; done: boolean };

/** "Today", "Yesterday", or a short date for anything older. */
function dayLabel(day: number) {
  const today = startOfToday();
  if (day === today) return "Today";
  if (day === today - DAY) return "Yesterday";
  return new Date(day).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function cnPressable(disabled: boolean) {
  return `h-9 w-9 items-center justify-center rounded-full border active:opacity-70 ${disabled ? "border-zinc-900 bg-transparent" : "border-zinc-800 bg-zinc-900"
    }`;
}

export default function Habits() {
  const habits = useHabits();
  const completions = useCompletions();
  const records = useDayRecords();
  const tagColors = useTagColors();
  const ready = useHabitsReady();
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  /** 0 is today, -1 is yesterday, and so on. Only the past is reachable. */
  const [dayOffset, setDayOffset] = useState(0);
  const swipeRefs = useRef<Record<string, SwipeableMethods | null>>({});

  const tasks = useTasks();
  const freezes = useFreezes();

  const today = startOfToday();
  const isToday = dayOffset === 0;
  const viewDay = today + dayOffset * DAY;

  const todayProgress = useMemo(() => {
    const progress: Record<string, number> = {};
    for (const habit of habits) {
      progress[habit.id] = progressOn(completions, habit.id, today);
    }
    return progress;
  }, [habits, completions, today]);

  const rows = useMemo<Row[]>(() => {
    if (!isToday) {
      // A finished day is read from its snapshot, which is frozen: nothing here
      // can be toggled, and later edits can't change what it says.
      const record = records.find((r) => r.day === viewDay);
      // Habits own this page; tasks completed that day live in the calendar.
      const items = record?.items.filter((item) => item.kind === "habit") ?? [];
      return items.map<Row>((item) => ({
        key: `p-${item.id}`,
        type: "past",
        title: item.title,
        tags: item.tags,
        done: item.done,
      }));
    }

    return habits
      .map((habit) => {
        const progress = todayProgress[habit.id] ?? 0;
        return {
          ...habit,
          progress,
          done: progress >= (habit.count ?? 1),
        };
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return b.createdAt - a.createdAt;
      })
      .map<Row>((habit) => ({ key: `h-${habit.id}`, type: "habit", habit }));
  }, [isToday, viewDay, records, habits, todayProgress]);

  const streak = useMemo(
    () => streakFrom(habits, todayProgress, records),
    [habits, todayProgress, records]
  );

  const allTags = useMemo(
    () => [...new Set(habits.flatMap((h) => h.tags))].sort(),
    [habits]
  );

  const submit = (title: string, tags: string[], count: number) => {
    if (editing) updateHabit(editing.id, title, tags, count);
    else addHabit(title, tags, count);
  };

  const renderRow = (row: Row) => {
    if (row.type === "past") {
      return (
        <CheckRow
          locked
          variant="habit"
          title={row.title}
          tags={row.tags}
          done={row.done}
          progress={row.done ? 1 : 0}
          tagColors={tagColors}
          onToggle={() => {}}
        />
      );
    }

    const habit = row.habit;
    return (
      <Swipeable
        ref={(ref) => {
          swipeRefs.current[habit.id] = ref;
        }}
        friction={2}
        rightThreshold={40}
        renderRightActions={() => (
          <Pressable
            onPress={() => {
              swipeRefs.current[habit.id]?.close();
              deleteHabit(habit.id);
            }}
            className="ml-2 h-auto w-16 items-center justify-center rounded-2xl bg-red-500/90"
          >
            <UIText className="font-semibold text-zinc-950">Delete</UIText>
          </Pressable>
        )}
      >
        <CheckRow
          variant="habit"
          title={habit.title}
          tags={habit.tags}
          done={habit.done}
          progress={habit.progress}
          count={habit.count}
          tagColors={tagColors}
          onToggle={() => bumpHabit(habit.id)}
          onEdit={() => {
            setEditing(habit);
            setModalVisible(true);
          }}
        />
      </Swipeable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      {/* Header: back, title, and the habit streak */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText className="text-lg font-semibold">Habits</UIText>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setCalendarOpen(true)}
            hitSlop={8}
            accessibilityLabel="Open habit calendar"
            className="h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 active:opacity-70"
          >
            <Ionicons name="grid" size={18} color={GREEN} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/history")}
            hitSlop={8}
            className="flex-row items-center gap-1.5 px-1.5 py-1.5 active:opacity-70"
            accessibilityLabel={`${streak} day streak, ${freezes} freezes available, open history`}
          >
            <Ionicons name="flame" size={26} color="#ffff00" />
            <UIText className="text-md font-semibold text-zinc-200">{streak}</UIText>
            <UIText className="ml-1 text-xs text-zinc-400">
              {"\u2744"} {freezes}/{MAX_FREEZES}
            </UIText>
          </Pressable>
        </View>
      </View>

      {/* Day navigator */}
      <View className="mt-4 flex-row items-center justify-between px-5 pb-1 pt-2">
        <Pressable
          onPress={() => setDayOffset((d) => d - 1)}
          hitSlop={8}
          accessibilityLabel="Previous day"
          className="h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 active:opacity-70"
        >
          <Ionicons name="chevron-back" size={18} color="#a1a1aa" />
        </Pressable>

        <Pressable
          onPress={() => setDayOffset(0)}
          disabled={isToday}
          hitSlop={6}
          accessibilityLabel="Back to today"
          className="items-center px-3 py-1 active:opacity-70"
        >
          <UIText className="text-lg font-bold tracking-wide">
            {isToday ? "Today" : dayLabel(viewDay)}
          </UIText>
        </Pressable>

        <Pressable
          onPress={() => setDayOffset((d) => Math.min(0, d + 1))}
          disabled={isToday}
          hitSlop={8}
          accessibilityLabel="Next day"
          className={cnPressable(isToday)}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isToday ? "#3f3f46" : "#a1a1aa"}
          />
        </Pressable>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerClassName="gap-2 px-5 pb-24"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            {ready
              ? isToday
                ? "No habits yet. Tap + to add one."
                : "Nothing was scheduled."
              : ""}
          </UIText>
        }
        renderItem={({ item }) => renderRow(item)}
      />

      <Pressable
        onPress={() => {
          setEditing(null);
          setModalVisible(true);
        }}
        className="absolute bottom-8 right-6 h-14 w-14 items-center justify-center rounded-2xl active:opacity-80 shadow-lg shadow-black/50"
        style={{ backgroundColor: PRIMARY }}
      >
        <Ionicons name="add" size={30} color="white" />
      </Pressable>

      <HabitModal
        visible={modalVisible}
        editing={editing}
        allTags={allTags}
        onClose={() => setModalVisible(false)}
        onSubmit={submit}
      />

      <CalendarModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        records={records}
        tasks={tasks}
        habits={habits}
        completions={completions}
        freezes={freezes}
      />
    </SafeAreaView>
  );
}