import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type AudioRecorder,
} from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Paths } from "expo-file-system";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionErrorEvent,
  type ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";
import { UIText } from "@/components/ui-text";
import { addRecording, discardRecordingFile } from "@/lib/recordings-store";

const PRIMARY = "#f00359";
const RECORDING = "#ff2d6f";
const IDLE_COLORS = ["#ff2d6f", "#c8004f", "#7a0033"] as const;

/** Takes shorter than this are treated as an accidental tap. */
const MIN_DURATION_MS = 1000;

/** How long to wait for the recognizer's `end` event before salvaging the take. */
const STOP_TIMEOUT_MS = 6000;

type Props = {
  /** Called after a take is saved, so the screen can open the list. */
  onSaved: () => void;
};

type RecognizerSession = {
  mode: "recognizer";
  /** Epoch ms when the tap-to-start happened; fallback for duration. */
  startMillis: number;
  /** Final transcript parts accumulated from the recognizer. */
  parts: string[];
  /** Timestamps from audiostart / audioend events (epoch ms). */
  audioStart: number | null;
  audioEnd: number | null;
  /** Persisted audio file, populated by the audioend event. */
  uri: string | null;
  /** Cleared once a stop() is underway so a stale event can't resolve twice. */
  endResolver: (() => void) | null;
};

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Voice takes are captured by the speech recognizer, which hands back both the
 * persisted audio file and a transcript in the same session. Where the device
 * can't do recognition (Android below 13, no speech service, permissions
 * denied) the button silently falls back to a plain expo-audio recording with
 * no transcript.
 */
export function MicButton({ onSaved }: Props) {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    directory: "document",
  });

  // Tap-to-start/stop is driven by these refs: preparing and stopping are async
  // so the refs let a tap hit the right branch immediately and keep a second
  // tap from starting a second take.
  const busyRef = useRef(false);
  const recordingRef = useRef(false);
  const session = useRef<RecognizerSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsedStart, setElapsedStart] = useState(0);

  // Fresh handlers for the recognizer event listeners, which are registered
  // once per module but need latest closures.
  const startFallback = useCallback(
    () => startFallbackImpl(recorder, recordingRef, setRecording, setElapsedStart),
    [recorder]
  );
  const actionsRef = useRef({ startFallback });
  useEffect(() => {
    actionsRef.current = { startFallback };
  }, [startFallback]);

  const run = useCallback(async (fn: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await fn();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  useSpeechRecognitionEvent("result", (e: ExpoSpeechRecognitionResultEvent) => {
    const s = session.current;
    if (!s || s.mode !== "recognizer") return;
    if (!e.isFinal) return;
    // results[0] is the primary transcript; the following entries are
    // alternative hypotheses for the same utterance, so joining them pasted
    // the same words over and over.
    const text = e.results[0]?.transcript.trim() ?? "";
    if (text) s.parts.push(text);
  });

  useSpeechRecognitionEvent(
    "audiostart",
    (e: { timestamp: number }) => {
      const s = session.current;
      if (s && s.mode === "recognizer") s.audioStart = e.timestamp;
    }
  );

  useSpeechRecognitionEvent(
    "audioend",
    (e: { uri: string | null; timestamp: number }) => {
      const s = session.current;
      if (!s || s.mode !== "recognizer") return;
      s.uri = e.uri;
      s.audioEnd = e.timestamp;
    }
  );

  const settle = useCallback(() => {
    const s = session.current;
    if (s && s.endResolver) {
      const resolve = s.endResolver;
      s.endResolver = null;
      resolve();
    }
  }, []);

  useSpeechRecognitionEvent("end", () => settle());

  useSpeechRecognitionEvent(
    "error",
    (e: ExpoSpeechRecognitionErrorEvent) => {
      const s = session.current;
      if (!s || s.mode !== "recognizer") return;
      // A failure before any audio flowed: hand the take to the plain recorder.
      if (e.error !== "aborted" && s.audioStart === null && !s.endResolver) {
        session.current = null;
        setRecording(false);
        recordingRef.current = false;
        void actionsRef.current.startFallback();
        return;
      }
      settle();
    }
  );

  // Leaving the screen mid-take: stop listening hard, drop the recording.
  useEffect(
    () => () => {
      if (session.current) {
        try {
          ExpoSpeechRecognitionModule.abort();
        } catch (error) {
          console.warn("[mic] failed to abort recognizer", error);
        }
        session.current = null;
      }
      if (recorder.isRecording) {
        try {
          recorder.stop();
        } catch (error) {
          console.warn("[mic] failed to stop recorder", error);
        }
      }
    },
    [recorder]
  );

const startRecognizer = useCallback(async () => {
    session.current = {
      mode: "recognizer",
      startMillis: Date.now(),
      parts: [],
      audioStart: null,
      audioEnd: null,
      uri: null,
      endResolver: null,
    };
    setElapsedStart(session.current.startMillis);
    ExpoSpeechRecognitionModule.start({
      continuous: true,
      interimResults: true,
      addsPunctuation: true,
      recordingOptions: {
        persist: true,
        // Document directory survives OS storage purges, same as the audio
        // the expo-audio fallback writes.
        outputDirectory: Paths.document.uri,
      },
    });
    recordingRef.current = true;
    setRecording(true);
  }, []);

  const start = useCallback(
    () =>
      run(async () => {
        const capable =
          ExpoSpeechRecognitionModule.isRecognitionAvailable() &&
          ExpoSpeechRecognitionModule.supportsRecording();

        if (capable) {
          const existing = await ExpoSpeechRecognitionModule.getPermissionsAsync();
          const granted = existing.granted
            ? true
            : (await ExpoSpeechRecognitionModule.requestPermissionsAsync()).granted;
          if (granted) {
            try {
              await startRecognizer();
              return;
            } catch (error) {
              console.warn("[mic] recognizer failed to start", error);
              session.current = null;
            }
          }
        }
        await actionsRef.current.startFallback();
      }),
    [run, startRecognizer]
  );

  const finishRecognizer = useCallback(
    async (s: RecognizerSession) => {
      const transcript = s.parts.join(" ").trim() || null;
      const durationMs =
        s.audioStart !== null && s.audioEnd !== null
          ? s.audioEnd - s.audioStart
          : Date.now() - s.startMillis;
      const uri = s.uri;
      session.current = null;
      if (!uri || durationMs < MIN_DURATION_MS) {
        if (uri) discardRecordingFile(uri);
        return;
      }
      addRecording(uri, durationMs, transcript);
      onSaved();
    },
    [onSaved]
  );

  const stopRecognizer = useCallback(async () => {
    const s = session.current;
    if (!s) return;
    const endPromise = new Promise<void>((resolve) => {
      s.endResolver = resolve;
    });
    // Audio already finalized before the tap landed: don't wait for `end`.
    if (s.audioEnd !== null) {
      settle();
    }
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.warn("[mic] failed to stop recognizer", error);
      settle();
    }
    // `end` should arrive on its own; a timeout salvages misbehaving services.
    const timer = setTimeout(() => settle(), STOP_TIMEOUT_MS);
    await endPromise;
    clearTimeout(timer);
    await finishRecognizer(s);
  }, [finishRecognizer, settle]);

  const stop = useCallback(
    () =>
      run(async () => {
        recordingRef.current = false;
        setRecording(false);
        if (session.current) {
          await stopRecognizer();
        } else {
          await finishFallback(recorder, onSaved);
        }
      }),
    [recorder, onSaved, run, stopRecognizer]
  );

  const toggle = useCallback(() => {
    if (recordingRef.current || recorder.isRecording) {
      void stop();
    } else {
      void start();
    }
  }, [recorder, start, stop]);

  return (
    <View className="-mt-8 h-[72px] w-[72px] items-center justify-center">
      {recording && (
        <View
          pointerEvents="none"
          className="absolute h-[72px] w-[72px] rounded-full"
          style={{ backgroundColor: `${PRIMARY}45` }}
        />
      )}
      <Pressable
        onPress={toggle}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={recording ? "Stop recording" : "Start recording"}
        className="h-[72px] w-[72px] items-center justify-center rounded-full active:opacity-80"
      >
        <LinearGradient
          colors={recording ? [RECORDING, "#b3003a"] : [...IDLE_COLORS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 72, width: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" }}
        >
          {recording ? (
            <Waveform />
          ) : (
            <Ionicons name="mic" size={44} color="white" />
          )}
        </LinearGradient>
      </Pressable>
      {recording && (
        <ElapsedChip startMillis={elapsedStart} />
      )}
    </View>
  );
}

/**
 * A small WhatsApp-style waveform: bars bobbing on staggered loops while the
 * take is live. Pure presentation — the circle stays the only tap target.
 */
function Waveform() {
  const BARS = 5;
  // Heights stay fixed; the loops only drive the vertical scale. Values live
  // in a memo so they are re-created if the prop identity ever changes.
  const anims = useMemo(
    () =>
      Array.from(
        { length: BARS },
        (_, i) => new Animated.Value(0.3 + (i % 2) * 0.15)
      ),
    []
  );

  useEffect(() => {
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 280 + i * 60,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 360 + i * 45,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [anims]);

  return (
    <View className="flex-row items-center gap-[3px]">
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3.5,
            height: 30,
            borderRadius: 2,
            backgroundColor: "white",
            transform: [{ scaleY: anim }],
          }}
        />
      ))}
    </View>
  );
}

