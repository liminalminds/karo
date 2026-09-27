import { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UIText } from "@/components/ui-text";
import { tagColor } from "@/lib/tags";

type Props = {
  visible: boolean;
  tags: string[];
  onClose: () => void;
  onRename: (oldTag: string, newTag: string) => void;
  onDelete: (tag: string) => void;
};

export function TagManager({ visible, tags, onClose, onRename, onDelete }: Props) {
  const [newTag, setNewTag] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-center px-6" onPress={onClose}>
        <Pressable
          className="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 gap-4 max-h-[70%]"
          onPress={() => {}}
        >
          <UIText className="text-lg font-semibold">Tags</UIText>

          {tags.length === 0 && (
            <UIText muted className="text-sm">
              No tags yet.
            </UIText>
          )}

          <View className="gap-2">
            {tags.map((tag) =>
              renaming === tag ? (
                <View key={tag} className="flex-row items-center gap-2">
                  <TextInput
                    value={renameValue}
                    onChangeText={setRenameValue}
                    autoFocus
                    onSubmitEditing={() => {
                      if (renameValue.trim()) onRename(tag, renameValue.trim().toLowerCase());
                      setRenaming(null);
                    }}
                    className="flex-1 rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-zinc-100 text-sm"
                  />
                  <Pressable
                    onPress={() => {
                      if (renameValue.trim()) onRename(tag, renameValue.trim().toLowerCase());
                      setRenaming(null);
                    }}
                    hitSlop={6}
                  >
                    <Ionicons name="checkmark" size={20} color="#a1a1aa" />
                  </Pressable>
                </View>
              ) : (
                <View key={tag} className="flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tagColor(tag) }}
                  />
                  <UIText className="flex-1 text-sm">{tag}</UIText>
                  <Pressable
                    onPress={() => {
                      setRenaming(tag);
                      setRenameValue(tag);
                    }}
                    hitSlop={6}
                  >
                    <Ionicons name="pencil" size={18} color="#a1a1aa" />
                  </Pressable>
                  <Pressable onPress={() => onDelete(tag)} hitSlop={6}>
                    <Ionicons name="trash-outline" size={18} color="#f87171" />
                  </Pressable>
                </View>
              )
            )}
          </View>

          <View className="flex-row items-center gap-2">
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="New tag"
              placeholderTextColor="#71717a"
              className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-100 text-sm"
            />
            <Pressable
              onPress={() => {
                const t = newTag.trim().toLowerCase();
                if (t && !tags.includes(t)) onRename("", t);
                setNewTag("");
              }}
              hitSlop={6}
            >
              <Ionicons name="add" size={22} color="#f00359" />
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
