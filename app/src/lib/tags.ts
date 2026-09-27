import { useSyncExternalStore } from "react";

const PALETTE = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#4ade80",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#f472b6",
];

const customColors = new Map<string, string>();
const listeners = new Set<() => void>();

export function tagColor(tag: string) {
  return customColors.get(tag) ?? defaultTagColor(tag);
}

export function defaultTagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function notify() {
  listeners.forEach((l) => l());
}

export function setTagColor(tag: string, color: string) {
  if (color === defaultTagColor(tag)) customColors.delete(tag);
  else customColors.set(tag, color);
  notify();
}

/** Cycle a tag's color to the next palette entry. */
export function cycleTagColor(tag: string) {
  const current = tagColor(tag);
  const idx = PALETTE.indexOf(current);
  setTagColor(tag, PALETTE[(idx + 1) % PALETTE.length]);
}

export function subscribeColors(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getColorsVersion() {
  return customColors.size;
}

/** Hook so components re-render when a tag color changes. */
export function useTagColors() {
  return useSyncExternalStore(subscribeColors, getColorsVersion);
}
