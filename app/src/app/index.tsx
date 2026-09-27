import { useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import type { SwipeableMethods } from "react-native-gesture-handler/lib/typescript/components/ReanimatedSwipeable/ReanimatedSwipeableProps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { TaskModal } from "@/components/task-modal";
import { TagManager } from "@/components/tag-manager";
import { TabBar } from "@/components/tab-bar";
import { UIText } from "@/components/ui-text";
import { cn } from "@/lib/cn";
import { tagColor } from "@/lib/tags";
import { Frequency, Task } from "@/lib/types";

const PRIMARY = "#f00359";

const today = () => new Date().toDateString();
const yesterday = () => new Date(Date.now() - 86400000).toDateString();

function nextStreak(lastActiveDay: string | null, current: number) {
  if (lastActiveDay === today()) return null;
  return lastActiveDay === yesterday() ? current + 1 : 1;
}

function deadlineText(deadline: number) {
  const overdue = deadline < Date.now();
  return {
    text: new Date(deadline).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    color: overdue ? "#f87171" : "#a1a1aa",
  };
}

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastActiveDay, setLastActiveDay] = useState<string | null>(null);
  const swipeRefs = useRef<Record<string, SwipeableMethods | null>>({});

  const allTags = useMemo(
    () => [...new Set([...tasks.flatMap((t) => t.tags), ...extraTags])].sort(),
    [tasks, extraTags]
  );

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }, [tasks]);

  const openNewTask = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const submitTask = (
    title: string,
    tags: string[],
    frequency: Frequency,
    deadline: number | null,
    count: number
  ) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? { ...t, title, tags, frequency, deadline, count }
            : t
        )
      );
    } else {
      setTasks((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          title,
          tags,
          frequency,
          completed: false,
          createdAt: Date.now(),
          deadline,
          count,
          progress: 0,
        },
      ]);
    }
  };

  const deleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.frequency === "daily") return;
    swipeRefs.current[id]?.close();
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const bumpProgress = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const count = Math.max(1, task.count ?? 1);
    const progress = task.progress ?? 0;

    let nextProgress: number;
    let completed: boolean;

    if (task.completed) {
      // toggle back to incomplete; reset counter if it was fully completed
      nextProgress = progress >= count ? 0 : progress;
      completed = false;
    } else if (progress + 1 >= count) {
      nextProgress = count;
      completed = true;
    } else {
      nextProgress = progress + 1;
      completed = false;
    }

    if (completed && !task.completed) {
      const updated = nextStreak(lastActiveDay, streak);
      if (updated !== null) {
        setStreak(updated);
        setLastActiveDay(today());
      }
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, progress: nextProgress, completed } : t
      )
    );
  };

  const renameTag = (oldTag: string, newTag: string) => {
    if (!oldTag) {
      // add new standalone tag
      setExtraTags((prev) =>
        prev.includes(newTag) || allTags.includes(newTag) ? prev : [...prev, newTag]
      );
      return;
    }
    if (oldTag === newTag) return;
    setExtraTags((prev) => prev.map((t) => (t === oldTag ? newTag : t)));
    setTasks((prev) =>
      prev.map((t) =>
        t.tags.includes(oldTag)
          ? {
              ...t,
              tags: [
                ...new Set(t.tags.map((g) => (g === oldTag ? newTag : g))),
              ],
            }
          : t
      )
    );
  };

  const deleteTag = (tag: string) => {
    setExtraTags((prev) => prev.filter((t) => t !== tag));
    setTasks((prev) =>
      prev.map((t) =>
        t.tags.includes(tag)
          ? { ...t, tags: t.tags.filter((g) => g !== tag) }
          : t
      )
    );
  };

  const micPress = () =>
    Alert.alert("Voice", "Voice recording coming soon.");

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => setTagsOpen(true)} hitSlop={8}>
          <Ionicons name="pricetags-outline" size={22} color="#a1a1aa" />
        </Pressable>
        <View className="flex-row items-center gap-1.5 px-3 py-1.5">
          <Ionicons name="flame" size={16} color="white" />
          <UIText className="text-sm font-semibold">{streak}</UIText>
        </View>
      </View>

      {/* Task list */}
      <FlatList
        data={sortedTasks}
        keyExtractor={(t) => t.id}
        contentContainerClassName="px-5 pb-40 gap-2"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            No tasks yet.
          </UIText>
        }
        renderItem={({ item }) => (
          <SwipeableRow
            task={item}
            registerRef={(r) => (swipeRefs.current[item.id] = r)}
            onDelete={() => deleteTask(item.id)}
          >
            <Pressable
              onPress={() => bumpProgress(item.id)}
              onLongPress={() => openEditTask(item)}
              className="flex-row items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-4"
            >
              <View
                className={cn(
                  "h-5 w-5 items-center justify-center rounded-full border",
                  item.completed ? "" : "border-zinc-600"
                )}
                style={
                  item.completed
                    ? { backgroundColor: PRIMARY, borderColor: PRIMARY }
                    : undefined
                }
              >
                {item.completed && (
                  <UIText className="text-[10px] text-white">✓</UIText>
                )}
              </View>

              <View className="flex-1 gap-1">
                <View className="flex-row flex-wrap items-baseline gap-x-1.5">
                  <UIText
                    className={cn(item.completed && "line-through opacity-40")}
                  >
                    {item.title}
                  </UIText>
                  {(item.count ?? 1) > 1 && (
                    <UIText muted className="text-xs font-medium">
                      ({item.progress ?? 0}/{item.count})
                    </UIText>
                  )}
                </View>
                {(item.tags.length > 0 || item.frequency !== "once" || item.deadline) && (
                  <View className="flex-row flex-wrap items-center gap-1.5">
                    {item.frequency !== "once" && (
                      <UIText className="text-[10px] text-sky-400 uppercase tracking-wide">
                        {item.frequency}
                      </UIText>
                    )}
                    {item.tags.map((tag) => (
                      <View
                        key={tag}
                        className="rounded-full px-2 py-0.5"
                        style={{ backgroundColor: `${tagColor(tag)}26` }}
                      >
                        <UIText
                          className="text-[10px] font-medium"
                          style={{ color: tagColor(tag) }}
                        >
                          {tag}
                        </UIText>
                      </View>
                    ))}
                    {item.deadline && (
                      <>
                        <Ionicons
                          name="time-outline"
                          size={11}
                          color={
                            item.completed
                              ? "#a1a1aa"
                              : deadlineText(item.deadline).color
                          }
                        />
                        <UIText
                          className="text-[10px]"
                          style={{
                            color: deadlineText(item.deadline).color,
                            ...(item.completed ? { opacity: 0.4 } : {}),
                          }}
                        >
                          {deadlineText(item.deadline).text}
                        </UIText>
                      </>
                    )}
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => openEditTask(item)}
                hitSlop={8}
                className="p-1"
              >
                <Ionicons name="pencil" size={16} color="#71717a" />
              </Pressable>
            </Pressable>
          </SwipeableRow>
        )}
      />

      {/* FAB */}
      <Pressable
        onPress={openNewTask}
        className="absolute bottom-28 right-6 h-14 w-14 items-center justify-center rounded-2xl active:opacity-80 shadow-lg shadow-black/50"
        style={{ backgroundColor: PRIMARY }}
      >
        <Ionicons name="add" size={30} color="white" />
      </Pressable>

      <TabBar onLists={() => router.push("/lists")} onMic={micPress} />

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
        onClose={() => setTagsOpen(false)}
        onRename={renameTag}
        onDelete={deleteTag}
      />
    </SafeAreaView>
  );
}

function SwipeableRow({
  task,
  children,
  registerRef,
  onDelete,
}: {
  task: Task;
  children: React.ReactNode;
  registerRef: (ref: SwipeableMethods | null) => void;
  onDelete: () => void;
}) {
  const deletable = task.frequency !== "daily" && !task.completed;

  if (!deletable) return <>{children}</>;

  return (
    <Swipeable
      ref={registerRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={() => (
        <Pressable
          onPress={onDelete}
          className="ml-2 h-auto w-16 items-center justify-center rounded-xl bg-red-500/90"
        >
          <UIText className="font-semibold text-zinc-950">Delete</UIText>
        </Pressable>
      )}
    >
      {children}
    </Swipeable>
  );
}
