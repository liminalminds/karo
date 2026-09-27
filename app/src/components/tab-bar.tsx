import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UIText } from "@/components/ui-text";

const PRIMARY = "#f00359";

type Props = {
  onLists: () => void;
  onMic: () => void;
};

export function TabBar({ onLists, onMic }: Props) {
  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 flex-row items-end justify-around border-t border-zinc-800 bg-zinc-950/95 px-2 pb-6 pt-2"
    >
      {/* Lists (scroll) */}
      <TabButton onPress={onLists}>
        <UIText className="text-2xl">📜</UIText>
      </TabButton>

      {/* Placeholder */}
      <TabButton>
        <Ionicons name="stats-chart-outline" size={22} color="white" />
      </TabButton>

      {/* Voice recording */}
      <Pressable
        onPress={onMic}
        className="-mt-6 h-16 w-16 items-center justify-center rounded-full active:opacity-80"
        style={{ backgroundColor: PRIMARY }}
      >
        <Ionicons name="mic" size={30} color="white" />
      </Pressable>

      {/* Placeholder */}
      <TabButton>
        <Ionicons name="settings-outline" size={22} color="white" />
      </TabButton>

      {/* Placeholder */}
      <TabButton>
        <Ionicons name="person-outline" size={22} color="white" />
      </TabButton>
    </View>
  );
}

function TabButton({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center py-2">
      {children}
    </Pressable>
  );
}
