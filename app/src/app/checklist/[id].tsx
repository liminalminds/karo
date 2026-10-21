import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Celebration } from "@/components/celebrate";
import { UIText } from "@/components/ui-text";
import {
  addItem,
  deleteItem,
  getChecklist,
  resetChecklist,
  toggleItem,
  useChecklists,
  useChecklistsReady,
} from "@/lib/checklists-store";

const PRIMARY = "#f00359";

export default function ChecklistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const checklists = useChecklists();
  const ready = useChecklistsReady();
  const checklist =
    getChecklist(id as string) ?? checklists.find((c) => c.id === id);
  const [text, setText] = useState("");
  const ref = useRef<TextInput>(null);
  // Every item of the run being behind a tick is worth one celebration; the
  // boundary ref keeps a replay from firing while the list stays complete.
  const [celebrateRun, setCelebrateRun] = useState(0);
  const celebratedRef = useRef(false);
  const allDone =
    checklist != null &&
    checklist.items.length > 0 &&
    checklist.items.every((i) => i.done);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (allDone && !celebratedRef.current) {
      celebratedRef.current = true;
      // The bump goes through a frame so it never lands mid-render.
      const id = requestAnimationFrame(() => setCelebrateRun((r) => r + 1));
      return () => cancelAnimationFrame(id);
    }
    if (!allDone) celebratedRef.current = false;
  }, [allDone]);

  // A missing checklist before hydration finishes is a loading state, not a 404.
  if (!checklist) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center">
        <UIText muted>{ready ? "Checklist not found." : ""}</UIText>
      </SafeAreaView>
    );
  }

  const add = () => {
    const t = text.trim();
    if (!t) return;
    addItem(checklist.id, t);
    setText("");
    ref.current?.focus();
  };

  const done = checklist.items.filter((i) => i.done).length;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText className="text-lg font-semibold">{checklist.name}</UIText>
        {/* Starting the next run: clears the checks, keeps the template. */}
        <Pressable onPress={() => resetChecklist(checklist.id)} hitSlop={8}>
          <Ionicons name="refresh" size={22} color="#a1a1aa" />
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between px-5 pb-1">
        <UIText muted className="text-xs">
          {done}/{checklist.items.length} done
        </UIText>
        {allDone && (
          <UIText className="text-xs font-semibold" style={{ color: "#34d399" }}>
            All done — tap refresh for the next run
          </UIText>
        )}
      </View>

      <View className="flex-row gap-2 px-5 py-3">
        <TextInput
          submitBehavior={"submit"}
          ref={ref}
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          placeholder="Add an item..."
          placeholderTextColor="#71717a"
          className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-zinc-100"
        />
        <Pressable
          onPress={add}
          className="items-center justify-center rounded-xl px-4 active:opacity-80"
          style={{ backgroundColor: PRIMARY }}
        >
          <Ionicons name="add" size={22} color="white" />
        </Pressable>
      </View>

      <FlatList
        data={checklist.items}
        keyExtractor={(i) => i.id}
        contentContainerClassName="px-5 pb-10 gap-2"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            No items yet.
          </UIText>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 rounded-[6px] bg-zinc-900 border border-zinc-800 p-4">
            <Pressable onPress={() => toggleItem(checklist.id, item.id)} hitSlop={6}>
              <View
                className={`h-5 w-5 items-center justify-center border ${item.done ? "" : "border-zinc-600"}`}
                style={
                  item.done
                    ? { backgroundColor: PRIMARY, borderColor: PRIMARY, borderRadius: 3 }
                    : { borderRadius: 3 }
                }
              >
                {item.done && (
                  <Ionicons name="checkmark" size={12} color="white" />
                )}
              </View>
            </Pressable>
            <UIText
              className={`flex-1 ${item.done ? "line-through opacity-40" : ""}`}
            >
              {item.text}
            </UIText>
            <Pressable onPress={() => deleteItem(checklist.id, item.id)} hitSlop={8}>
              <Ionicons name="close" size={18} color="#71717a" />
            </Pressable>
          </View>
        )}
      />

      <Celebration run={celebrateRun} />
    </SafeAreaView>
  );
}
