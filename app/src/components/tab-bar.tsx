import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MicButton } from "@/components/mic-button";

type Props = {
  onLists: () => void;
  onHistory: () => void;
  /** Called once a take is saved so the screen can open the list. */
  onSavedRecording: () => void;
  onPomodoro: () => void;
};

export function TabBar({ onLists, onHistory, onSavedRecording, onPomodoro }: Props) {
  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 flex-row items-end justify-around border-t border-zinc-800 bg-zinc-950/95 px-2 pb-6 pt-2"
    >
      {/* Lists */}
      <TabButton label="Lists" onPress={onLists}>
        <Ionicons name="albums-outline" size={22} color="white" />
      </TabButton>

      {/* History */}
      <TabButton label="History" onPress={onHistory}>
        <Ionicons name="stats-chart-outline" size={22} color="white" />
      </TabButton>

      {/* Voice recording */}
      <MicButton onSaved={onSavedRecording} />

      {/* Pomodoro timer */}
      <TabButton label="Timer" onPress={onPomodoro}>
        <Ionicons name="hourglass-outline" size={22} color="white" />
      </TabButton>

      {/* Placeholder */}
      <TabButton label="You">
        <Ionicons name="person-outline" size={22} color="white" />
      </TabButton>
    </View>
  );
}

function TabButton({
  children,
  onPress,
  label,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 items-center justify-center py-2"
    >
      {children}
    </Pressable>
  );
}
