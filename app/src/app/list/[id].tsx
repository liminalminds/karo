import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { UIText } from "@/components/ui-text";
import {
  addItem,
  deleteItem,
  getList,
  useLists,
  toggleItem,
} from "@/lib/lists-store";

export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lists = useLists();
  const list = getList(id as string) ?? lists.find((l) => l.id === id);
  const [text, setText] = useState("");
  const ref = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  if (!list) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center">
        <UIText muted>List not found.</UIText>
      </SafeAreaView>
    );
  }


  const add = () => {
    const t = text.trim();
    if (!t) return;
    addItem(list.id, t);
    setText("");
    ref.current?.focus()
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText className="text-lg font-semibold">{list.name}</UIText>
        <View className="w-6" />
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
          style={{ backgroundColor: "#f00359" }}
        >
          <Ionicons name="add" size={22} color="white" />
        </Pressable>
      </View>

      <FlatList
        data={list.items}
        keyExtractor={(i) => i.id}
        contentContainerClassName="px-5 pb-10 gap-2"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            No items yet.
          </UIText>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <Pressable onPress={() => toggleItem(list.id, item.id)} hitSlop={6}>
              <View
                className={`h-5 w-5 items-center justify-center rounded-full border ${item.done ? "" : "border-zinc-600"
                  }`}
                style={
                  item.done
                    ? { backgroundColor: "#f00359", borderColor: "#f00359" }
                    : undefined
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
            <Pressable onPress={() => deleteItem(list.id, item.id)} hitSlop={8}>
              <Ionicons name="close" size={18} color="#71717a" />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
