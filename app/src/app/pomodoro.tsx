import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { router } from "expo-router";
import { UIText } from "@/components/ui-text";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

type Phase = "work" | "break";

function format(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function Pomodoro() {
  const [phase, setPhase] = useState<Phase>("work");
  const [remaining, setRemaining] = useState(WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState(true);
  // The chime must fire from inside the interval's state updater, so the flag
  // is kept in a ref via an effect rather than captured by the closure.
  const soundRef = useRef(sound);
  const chimeRef = useRef<{ play: () => void } | null>(null);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    try {
      const player = createAudioPlayer(require("@/assets/audio/chime.wav"));
      chimeRef.current = { play: () => player.play() };
    } catch (error) {
      console.warn("[pomodoro] chime unavailable", error);
    }
  }, []);

  const total = phase === "work" ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 1) return prev - 1;
        // Phase ends: switch, reset the clock, and cue the chime.
        if (soundRef.current) {
          void setAudioModeAsync({ playsInSilentMode: true }).catch(() => { });
          chimeRef.current?.play();
        }
        setPhase((p) => (p === "work" ? "break" : "work"));
        setRunning(false);
        return total;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, total]);

  const progress = 1 - remaining / total;
  const barWidth = `${Math.round(progress * 100)}%` as const;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <Pressable
          onPress={() => setSound((s) => !s)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={sound ? "Mute end-of-interval chime" : "Play end-of-interval chime"}
        >
          <Ionicons
            name="musical-notes"
            size={20}
            color={sound ? "#f00359" : "#52525b"}
          />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-8 pb-16">
        <UIText
          className={phase === "work" ? "text-sm uppercase tracking-wide text-zinc-500" : "text-sm uppercase tracking-wide text-emerald-500"}
        >
          {phase === "work" ? "Focus" : "Break"}
        </UIText>

        <UIText className="mt-2 text-6xl font-bold tabular-nums">
          {format(remaining)}
        </UIText>

        {/* Progress track */}
        <View className="mt-8 h-2 w-full overflow-hidden rounded-full bg-zinc-900">
          <View
            className="h-full rounded-full"
            style={{
              width: barWidth,
              backgroundColor: phase === "work" ? "#f00359" : "#10b981",
            }}
          />
        </View>

        <View className="mt-10 flex-row items-center gap-6">
          <Pressable
            onPress={() => {
              setPhase((p) => (p === "work" ? "break" : "work"));
              setRemaining(total);
              setRunning(false);
            }}
            hitSlop={8}
            accessibilityLabel="Switch phase"
            className="h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 active:opacity-70"
          >
            <Ionicons name="refresh" size={19} color="#a1a1aa" />
          </Pressable>

          <Pressable
            onPress={() => setRunning((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={running ? "Pause timer" : "Start timer"}
            className="h-20 w-20 items-center justify-center rounded-full active:opacity-80"
            style={{ backgroundColor: phase === "work" ? "#f00359" : "#10b981" }}
          >
            <Ionicons name={running ? "pause" : "play"} size={32} color="white" />
          </Pressable>

          <Pressable
            onPress={() => {
              setRemaining(total);
              setRunning(false);
            }}
            hitSlop={8}
            accessibilityLabel="Reset timer"
            className="h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 active:opacity-70"
          >
            <Ionicons name="stop" size={19} color="#a1a1aa" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
