import { Modal, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UIText } from "@/components/ui-text";
import { tagColor } from "@/lib/tags";

type Props = {
  visible: boolean;
  tags: string[];
  tagColors?: Record<string, string>;
  /** Currently selected tags; an empty set means "no filter". */
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
  onClose: () => void;
};

/**
 * Multi-select tag filter: tapping chips narrows the list to items that
 * carry any of the picked tags. An empty selection shows everything.
 */
export function TagFilterModal({
  visible,
  tags,
  tagColors = {},
  selected,
  onToggle,
  onClear,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-center bg-black/70 px-6" onPress={onClose}>
        <Pressable
          className="max-h-[70%] gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
          onPress={() => {}}
        >
          <View className="flex-row items-center justify-between">
            <UIText className="text-lg font-semibold">Filter by tag</UIText>
            {selected.length > 0 && (
              <Pressable onPress={onClear} hitSlop={8}>
                <UIText className="text-sm font-medium" style={{ color: "#f00359" }}>
                  Clear
                </UIText>
              </Pressable>
            )}
          </View>

          {tags.length === 0 ? (
            <UIText muted className="text-sm">
              No tags yet.
            </UIText>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selected.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => onToggle(tag)}
                    accessibilityRole="button"
                    accessibilityLabel={`${active ? "Remove" : "Add"} filter ${tag}`}
                    className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
                    style={{
                      borderColor: active ? tagColor(tag, tagColors) : "#3f3f46",
                      backgroundColor: active ? `${tagColor(tag, tagColors)}26` : "#18181b",
                    }}
                  >
                    <View
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tagColor(tag, tagColors) }}
                    />
                    <UIText
                      className={active ? "text-xs font-semibold" : "text-xs"}
                      style={{ color: active ? tagColor(tag, tagColors) : "#a1a1aa" }}
                    >
                      {tag}
                    </UIText>
                    {active && (
                      <Ionicons name="checkmark" size={14} color={tagColor(tag, tagColors)} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          <UIText muted className="text-[11px]">
            Items with any selected tag are shown. Clear to see everything.
          </UIText>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
