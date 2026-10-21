import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UIText } from "@/components/ui-text";
import { tagColor } from "@/lib/tags";
import { DAY, startOfToday } from "@/lib/progress";
import { buildDayRecord } from "@/lib/day-store";
import type { DayRecord, Habit, Task } from "@/lib/types";

const GREEN = "#22c55e";
const FROZEN = "#38bdf8";
/** Green depth per fraction bucket; hex alpha on GREEN, '' = full. */
const SHADES = ["12", "1f", "42", "70", "94", ""] as const;
const WEEKS = 26;
const CELL = 15;
const GAP = 3;
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Props = {
  visible: boolean;
  onClose: () => void;
  records: DayRecord[];
  tasks: Task[];
  habits: Habit[];
  completions: Record<string, number[]>;
  freezes: number;
};

type Cell = {
  day: number;
  status: DayRecord["status"] | "none" | "future";
  /** Green depth bucket 0..5; -1 marks the frozen colour. */
  shadeBucket: number;
  /** Only fully completed days get a border. */
  border: boolean;
};

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

function cellOf(record: DayRecord | undefined): Cell {
  if (!record) return { day: 0, status: "none", shadeBucket: 0, border: false };
  const habitItems = record.items.filter((item) => item.kind === "habit");
  const fraction =
    habitItems.length === 0
      ? 0
      : habitItems.filter((item) => item.done).length / habitItems.length;
  return {
    day: record.day,
    status: record.status,
    shadeBucket: statusBucket(record.status, fraction),
    border: record.status === "complete",
  };
}

function statusBucket(status: DayRecord["status"], fraction: number) {
  if (status === "frozen") return -1;
  return Math.round(fraction * (SHADES.length - 1));
}

function cellStyle(cell: Cell) {
  const bg =
    cell.status === "frozen"
      ? `${FROZEN}4d`
      : cell.status === "none"
        ? "#1c1c22"
        : `${GREEN}${SHADES[Math.max(0, cell.shadeBucket)]}`;
  const done = cell.shadeBucket === SHADES.length - 1;
  return {
    width: CELL,
    height: CELL,
    borderRadius: 3,
    backgroundColor: bg,
    borderColor: done ? "#86efac" : "transparent",
    borderWidth: cell.border ? 1.5 : 0,
  };
}

/**
 * The habit calendar: a contribution-graph of finished days. Green depth says
 * how far the day's habits got; a border marks a fully completed day; a pale
 * blue square is one saved by a streak freeze.
 */
