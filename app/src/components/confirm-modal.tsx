import { Modal, Pressable, View } from "react-native";
import { UIText } from "@/components/ui-text";

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** A yes/no dialog for destructive actions, centred like the other modals. */
export function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel = "Yes",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-center bg-black/70 px-8" onPress={onCancel}>
        <Pressable
          className="gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
          onPress={() => {}}
        >
          <View>
            <UIText className="text-lg font-semibold">{title}</UIText>
            {body && (
              <UIText muted className="mt-1 text-sm">
                {body}
              </UIText>
            )}
          </View>
          <View className="flex-row justify-end gap-3">
            <Pressable
              onPress={onCancel}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 active:opacity-70"
            >
              <UIText className="text-sm font-semibold">No</UIText>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="rounded-xl bg-red-500/90 px-4 py-2.5 active:opacity-70"
            >
              <UIText className="text-sm font-semibold text-zinc-950">
                {confirmLabel}
              </UIText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
