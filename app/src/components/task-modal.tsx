import { useState, useRef } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { UIText } from "@/components/ui-text";
import { cn } from "@/lib/cn";
import { tagColor, cycleTagColor } from "@/lib/tags";
import { FREQUENCIES, Frequency, Task } from "@/lib/types";

const PRIMARY = "#f00359";

type Props = {
  visible: boolean;
  editing?: Task | null;
  allTags?: string[];
  onClose: () => void;
  onSubmit: (
    title: string,
    tags: string[],
    frequency: Frequency,
    deadline: number | null,
    count: number
  ) => void;
};

export function TaskModal({ visible, editing, allTags = [], onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("once");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [count, setCount] = useState(1);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  const titleRef = useRef<TextInput>(null);
  const tagRef = useRef<TextInput>(null);

  const addTag = (raw: string) => {
    const t = raw.replace(/^#/, "").trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        setTitle(editing?.title ?? "");
        setTags(editing?.tags ?? []);
        setTagInput("");
        setFrequency(editing?.frequency ?? "once");
        setDeadline(editing?.deadline ? new Date(editing.deadline) : null);
        setCount(editing?.count ?? 1);
        setPickerMode(null);
      }}
    >
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-zinc-950 border-t border-zinc-800 px-5 pt-4 pb-8 gap-4"
          onPress={() => { }}
        >
          <View className="flex-row items-center justify-between">
            <UIText className="font-semibold">
              {editing ? "Edit task" : "New task"}
            </UIText>
            <Pressable
              onPress={() => {
                if (!title.trim()) return;
                onSubmit(
                  title.trim(),
                  tags,
                  frequency,
                  deadline?.getTime() ?? null,
                  count
                );
                onClose();
              }}
              hitSlop={8}
            >
              <UIText
                className={cn(
                  "font-semibold",
                  title.trim() ? "" : "text-zinc-600"
                )}
                style={{ color: title.trim() ? PRIMARY : undefined }}
              >
                Save
              </UIText>
            </Pressable>
          </View>

          <TextInput
            ref={titleRef}
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor="#71717a"
            autoFocus={!editing}
            submitBehavior="submit"
            onSubmitEditing={() => tagRef.current?.focus()}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-zinc-100"
          />

          {/* Tags */}
          {tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <View
                  key={tag}
                  className="flex-row items-center gap-1 rounded-full pl-3 pr-1.5 py-1"
                  style={{ backgroundColor: `${tagColor(tag)}26` }}
                >
                  <Pressable onPress={() => cycleTagColor(tag)} hitSlop={4}>
                    <View
                      className="h-2.5 w-2.5 rounded-full mr-1"
                      style={{ backgroundColor: tagColor(tag) }}
                    />
                  </Pressable>
                  <UIText
                    className="text-xs font-medium"
                    style={{ color: tagColor(tag) }}
                  >
                    {tag}
                  </UIText>
                  <Pressable
                    onPress={() => setTags(tags.filter((t) => t !== tag))}
                    hitSlop={6}
                  >
                    <UIText
                      className="text-[10px]"
                      style={{ color: tagColor(tag) }}
                    >
                      ✕
                    </UIText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <TextInput
            ref={tagRef}
            value={tagInput}
            onChangeText={(text) => {
              if (/\s$/.test(text)) {
                addTag(text);
              } else {
                setTagInput(text);
              }
            }}
            onSubmitEditing={() => addTag(tagInput)}
            onEndEditing={(e) =>
              e.nativeEvent.text && addTag(e.nativeEvent.text)
            }
            placeholder="Add a tag and press enter"
            placeholderTextColor="#71717a"
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-zinc-100 text-sm"
          />

          {/* Tag suggestions */}
          {tagInput.trim() && (
            <View className="flex-row flex-wrap gap-2">
              {allTags
                .filter(
                  (t) =>
                    t.startsWith(tagInput.trim().toLowerCase()) &&
                    !tags.includes(t)
                )
                .slice(0, 6)
                .map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => addTag(t)}
                    className="rounded-full px-3 py-1.5"
                    style={{ backgroundColor: `${tagColor(t)}26` }}
                  >
                    <UIText
                      className="text-xs font-medium"
                      style={{ color: tagColor(t) }}
                    >
                      {t}
                    </UIText>
                  </Pressable>
                ))}
            </View>
          )}

          {/* Count */}
          <View className="flex-row items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3">
            <UIText muted className="text-sm">
              Count
            </UIText>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => setCount(Math.max(1, count - 1))}
                disabled={count <= 1}
                hitSlop={6}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={24}
                  color={count <= 1 ? "#3f3f46" : "#a1a1aa"}
                />
              </Pressable>
              <UIText className="text-base font-semibold w-8 text-center">
                {count}
              </UIText>
              <Pressable
                onPress={() => setCount(count + 1)}
                hitSlop={6}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color="#a1a1aa"
                />
              </Pressable>
            </View>
          </View>

          {/* Deadline */}
          <Pressable
            onPress={() => setPickerMode("date")}
            className="flex-row items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
          >
            <Ionicons name="calendar-outline" size={16} color="#71717a" />
            <UIText muted={!deadline} className="text-sm flex-1">
              {deadline
                ? deadline.toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
                : "Deadline (optional)"}
            </UIText>
            {deadline && (
              <Pressable onPress={() => setDeadline(null)} hitSlop={8}>
                <Ionicons name="close" size={16} color="#71717a" />
              </Pressable>
            )}
          </Pressable>

          {pickerMode && (
            <DateTimePicker
              value={deadline ?? new Date()}
              mode={pickerMode}
              onValueChange={(event, date) => {
                void event;
                if (pickerMode === "date") {
                  if (date) {
                    const next = deadline ?? new Date();
                    next.setFullYear(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate()
                    );
                    setDeadline(new Date(next));
                    setPickerMode("time");
                  } else {
                    setPickerMode(null);
                  }
                } else {
                  if (date) {
                    const next = deadline ?? new Date();
                    next.setHours(date.getHours(), date.getMinutes());
                    setDeadline(new Date(next));
                  }
                  setPickerMode(null);
                }
              }}
              onDismiss={() => setPickerMode(null)}
            />
          )}

          {/* Schedule */}
          <View className="gap-2">
            <UIText muted className="text-xs uppercase tracking-wide">
              Schedule
            </UIText>
            <View className="flex-row flex-wrap gap-2">
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f.value}
                  onPress={() => setFrequency(f.value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 border",
                    frequency === f.value ? "" : "border-zinc-700 bg-zinc-900"
                  )}
                  style={
                    frequency === f.value
                      ? { backgroundColor: PRIMARY, borderColor: PRIMARY }
                      : undefined
                  }
                >
                  <UIText
                    className={cn(
                      "text-xs font-medium",
                      frequency === f.value ? "text-white" : "text-zinc-400"
                    )}
                  >
                    {f.label}
                  </UIText>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