export function CalendarModal({
  visible,
  onClose,
  records,
  tasks,
  habits,
  completions,
  freezes,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const today = startOfToday();

  // Today is still running, so its square and detail read live state; every
  // other day comes from its frozen snapshot.
  const liveToday = useMemo(
    () => buildDayRecord(tasks, habits, completions, today),
    [tasks, habits, completions, today]
  );
  const recordMap = useMemo(() => {
    const map = new Map(records.map((r) => [r.day, r] as const));
    map.set(today, liveToday);
    return map;
  }, [records, today, liveToday]);

  const { weeks, monthLabels } = useMemo(() => {
    const currentWeekStart = today - new Date(today).getDay() * DAY;
    const gridStart = currentWeekStart - (WEEKS - 1) * DAY;
    const weeks = Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => gridStart + (w * 7 + d) * DAY)
    );
    const monthLabels = weeks.map((week, w) => {
      const month = new Date(week[0]).getMonth();
      const previous = w === 0 ? -1 : new Date(weeks[w - 1][0]).getMonth();
      return month !== previous ? MONTHS[month] : "";
    });
    return { weeks, monthLabels };
  }, [today]);

  const detail = selected != null ? recordMap.get(selected) : null;

  const statusLine = (record: DayRecord) => {
    switch (record.status) {
      case "complete":
        return { text: "Everything got done", color: GREEN };
      case "frozen":
        return { text: "Missed — saved by a streak freeze", color: FROZEN };
      case "idle":
        return { text: "Tasks only — habits unaffected", color: "#a1a1aa" };
      default:
        return { text: "Missed", color: "#fbbf24" };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-center bg-black/70 px-4"
        onPress={() => {
          setSelected(null);
          onClose();
        }}
      >
        <Pressable
          className="gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
          onPress={() => {}}
        >
          <View className="flex-row items-center justify-between">
            <UIText className="text-lg font-semibold">Calendar</UIText>
            <UIText muted className="text-xs">
              {freezes} freeze{freezes === 1 ? "" : "s"} (max 2)
            </UIText>
            <Pressable
              onPress={() => {
                setSelected(null);
                onClose();
              }}
              hitSlop={8}
              accessibilityLabel="Close calendar"
            >
              <Ionicons name="close" size={22} color="#a1a1aa" />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Month labels, aligned over their week column */}
              <View className="flex-row" style={{ marginLeft: CELL + GAP + 4 }}>
                {monthLabels.map((label, i) => (
                  <View key={i} style={{ width: CELL + GAP }}>
                    {label ? (
                      <UIText muted className="text-[9px]">
                        {label}
                      </UIText>
                    ) : null}
                  </View>
                ))}
              </View>
              <View className="flex-row" style={{ gap: GAP }}>
                <View style={{ gap: GAP, paddingRight: 4 }}>
                  {WEEKDAY_LABELS.map((label, i) => (
                    <View
                      key={i}
                      style={{ width: CELL, height: CELL, justifyContent: "center" }}
                    >
                      <UIText muted className="text-[9px] leading-none">
                        {label}
                      </UIText>
                    </View>
                  ))}
                </View>
                {weeks.map((week, w) => (
                  <View key={w} style={{ gap: GAP, width: CELL }}>
                    {week.map((day) => {
                      if (day > today) {
                        return <View key={day} style={{ width: CELL, height: CELL }} />;
                      }
                      const cell = cellOf(recordMap.get(day));
                      return (
                        <Pressable
                          key={day}
                          onPress={() => setSelected(day)}
                          style={[cellStyle(cell), cell.status === "none" && { opacity: 0.6 }]}
                          accessibilityLabel={`${dayLabel(day)}, ${cell.status}`}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Legend */}
          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <View className="flex-row items-center gap-1">
              {[0, 1, 2, 3, 4, 5].map((bucket) => (
                <View
                  key={bucket}
                  style={[cellStyle({ day: 0, status: "missed", shadeBucket: bucket, border: false }), { width: 10, height: 10 }]}
                />
              ))}
              <UIText muted className="text-[10px]">
                less → more
              </UIText>
            </View>
            <View style={[cellStyle({ day: 0, status: "missed", shadeBucket: 0, border: false }), { width: 10, height: 10 }]} />
            <UIText muted className="text-[10px]">
              none
            </UIText>
            <View style={[cellStyle({ day: 0, status: "complete", shadeBucket: 5, border: true }), { width: 10, height: 10 }]} />
            <UIText muted className="text-[10px]">
              bordered = all done
            </UIText>
            <View style={[cellStyle({ day: 0, status: "frozen", shadeBucket: -1, border: false }), { width: 10, height: 10 }]} />
            <UIText muted className="text-[10px]">
              frozen
            </UIText>
          </View>

          {/* Day detail */}
          {detail ? (
            <View style={{ maxHeight: 380 }}>
              <View className="flex-row items-center justify-between pb-2">
                <UIText className="font-semibold">{dayLabel(detail.day)}</UIText>
                <UIText className="text-xs font-semibold" style={{ color: statusLine(detail).color }}>
                  {statusLine(detail).text}
                </UIText>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {detail.items.length === 0 && (
                  <UIText muted className="py-6 text-center text-sm">
                    Nothing was tracked that day.
                  </UIText>
                )}
                {(["habit", "task"] as const).map((kind) => {
                  const items = detail.items.filter((item) => item.kind === kind);
                  if (!items.length) return null;
                  return (
                    <View key={kind} className="gap-1.5 pb-2">
                      <UIText muted className="pt-1 text-[10px] font-semibold uppercase tracking-wide">
                        {kind === "habit" ? "Habits" : "Tasks"}
                      </UIText>
                      {items.map((item) => (
                        <View
                          key={`${item.kind}-${item.id}`}
                          className="flex-row items-center gap-2.5 rounded-[6px] border border-zinc-800 bg-zinc-900 p-3"
                        >
                          <Ionicons
                            name={item.done ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color={item.done ? GREEN : "#fbbf24"}
                          />
                          <UIText
                            numberOfLines={2}
                            className={`flex-1 text-sm ${item.done ? "" : "text-zinc-400"}`}
                          >
                            {item.title}
                          </UIText>
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
                        </View>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <UIText muted className="text-[11px]">
              Tap a square to see that day&apos;s habits and tasks.
            </UIText>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
