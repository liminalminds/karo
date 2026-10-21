import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { setStringAsync } from "expo-clipboard";
import { UIText } from "@/components/ui-text";
import {
  AnalyzeError,
  analyzeRecording,
  isAnalyzeConfigured,
  type AnalyzeResult,
} from "@/lib/analyze";
import {
  deleteRecording,
  useRecordings,
  useRecordingsReady,
  type Recording,
} from "@/lib/recordings-store";

function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
}

export default function Recordings() {
  const recordings = useRecordings();
  const ready = useRecordingsReady();
  const [pendingDelete, setPendingDelete] = useState<Recording | null>(null);
  const [analyzing, setAnalyzing] = useState<Recording | null>(null);

  const confirmDelete = (recording: Recording) => {
    setPendingDelete(recording);
  };

  const onAnalyze = (recording: Recording) => {
    if (!isAnalyzeConfigured()) {
      Alert.alert(
        "Analysis not configured",
        "Set EXPO_PUBLIC_ANALYZE_URL to enable recording analysis."
      );
      return;
    }
    setAnalyzing(recording);
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </Pressable>
        <UIText className="text-lg font-semibold">Recordings</UIText>
        <View className="w-6" />
      </View>

      <FlatList
        data={recordings}
        keyExtractor={(r) => r.id}
        contentContainerClassName="px-5 pb-10 gap-2"
        ListEmptyComponent={
          <UIText muted className="py-12 text-center text-sm">
            {ready ? "No recordings yet. Tap the mic to record one." : ""}
          </UIText>
        }
        renderItem={({ item }) => (
          <RecordingRow
            recording={item}
            analyzing={analyzing?.id === item.id}
            onDelete={() => confirmDelete(item)}
            onAnalyze={() => onAnalyze(item)}
          />
        )}
      />

      {/* Delete confirmation */}
      <Modal
        visible={pendingDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDelete(null)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/70 px-8"
          onPress={() => setPendingDelete(null)}
        >
          <Pressable
            className="gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
            onPress={() => {}}
          >
            <View>
              <UIText className="text-lg font-semibold">Delete recording?</UIText>
              <UIText muted className="mt-1 text-sm">
                This removes the take and its file from the device. It cannot be
                undone.
              </UIText>
            </View>
            <View className="flex-row justify-end gap-3">
              <Pressable
                onPress={() => setPendingDelete(null)}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 active:opacity-70"
              >
                <UIText className="text-sm font-semibold">Keep</UIText>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (pendingDelete) deleteRecording(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="rounded-xl bg-red-500/90 px-4 py-2.5 active:opacity-70"
              >
                <UIText className="text-sm font-semibold text-zinc-950">
                  Delete
                </UIText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Analyze result / progress */}
      <Modal
        visible={analyzing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAnalyzing(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-8">
          <AnalyzeModalBody
            recording={analyzing}
            onClose={() => setAnalyzing(null)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** Lives its own component because the analyzer may run while it is visible. */
function AnalyzeModalBody({
  recording,
  onClose,
}: {
  recording: Recording | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "result"; result: AnalyzeResult }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  // Runs once when the recording is chosen; the flatlist unmounts this shell
  // only after the modal closes, so the effect references stay fresh.
  const [startedId, setStartedId] = useState<string | null>(null);
  const currentId = recording?.id ?? null;
  if (recording && currentId && startedId !== currentId) {
    setStartedId(currentId);
    void analyzeRecording(recording.uri, recording.durationMs, recording.transcript)
      .then((result) => setState({ kind: "result", result }))
      .catch((error) =>
        setState({
          kind: "error",
          message: error instanceof AnalyzeError ? error.message : "Analysis failed.",
        })
      );
  }

  return (
    <Pressable
      className="w-full gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
      onPress={() => {}}
    >
      {state.kind === "loading" && (
        <View className="items-center gap-3 py-4">
          <ActivityIndicator color="#f00359" />
          <UIText className="text-sm font-semibold">Analyzing take…</UIText>
          <UIText muted className="text-xs text-center">
            Uploading {recording ? formatDuration(recording.durationMs) : ""} of audio to
            the Karo service.
          </UIText>
        </View>
      )}

      {state.kind === "error" && (
        <View className="gap-4">
          <View className="gap-1">
            <UIText className="text-base font-semibold text-red-400">
              Analysis failed
            </UIText>
            <UIText muted className="text-sm">
              {state.message}
            </UIText>
          </View>
          <Pressable
            onPress={onClose}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 active:opacity-70"
          >
            <UIText className="text-sm font-semibold text-center">Dismiss</UIText>
          </Pressable>
        </View>
      )}

      {state.kind === "result" && (
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <UIText className="text-lg font-semibold">Summary</UIText>
            <View className="rounded-full bg-fuchsia-500/20 px-2 py-0.5">
              <UIText className="text-2xs uppercase tracking-wide text-fuchsia-300">
                <Ionicons name="flash" size={10} /> Preview
              </UIText>
            </View>
          </View>
          <UIText className="text-sm leading-5 text-zinc-100">
            {state.result.summary}
          </UIText>
          {state.result.transcript && (
            <View className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <UIText muted className="text-2xs uppercase tracking-wide">
                Transcript
              </UIText>
              <UIText className="mt-1 text-sm text-zinc-300">
                {state.result.transcript}
              </UIText>
            </View>
          )}
          <Pressable
            onPress={onClose}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 active:opacity-70"
          >
            <UIText className="text-sm font-semibold text-center">Done</UIText>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

/** Own component so the player hooks don't run inside FlatList.renderItem. */
function RecordingRow({
  recording,
  analyzing,
  onDelete,
  onAnalyze,
}: {
  recording: Recording;
  analyzing: boolean;
  onDelete: () => void;
  onAnalyze: () => void;
}) {
  const player = useAudioPlayer(recording.uri);
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (player.playing) {
      player.pause();
    } else {
      // Restart from the beginning if it already finished.
      if (player.currentTime >= player.duration) {
        void player.seekTo(0);
      }
      player.play();
    }
  };

  const elapsed = status.playing
    ? status.currentTime * 1000
    : player.duration
      ? player.duration * 1000
      : recording.durationMs;

  return (
    <View className="gap-2.5 rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={toggle}
          hitSlop={6}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: status.playing ? "#f00359" : "#27272a" }}
        >
          <Ionicons
            name={status.playing ? "pause" : "play"}
            size={17}
            color="white"
          />
        </Pressable>

        <View className="flex-1 gap-0.5">
          <UIText className="text-sm">
            {new Date(recording.createdAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </UIText>
          <UIText muted className="text-xs">
            {formatDuration(elapsed)} recorded
          </UIText>
        </View>

        <Pressable
          onPress={onAnalyze}
          disabled={analyzing}
          hitSlop={8}
          accessibilityLabel="Analyze recording"
          className="h-9 w-9 items-center justify-center rounded-full border border-zinc-700 active:opacity-70"
        >
          <Ionicons
            name={analyzing ? "hourglass" : "sparkles-outline"}
            size={17}
            color={analyzing ? "#f00359" : "#a1a1aa"}
          />
        </Pressable>

        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityLabel="Delete recording"
        >
          <Ionicons name="trash-outline" size={18} color="#71717a" />
        </Pressable>
      </View>

      <View className="mx-0.5 mt-0.5 flex-row items-start gap-2 rounded-lg bg-zinc-950/80 border border-zinc-800/70 px-3 py-2.5">
        <Ionicons
          name={recording.transcript ? "text" : "text-outline"}
          size={14}
          color={recording.transcript ? "#f00359" : "#52525b"}
          style={{ marginTop: 2 }}
        />
        <View className="flex-1">
          {recording.transcript ? (
            <UIText className="text-sm leading-5 text-zinc-300" numberOfLines={4}>
              {recording.transcript}
            </UIText>
          ) : (
            <UIText muted className="text-xs italic">
              No transcript
            </UIText>
          )}
        </View>
        {recording.transcript && (
          <Pressable
            onPress={() => void setStringAsync(recording.transcript ?? "")}
            hitSlop={8}
            accessibilityLabel="Copy transcript"
            className="rounded-md border border-zinc-700 px-2 py-1 active:opacity-70"
          >
            <Ionicons name="copy-outline" size={14} color="#a1a1aa" />
          </Pressable>
        )}
      </View>
    </View>
  );
}