import { useRef, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UIText } from "@/components/ui-text";
import { cn } from "@/lib/cn";
import { cycleTagColor, defaultTagColor, setTagColor, tagColor } from "@/lib/tags";
import type { Habit } from "@/lib/types";

const PRIMARY = "#f00359";

type Props = {
  visible: boolean;
  editing?: Habit | null;
  allTags?: string[];
  onClose: () => void;
  onSubmit: (title: string, tags: string[], count: number) => void;
};

export function HabitModal({ visible, editing, allTags = [], onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [count, setCount] = useState(1);
  const titleRef = useRef<TextInput>(null);
  const tagRef = useRef<TextInput>(null);

  const addTag = (raw: string) => {
    const t = raw.replace(/^#/, "").trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      // A brand-new tag gets a stored colour straight away so it looks the
      // same here as it will everywhere else.
      setTagColor(t, defaultTagColor(t));
    }
    setTagInput("");
  };

  const normalize = (raw: string) => raw.replace(/^#/, "").trim().toLowerCase();
  const withInput = [...new Set([...tags, tagInput].map(normalize).filter(Boolean))];

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
        setCount(editing?.count ?? 1);
      }}
    >
      <Pressable className="flex-1 justify-center bg-black/70 px-5" onPress={onClose}>
        <Pressable
          className="w-full gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
          onPress={() => {}}
        >
          <View className="flex-row items-center justify-between">
            <UIText className="font-semibold">
              {editing ? "Edit habit" : "New habit"}
            </UIText>
            <Pressable
              onPress={() => {
                if (!title.trim()) return;
                onSubmit(title.trim(), withInput, count);
                onClose();
              }}
              hitSlop={8}
            >
              <UIText
                className={cn("font-semibold", title.trim() ? "" : "text-zinc-600")}
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
            placeholder="Habit title"
            placeholderTextColor="#71717a"
            autoFocus={!editing}
            submitBehavior="submit"
            onSubmitEditing={() => tagRef.current?.focus()}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100"
          />

          {tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <View
                  key={tag}
                  className="flex-row items-center gap-1 rounded-full py-1 pl-3 pr-1.5"
                  style={{ backgroundColor: `${tagColor(tag)}26` }}
                >
                  <Pressable onPress={() => cycleTagColor(tag)} hitSlop={4}>
                    <View
                      className="mr-1 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tagColor(tag) }}
                    />
                  </Pressable>
                  <UIText className="text-xs font-medium" style={{ color: tagColor(tag) }}>
                    {tag}
                  </UIText>
                  <Pressable onPress={() => setTags(tags.filter((t) => t !== tag))} hitSlop={6}>
                    <UIText className="text-[10px]" style={{ color: tagColor(tag) }}>
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
                if (/\s$/.test(text)) addTag(text);
                else setTagInput(text);
              }}
              onSubmitEditing={() => addTag(tagInput)}
              onEndEditing={(e) => e.nativeEvent.text && addTag(e.nativeEvent.text)}
              placeholder="Add a tag and press enter"
              placeholderTextColor="#71717a"
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
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

          {tagInput.trim() && (
            <View className="flex-row flex-wrap gap-2">
              {allTags
                .filter(
                  (t) => t.startsWith(tagInput.trim().toLowerCase()) && !tags.includes(t)
                )
                .slice(0, 6)
                .map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => addTag(t)}
                    className="rounded-full px-3 py-1.5"
                    style={{ backgroundColor: `${tagColor(t)}26` }}
                  >
                    <UIText className="text-xs font-medium" style={{ color: tagColor(t) }}>
                      {t}
                    </UIText>
                  </Pressable>
                ))}
            </View>
          )}

          {/* Daily count */}
          <View className="flex-row items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <View>
              <UIText className="text-sm">Per day</UIText>
              <UIText muted className="text-[11px]">
                How many times a day this counts
              </UIText>
            </View>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => setCount(Math.max(1, count - 1))} disabled={count <= 1} hitSlop={6}>
                <Ionicons
                  name="remove-circle-outline"
                  size={24}
                  color={count <= 1 ? "#3f3f46" : "#a1a1aa"}
                />
              </Pressable>
              <UIText className="w-8 text-center text-base font-semibold">{count}</UIText>
              <Pressable onPress={() => setCount(count + 1)} hitSlop={6}>
                <Ionicons name="add-circle-outline" size={24} color="#a1a1aa" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}