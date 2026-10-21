import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { UIText } from "@/components/ui-text";
import {
  deleteNote,
  getNote,
  saveNote,
  useNotes,
  useNotesReady,
} from "@/lib/notes-store";

const DEBOUNCE_MS = 400;

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notes = useNotes();
  const ready = useNotesReady();
  const note = getNote(id as string) ?? notes.find((n) => n.id === id);
  const [text, setText] = useState(note?.text ?? "");
  // The debounced write lives here; the timer is cleared and the pending text
  // flushed when the note screen goes away.
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = () => {
    if (pendingRef.current == null) return;
    const pending = pendingRef.current;
    pendingRef.current = null;
    // A note left empty is an abandoned draft, not a slot to keep.
    if (pending.trim() === "") deleteNote(id as string);
    else saveNote(id as string, pending);
  };

  const onChange = (value: string) => {
    setText(value);
    pendingRef.current = value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!note) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center">
        <UIText muted>{ready ? "Note not found." : ""}</UIText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText muted className="text-xs">
          saved automatically
        </UIText>
        <View className="w-6" />
      </View>

      <TextInput
        value={text}
        onChangeText={onChange}
        placeholder="Write something..."
        placeholderTextColor="#71717a"
        multiline
        textAlignVertical="top"
        autoFocus
        submitBehavior="newline"
        className="flex-1 px-5 py-2 text-zinc-100 text-[15px] leading-6"
      />
    </SafeAreaView>
  );
}
