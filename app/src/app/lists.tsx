import { useMemo, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ConfirmModal } from "@/components/confirm-modal";
import { UIText } from "@/components/ui-text";
import {
  addList,
  deleteList,
  useLists,
  useListsReady,
  type List,
} from "@/lib/lists-store";

export default function Lists() {
  const lists = useLists();
  const ready = useListsReady();
  const [name, setName] = useState("");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<List | null>(null);

  const create = () => {
    const n = name.trim();
    if (!n) return;
    addList(n);
    setName("");
  };

  // Searching looks at the list's name and everything inside it, so a list can
  // be found by a thing written on it weeks ago.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter(
      (list) =>
        list.name.toLowerCase().includes(q) ||
        list.items.some((item) => item.text.toLowerCase().includes(q))
    );
  }, [lists, query]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText className="text-lg font-semibold">Lists</UIText>
        <Pressable
          onPress={() => {
            if (searching) {
              setSearching(false);
              setQuery("");
            } else {
              setSearching(true);
            }
          }}
          hitSlop={8}
          accessibilityLabel="Search lists"
        >
          <Ionicons name={searching ? "close" : "search"} size={22} color="#a1a1aa" />
        </Pressable>
      </View>

      {searching && (
        <View className="flex-row gap-2 px-5 pb-2 pt-1">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search lists and items..."
            placeholderTextColor="#71717a"
            autoFocus
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-zinc-100"
          />
        </View>
      )}

      <View className="flex-row gap-2 px-5 py-3">
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={create}
          placeholder="New list (movies, anime, tasks...)"
          placeholderTextColor="#71717a"
          className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-zinc-100"
        />
      </View>

      <FlatList
        data={matches}
        keyExtractor={(l) => l.id}
        contentContainerClassName="px-5 pb-10 gap-2"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            {ready
              ? query.trim()
                ? "Nothing matches."
                : "No lists yet."
              : ""}
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
                {item.items.filter((i) => i.done).length}/{item.items.length}
              </UIText>
            </View>
            <Pressable
              onPress={() => setPendingDelete(item)}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color="#71717a" />
            </Pressable>
          </Pressable>
        )}
      />

      <ConfirmModal
        visible={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name ?? ""}"?`}
        body="The list and its items are removed. This cannot be undone."
        onConfirm={() => {
          if (pendingDelete) deleteList(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  );
}