/** Rendered only while a take is active; owns its own ticking state. */
function ElapsedChip({ startMillis }: { startMillis: number }) {  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsedMs(Date.now() - startMillis), 250);
    return () => clearInterval(id);
  }, [startMillis]);

  return (
    <View
      pointerEvents="none"
      className="absolute -bottom-1 rounded-full bg-zinc-950 px-2 py-0.5"
    >
      <UIText className="text-2xs font-semibold text-zinc-300">
        {formatElapsed(elapsedMs)}
      </UIText>
    </View>
  );
}

async function startFallbackImpl(
  recorder: AudioRecorder,
  recordingRef: { current: boolean },
  setRecording: (value: boolean) => void,
  setElapsedStart: (value: number) => void
) {
  permissionRef.current ??= (async () => {
    const existing = await getRecordingPermissionsAsync();
    if (existing.granted) return true;
    const requested = await requestRecordingPermissionsAsync();
    return requested.granted;
  })();
  const granted = await permissionRef.current;
  if (!granted) {
    permissionRef.current = null;
    return;
  }

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      interruptionMode: "doNotMix",
    });
  } catch (error) {
    console.warn("[mic] failed to set audio mode", error);
  }

  await recorder.prepareToRecordAsync();
  recorder.record();
  setElapsedStart(Date.now());
  recordingRef.current = true;
  setRecording(true);
}

async function finishFallback(recorder: AudioRecorder, onSaved: () => void) {
  const durationMs = recorder.getStatus().durationMillis;
  try {
    await recorder.stop();
  } catch (error) {
    console.warn("[mic] failed to stop recording", error);
    return;
  }
  const uri = recorder.uri;
  if (!uri || durationMs < MIN_DURATION_MS) {
    if (uri) discardRecordingFile(uri);
    return;
  }
  addRecording(uri, durationMs, null);
  onSaved();
}

// Cached so repeat taps don't re-prompt. Cleared on denial so a later grant in
// system settings is picked up without a reload.
const permissionRef: { current: Promise<boolean> | null } = { current: null };