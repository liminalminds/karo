import { Platform } from "react-native";

/**
 * Analyze sends a recording to the Karo backend and returns a short summary.
 * It is a paid feature, so the endpoint has to be configured before the button
 * can do anything; until then the app says so instead of failing silently.
 */

/** Set with EXPO_PUBLIC_ANALYZE_URL at build time. */
const ENDPOINT = process.env.EXPO_PUBLIC_ANALYZE_URL ?? "";

/** Recognizer persists WAV (Android) or CAF (iOS); old takes may still be M4A. */
const AUDIO_MIME: Record<string, string> = {
  wav: "audio/wav",
  m4a: "audio/mp4",
  caf: "audio/x-caf",
  m4v: "audio/mp4",
  aac: "audio/aac",
  mp3: "audio/mpeg",
  mpeg: "audio/mpeg",
};

function fileExtension(uri: string) {
  const base = uri.split("?")[0];
  const last = base.slice(base.lastIndexOf("/") + 1);
  const dot = last.lastIndexOf(".");
  return dot >= 0 ? last.slice(dot + 1).toLowerCase() : "";
}

export type AnalyzeResult = {
  summary: string;
  transcript?: string;
};

export function isAnalyzeConfigured() {
  return ENDPOINT.length > 0;
}

export class AnalyzeError extends Error {}

/**
 * Uploads one take. `FormData` with a `uri` entry is the standard way to send
 * a local file from React Native, and the fetch implementation rewrites it into
 * a multipart body with the right content type.
 */
export async function analyzeRecording(
  fileUri: string,
  durationMs: number,
  transcript?: string | null
): Promise<AnalyzeResult> {
  if (!isAnalyzeConfigured()) {
    throw new AnalyzeError(
      "Analysis is not set up on this build yet. Set EXPO_PUBLIC_ANALYZE_URL to enable it."
    );
  }

  const ext = fileExtension(fileUri) || "m4a";
  const form = new FormData();
  form.append(
    "audio",
    {
      // Android's fetch reads these from the file it opens at `uri`.
      uri: fileUri.startsWith("file://") ? fileUri : `file://${fileUri}`,
      name: `recording.${ext}`,
      type: AUDIO_MIME[ext] ?? "audio/mp4",
    } as unknown as Blob
  );
  form.append("durationMs", String(durationMs));
  form.append("platform", Platform.OS);
  if (transcript) {
    form.append("transcript", transcript);
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, { method: "POST", body: form });
  } catch {
    throw new AnalyzeError(
      "Could not reach the analysis service. Check your connection."
    );
  }

  if (!response.ok) {
    throw new AnalyzeError(
      response.status === 402 || response.status === 403
        ? "Analysis needs an active subscription."
        : `Analysis failed (${response.status}). Please try again.`
    );
  }

  const data = (await response.json()) as Partial<AnalyzeResult>;
  if (typeof data.summary !== "string") {
    throw new AnalyzeError("Analysis came back in an unexpected format.");
  }
  return { summary: data.summary, transcript: data.transcript };
}