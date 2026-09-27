import { useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { UIText } from "@/components/ui-text";
import {
  addList,
  deleteList,
  useLists,
} from "@/lib/lists-store";

export default function Lists() {
  const lists = useLists();
  const [name, setName] = useState("");

  const create = () => {
    const n = name.trim();
    if (!n) return;
    addList(n);
    setName("");
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText className="text-lg font-semibold">Lists</UIText>
        <View className="w-6" />
      </View>

      <View className="flex-row gap-2 px-5 py-3">
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={create}
          placeholder="New list (movies, anime, tasks...)"
          placeholderTextColor="#71717a"
          className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-zinc-100"
        />
        <Pressable
          onPress={create}
          className="items-center justify-center rounded-xl px-4 active:opacity-80"
          style={{ backgroundColor: "#f00359" }}
        >
          <Ionicons name="add" size={22} color="white" />
        </Pressable>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        contentContainerClassName="px-5 pb-10 gap-2"
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            No lists yet.
          </UIText>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/list/${item.id}`)}
            className="flex-row items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-4"
          >
            <Ionicons name="list-outline" size={18} color="#f00359" />
            <View className="flex-1">
              <UIText>{item.name}</UIText>
              <UIText muted className="text-xs">
                {item.items.filter((i) => i.done).length}/{item.items.length}{" "}
                done
              </UIText>
            </View>
            <Pressable
              onPress={() => deleteList(item.id)}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color="#71717a" />
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
