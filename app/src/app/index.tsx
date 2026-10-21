import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import type { SwipeableMethods } from "react-native-gesture-handler/lib/typescript/components/ReanimatedSwipeable/ReanimatedSwipeableProps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { CheckRow, SectionLabel } from "@/components/check-row";
import { Celebration } from "@/components/celebrate";
import { ConfirmModal } from "@/components/confirm-modal";
import { TagManager } from "@/components/tag-manager";
import { TabBar } from "@/components/tab-bar";
import { TagFilterModal } from "@/components/tag-filter-modal";
import { TaskModal } from "@/components/task-modal";
import { UIText } from "@/components/ui-text";
import { useCompletions } from "@/lib/completions-store";
import { progressMap } from "@/lib/day";
import { refreshFinishedDays } from "@/lib/day-store";
import {
  bumpHabit,
  deleteHabit,
  removeTagFromHabits,
  retagHabits,
  useHabits,
} from "@/lib/habits-store";
import { progressOn, startOfDay, startOfToday } from "@/lib/progress";
import { deleteTagColor, ensureTag, renameTagColor, useTagColors } from "@/lib/tags";
import {
  addTask,
  bumpTask,
  deleteTask,
  purgeCheckedOnceTasks,
  removeTagFromTasks,
  retagTasks,
  updateTask,
  useTasks,
  useTasksReady,
} from "@/lib/tasks-store";
import type { Frequency, HabitView, Task, TaskView } from "@/lib/types";

const PRIMARY = "#f00359";

type Row =
  | { key: string; type: "label"; title: string; hint?: string }
  | { key: string; type: "habit"; habit: HabitView }
  | { key: string; type: "task"; task: TaskView };

