import { useState, useRef } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { UIText } from "@/components/ui-text";
import { cn } from "@/lib/cn";
import { cycleTagColor, ensureTag, tagColor } from "@/lib/tags";
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
  // Whether this open already handed its content to onSubmit, so a plain close
  // (backdrop, back button) can't double-submit or retry a failed draft.
  const submittedRef = useRef(false);

  const normalize = (raw: string) =>
    raw.replace(/^#/, "").trim().toLowerCase();

  const addTag = (raw: string) => {
    const t = normalize(raw);
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      // Registers the tag with a stable stored colour, never overwriting a
      // colour the user already picked in the tags menu.
      ensureTag(t);
    }
    setTagInput("");
  };

  // Anything typed but not yet committed becomes a real tag on save, so
  // closing the sheet never silently drops the text in the field.
  const typed = [...tags, tagInput].map(normalize).filter(Boolean);
  const withInput = [...new Set(typed)];

  const save = () => {
    if (!title.trim()) return;
    submittedRef.current = true;
    onSubmit(
      title.trim(),
      withInput,
      frequency,
      deadline?.getTime() ?? null,
      count
    );
    onClose();
  };

  /**
   * Autosave: content typed but never confirmed still sticks when the modal
   * goes away. Editing skips the rewrite unless something actually changed.
   */
  const handleClose = () => {
    const unchanged =
      editing != null &&
      title.trim() === editing.title &&
      JSON.stringify(withInput) === JSON.stringify(editing.tags);
    if (!submittedRef.current && title.trim() && !unchanged) {
      submittedRef.current = true;
      onSubmit(
        title.trim(),
        withInput,
        frequency,
        deadline?.getTime() ?? null,
        count
      );
    }
    onClose();
  };

  // Chips to pick from: every known tag that is not on the task yet, narrowed
  // to what matches the input while something is typed.
  const pickable = allTags
    .filter((t) => !tags.includes(t))
    .filter((t) => {
      const q = normalize(tagInput);
      return !q || t.includes(q);
    })
    .slice(0, 12);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={() => {
        setTitle(editing?.title ?? "");
        setTags(editing?.tags ?? []);
        setTagInput("");
        setFrequency(editing?.frequency ?? "once");
        setDeadline(editing?.deadline ? new Date(editing.deadline) : null);
        setCount(editing?.count ?? 1);
        setPickerMode(null);
        submittedRef.current = false;
        // autoFocus inside transparent modals is flaky on Android, so focus
        // is forced once the sheet settles. A second pass covers the case
        // where the first lands mid-animation and the keyboard is skipped.
        setTimeout(() => titleRef.current?.focus(), 150);
        setTimeout(() => titleRef.current?.focus(), 400);
      }}
    >
      <Pressable className="flex-1 justify-center bg-black/70 px-5" onPress={handleClose}>
        {/* KeyboardAware: the sheet rides above the keyboard instead of
            letting it cover the tag and schedule rows. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          pointerEvents="box-none"
        >
          <Pressable
            className="max-h-[85%] rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
            onPress={() => { }}
          >
            {/* Scrollable body: everything the keyboard would otherwise hide
                stays reachable, and taps on chips work while it is open. */}
            <ScrollView
              contentContainerClassName="gap-4"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
            >
              <View className="flex-row items-center justify-between">
                <UIText className="font-semibold">
                  {editing ? "Edit task" : "New task"}
                </UIText>
                <Pressable
                  onPress={save}
                  className="rounded-full border px-4 py-1.5"
                  style={{
                    backgroundColor: title.trim() ? PRIMARY : "#27272a",
                    borderColor: title.trim() ? PRIMARY : "#3f3f46",
                  }}
                >
                  <UIText className="text-sm font-semibold" style={{ color: "white" }}>
                    ADD
                  </UIText>
                </Pressable>
              </View>

              {/* Multiline titles: the enter key writes a newline instead of leaving. */}
              <TextInput
                ref={titleRef}
                value={title}
                onChangeText={setTitle}
                placeholder="Task title"
                placeholderTextColor="#71717a"
                autoFocus={!editing}
                multiline
                submitBehavior="newline"
                className="min-h-[48px] rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-zinc-100"
              />

              {/* Selected tags */}
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
              <View className="flex-row items-center gap-2">
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
                  className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-zinc-100 text-sm"
                />
                {/* Tapping this creates the typed tag without leaving the keyboard. */}
                <Pressable
                  onPress={() => addTag(tagInput)}
                  disabled={!normalize(tagInput)}
                  hitSlop={6}
                  accessibilityLabel="Create tag"
                  className="h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 active:opacity-70"
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={normalize(tagInput) ? PRIMARY : "#3f3f46"}
                  />
                </Pressable>
              </View>

              {/* Existing tags as a chipset: pick with a tap, filter by typing. */}
              {pickable.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {pickable.map((t) => (
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
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
