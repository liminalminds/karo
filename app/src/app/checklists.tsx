import { useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ConfirmModal } from "@/components/confirm-modal";
import { UIText } from "@/components/ui-text";
import {
  addChecklist,
  deleteChecklist,
  useChecklists,
  useChecklistsReady,
  type Checklist,
} from "@/lib/checklists-store";

export default function Checklists() {
  const checklists = useChecklists();
  const ready = useChecklistsReady();
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Checklist | null>(null);

  const create = () => {
    const n = name.trim();
    if (!n) return;
    addChecklist(n);
    setName("");
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText className="text-lg font-semibold">Checklists</UIText>
        <View className="w-6" />
      </View>

      <View className="flex-row gap-2 px-5 py-3">
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={create}
          placeholder="New checklist (travel, night routine...)"
          placeholderTextColor="#71717a"
          className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-zinc-100"
        />
      </View>

      <FlatList
        data={checklists}
        keyExtractor={(c) => c.id}
        contentContainerClassName="px-5 pb-10 gap-2"
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            {ready ? "No checklists yet." : ""}
          </UIText>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/checklist/${item.id}`)}
            className="flex-row items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-4"
          >
            <Ionicons name="checkbox-outline" size={18} color="#f00359" />
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
        body="The checklist and its items are removed. This cannot be undone."
        onConfirm={() => {
          if (pendingDelete) deleteChecklist(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  );
}