function deadlineText(deadline: number) {
  return new Date(deadline).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Index() {
  const tasks = useTasks();
  const habits = useHabits();
  const completions = useCompletions();
  const tagColors = useTagColors();
  const ready = useTasksReady();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  // Tags picked in the filter; empty means every item is shown.
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  // Bumped once per full-day completion, so the celebration replays fresh.
  const [celebrateRun, setCelebrateRun] = useState(0);
  const swipeRefs = useRef<Record<string, SwipeableMethods | null>>({});

  const today = startOfToday();

  const allTags = useMemo(
    () =>
      [
        // Tags can stand alone in the tags store, so its rows are a source too.
        ...new Set([
          ...tasks.flatMap((t) => t.tags),
          ...habits.flatMap((h) => h.tags),
          ...Object.keys(tagColors),
        ]),
      ].sort(),
    [tasks, habits, tagColors]
  );

  const todayProgress = useMemo(
    () => progressMap(tasks, habits, completions, today),
    [tasks, habits, completions, today]
  );

  const { rows, hasContent, todayDone, todayTotal } = useMemo(() => {
    const byProgress = <T extends { done: boolean; createdAt: number }>(
      a: T,
      b: T
    ) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.createdAt - a.createdAt;
    };

    // An active tag filter keeps only items carrying at least one picked tag;
    // an empty selection means no filter is applied.
    const matchesFilter = (itemTags: string[]) =>
      filterTags.length === 0 || itemTags.some((t) => filterTags.includes(t));

    const habitViews: HabitView[] = habits
      .filter((habit) => matchesFilter(habit.tags))
      .map((habit) => {
        const progress = todayProgress[habit.id] ?? 0;
        return { ...habit, progress, done: progress >= (habit.count ?? 1) };
      })
      .sort(byProgress);

    const view = (task: Task): TaskView => {
      // progressMap only covers items a day "expects": deadline-day tasks and
      // habits. Undated tasks belong to no day, so their per-day progress is
      // read straight from the log here; otherwise the row would never show
      // done no matter how many times it was tapped.
      const progress =
        task.deadline == null
          ? progressOn(completions, task.id, today)
          : (todayProgress[task.id] ?? 0);
      return { ...task, progress, done: progress >= (task.count ?? 1) };
    };

    // A task belongs to its deadline day and nowhere else, so once that day
    // has passed an unfinished one leaves this list and stays in History.
    const todaysTasks = tasks
      .filter((task) => task.deadline != null && startOfDay(task.deadline) === today)
      .filter((task) => matchesFilter(task.tags))
      .map(view)
      .sort(byProgress);

    // Undated tasks never break a day, so they stay reachable but set apart.
    const undatedTasks = tasks
      .filter((task) => task.deadline == null)
      .filter((task) => matchesFilter(task.tags))
      .map(view)
      .sort(byProgress);

    const out: Row[] = [];
    // Tasks carry no day labels: dated and undated flow as one list, grouped
    // only by the habit section that follows.
    for (const task of todaysTasks) {
      out.push({ key: `t-${task.id}`, type: "task", task });
    }

    if (habitViews.length) {
      out.push({ key: "label-habits", type: "label", title: "Habits" });
      for (const habit of habitViews) {
        out.push({ key: `h-${habit.id}`, type: "habit", habit });
      }
    }

    for (const task of undatedTasks) {
      out.push({ key: `u-${task.id}`, type: "task", task });
    }

    return {
      rows: out,
      hasContent: habitViews.length + todaysTasks.length + undatedTasks.length > 0,
      todayDone: [...habitViews, ...todaysTasks].filter((i) => i.done).length,
      todayTotal: habitViews.length + todaysTasks.length,
    };
  }, [tasks, habits, todayProgress, today, completions, filterTags]);

  // Day rollover: when midnight passes — visible on screen or not — checked
  // once-tasks from the finished day are deleted, and the list starts empty.
  useEffect(() => {
    purgeCheckedOnceTasks();
    const lastDay = startOfToday();
    let day = lastDay;
    const roll = () => {
      const now = startOfToday();
      if (now !== day) {
        day = now;
        // The finished day gets its snapshot first — checked once-tasks are
        // deleted right after, and their trace must survive in the record.
        refreshFinishedDays();
        purgeCheckedOnceTasks();
      }
    };
    // 30s granularity closes the midnight gap to at most half a minute.
    const interval = setInterval(roll, 30_000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") roll();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  const submitTask = (
    title: string,
    tags: string[],
    frequency: Frequency,
    deadline: number | null,
    count: number
  ) => {
    if (editingTask) {
      updateTask(editingTask.id, title, tags, frequency, deadline, count);
    } else {
      addTask(title, tags, frequency, deadline, count);
    }
  };

  // Everything expected of today done is worth a beat. The boundary ref keeps
  // re-completing (and momentarily-dropped items) from re-firing the burst.
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (todayTotal > 0 && todayDone === todayTotal && !celebratedRef.current) {
      celebratedRef.current = true;
      const id = requestAnimationFrame(() => setCelebrateRun((r) => r + 1));
      return () => cancelAnimationFrame(id);
    }
    if (todayDone !== todayTotal) celebratedRef.current = false;
  }, [todayDone, todayTotal]);

  const renderRow = (row: Row) => {
    if (row.type === "label") {
      return <SectionLabel title={row.title} hint={row.hint} />;
    }

    if (row.type === "habit") {
      const [key] = [`h-${row.habit.id}`]
      return (
        <SwipeableRow
          registerRef={(ref) => (swipeRefs.current[key] = ref)}
          onDelete={() => {
            swipeRefs.current[key]?.close();
            deleteHabit(row.habit.id);
          }}
        >
          <CheckRow
            title={row.habit.title}
            tags={row.habit.tags}
            done={row.habit.done}
            progress={row.habit.progress}
            count={row.habit.count}
            tagColors={tagColors}
            badge="daily"
            onToggle={() => bumpHabit(row.habit.id)}
          />
        </SwipeableRow >
      );
    }

    const task = row.task;
    return (
      <SwipeableRow
        registerRef={(ref) => (swipeRefs.current[task.id] = ref)}
        onDelete={() => {
          swipeRefs.current[task.id]?.close();
          setPendingDelete(task);
        }}
        onEdit={() => {
          swipeRefs.current[task.id]?.close();
          setEditingTask(task);
          setModalVisible(true);
        }}
      >
        <CheckRow
          title={task.title}
          tags={task.tags}
          done={task.done}
          progress={task.progress}
          count={task.count}
          tagColors={tagColors}
          badge={task.frequency !== "once" ? task.frequency : undefined}
          onToggle={() => bumpTask(task.id)}
          meta={
            task.deadline ? (
              <>
                <Ionicons name="time-outline" size={12} color="#a1a1aa" />
                <UIText className="text-2xs text-zinc-400">
                  {deadlineText(task.deadline)}
                </UIText>
              </>
            ) : undefined
          }
        />
      </SwipeableRow>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        {/* Filter: narrows the list to items carrying any picked tag. The
            icon lights up while a filter is active. */}
        <Pressable
          onPress={() => setFilterOpen(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Filter by tag"
          className="mr-1"
        >
          <Ionicons
            name="filter-outline"
            size={26}
            color={filterTags.length > 0 ? PRIMARY : "#a1a1aa"}
          />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <HeaderPill
            icon="flower-outline"
            label=""
            color="lightgreen"
            onPress={() => router.push("/habits")}
          />
          <HeaderPill
            icon="checkmark-done-outline"
            label=""
            color="lightblue"
            onPress={() => router.push("/checklists")}
          />
          <HeaderPill
            icon="document-text-outline"
            label=""
            color="orange"
            onPress={() => router.push("/notes")}
          />
          <HeaderPill
            icon="musical-notes"
            label=""
            color="magenta"
            onPress={() => router.push("/recordings")}
          />
          <HeaderPill
            onPress={() => setTagsOpen(true)}
            label=""
            color="yellow"
            icon="pricetags-outline"
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerClassName="px-5 pb-44 gap-2"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          hasContent || !ready ? null : (
            <UIText muted className="py-12 text-center text-sm">
              Nothing today. Tap + to add a task.
            </UIText>
          )
        }
        renderItem={({ item }) => renderRow(item)}
      />

      {/* Today's progress, level with the add button */}
      <View className="absolute bottom-28 left-6 right-6 flex-row items-center justify-between">
        {todayTotal > 0 && (
          <View className="flex-row items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2">
            <Ionicons name="checkmark-done" size={14} color="#a1a1aa" />
            <UIText className="text-2xs font-semibold text-zinc-300">
              {todayDone}/{todayTotal} done today
            </UIText>
          </View>
        )}
        <Pressable
          onPress={() => {
            setEditingTask(null);
            setModalVisible(true);
          }}
          className="ml-auto h-14 w-14 items-center justify-center rounded-2xl active:opacity-80 shadow-lg shadow-black/50"
          style={{ backgroundColor: PRIMARY }}
        >
          <Ionicons name="add" size={30} color="white" />
        </Pressable>
      </View>

      <TabBar
        onLists={() => router.push("/lists")}
        onHistory={() => router.push("/history")}
        onSavedRecording={() => router.push("/recordings")}
        onPomodoro={() => router.push("/pomodoro")}
      />

      <Celebration run={celebrateRun} />

      <ConfirmModal
        visible={pendingDelete !== null}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        body="The task and its completions are removed. This cannot be undone."
        onConfirm={() => {
          if (pendingDelete) deleteTask(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <TaskModal
        visible={modalVisible}
        editing={editingTask}
        allTags={allTags}
        onClose={() => setModalVisible(false)}
        onSubmit={submitTask}
      />

      <TagManager
        visible={tagsOpen}
        tags={allTags}
        tagColors={tagColors}
        onClose={() => setTagsOpen(false)}
        onRename={(oldTag, newTag) => {
          // Creating from the menu: the tag stands on its own, with a stable
          // row and colour, even before any task uses it.
          if (!oldTag) {
            ensureTag(newTag);
            return;
          }
          retagTasks(oldTag, newTag);
          retagHabits(oldTag, newTag);
          renameTagColor(oldTag, newTag);
        }}
        onDelete={(tag) => {
          removeTagFromTasks(tag);
          removeTagFromHabits(tag);
          deleteTagColor(tag);
        }}
      />

      <TagFilterModal
        visible={filterOpen}
        tags={allTags}
        tagColors={tagColors}
        selected={filterTags}
        onToggle={(tag) =>
          setFilterTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
          )
        }
        onClear={() => setFilterTags([])}
        onClose={() => setFilterOpen(false)}
      />
    </SafeAreaView >
  );
}

function HeaderPill({
  icon,
  label,
  onPress,
  color = "#a1a1aa",
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string,
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="px-3"
    >
      <Ionicons name={icon} size={28} color={color} />
      <UIText className="text-2xs font-semibold text-zinc-300">{label}</UIText>
    </Pressable>
  );
}

function SwipeableRow({
  children,
  registerRef,
  onDelete,
  onEdit,
}: {
  children: React.ReactNode;
  registerRef: (ref: SwipeableMethods | null) => void;
  onDelete: () => void;
  onEdit?: () => void;
}) {
  return (
    <Swipeable
      ref={registerRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={() => (
        <View className="ml-2 h-auto flex-row items-stretch">
          {onEdit && (
            <Pressable
              onPress={onEdit}
              className="w-16 items-center justify-center rounded-xl bg-sky-500/90 active:opacity-70"
            >
              <UIText className="font-semibold text-zinc-950">Edit</UIText>
            </Pressable>
          )}
          <Pressable
            onPress={onDelete}
            className={`${onEdit ? "ml-2" : ""} w-16 items-center justify-center rounded-xl bg-red-500/90 active:opacity-70`}
          >
            <UIText className="font-semibold text-zinc-950">Delete</UIText>
          </Pressable>
        </View>
      )}
    >
      {children}
    </Swipeable>
  );
}
