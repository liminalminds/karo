import { useRouter } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { UIText } from "@/components/ui-text";
import {
  addNote,
  useNotes,
  useNotesReady,
  type Note,
} from "@/lib/notes-store";

const PRIMARY = "#f00359";

/** Relative edit time for the card footer. */
function age(updatedAt: number) {
  const minutes = Math.floor((Date.now() - updatedAt) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(updatedAt).toLocaleDateString();
}

/** First line reads as the title; the rest is the preview underneath. */
function lines(note: Note) {
  const [first, ...rest] = note.text.split("\n");
  return { title: first.trim() || "Untitled note", body: rest.join(" ").trim() };
}

export default function Notes() {
  const notes = useNotes();
  const ready = useNotesReady();
  const router = useRouter();

  const create = () => {
    const id = addNote();
    router.push(`/note/${id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText className="text-lg font-semibold">Notes</UIText>
        <Pressable onPress={create} hitSlop={8}>
          <Ionicons name="add" size={24} color={PRIMARY} />
        </Pressable>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10, paddingHorizontal: 20 }}
        contentContainerClassName="py-3 pb-10 gap-2.5"
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            {ready ? "No notes yet. Tap + to write one." : ""}
          </UIText>
        }
        renderItem={({ item }) => {
          const { title, body } = lines(item);
          return (
            <Pressable
              onPress={() => router.push(`/note/${item.id}`)}
              className="flex-1 gap-1 rounded-xl bg-zinc-900 border border-zinc-800 p-3.5 active:opacity-80"
            >
              <UIText numberOfLines={1} className="text-sm font-semibold">
                {title}
              </UIText>
              <UIText muted numberOfLines={4} className="text-xs leading-4">
                {body || " "}
              </UIText>
              <UIText muted className="mt-auto pt-1 text-2xs">
                {age(item.updatedAt)}
              </UIText>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
