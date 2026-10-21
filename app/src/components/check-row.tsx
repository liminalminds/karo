import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UIText } from "@/components/ui-text";
import { cn } from "@/lib/cn";
import { tagColor } from "@/lib/tags";

const PRIMARY = "#f00359";

type Props = {
  title: string;
  tags: string[];
  done: boolean;
  progress: number;
  count?: number;
  tagColors: Record<string, string>;
  onToggle: () => void;
  onEdit?: () => void;
  /** Rendered under the title, e.g. a deadline. */
  meta?: React.ReactNode;
  /** Static chip before the tags, e.g. "daily". */
  badge?: string;
  /** Past days are frozen: rows are shown but cannot be toggled or edited. */
  locked?: boolean;
  /** Habit rows get a slightly thicker card with a pink accent bar. */
  variant?: "task" | "habit";
};

/** One habit or task: checkbox, title, count, and tag chips. */
export function CheckRow({
  title,
  tags,
  done,
  progress,
  count = 1,
  tagColors,
  onToggle,
  onEdit,
  meta,
  badge,
  locked = false,
  variant = "task",
}: Props) {
  return (
    <Pressable
      // Toggling lives on the checkbox itself, not the whole row: a tap on the
      // title or tags must not check anything.
      onLongPress={locked ? undefined : onEdit}
      disabled={locked}
      className={cn(
        "flex-row items-center gap-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5",
        variant === "habit" && "pl-6",
        locked && "opacity-70"
      )}
    >
      {variant === "habit" && (
        <View
          className="absolute left-0 inset-y-0 w-1.5"
          style={{ backgroundColor: PRIMARY }}
        />
      )}
      <Pressable
        onPress={locked ? undefined : onToggle}
        disabled={locked}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={done ? { checked: true } : { checked: false }}
        className="h-5 w-5 shrink-0 items-center justify-center rounded-full border"
        style={
          done
            ? { backgroundColor: PRIMARY, borderColor: PRIMARY }
            : { borderColor: "#52525b" }
        }
      >
        {done && <UIText className="text-2xs text-white">✓</UIText>}
      </Pressable>

      <View className="flex-1 gap-1">
        <View className="flex-row flex-wrap items-baseline gap-x-1.5">
          <UIText className={cn(done && "line-through opacity-40")}>{title}</UIText>
          {count > 1 && (
            <UIText muted className="text-xs font-medium">
              ({progress}/{count})
            </UIText>
          )}
        </View>
        {(tags.length > 0 || badge || meta) && (
          <View className="flex-row flex-wrap items-center gap-1.5">
            {badge && (
              <UIText className="text-2xs uppercase tracking-wide text-sky-400">
                {badge}
              </UIText>
            )}
            {tags.map((tag) => (
              <View
                key={tag}
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: `${tagColor(tag, tagColors)}26` }}
              >
                <UIText
                  className="text-2xs font-medium"
                  style={{ color: tagColor(tag, tagColors) }}
                >
                  {tag}
                </UIText>
              </View>
            ))}
            {meta}
          </View>
        )}
      </View>

      {locked && (
        <Ionicons name="lock-closed" size={14} color="#52525b" />
      )}
    </Pressable>
  );
}

/** Small uppercase label used above each group of rows. */
export function SectionLabel({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <View className="flex-row items-baseline justify-between px-1 pb-1 pt-3">
      <UIText className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </UIText>
      {hint ? (
        <UIText muted className="text-[11px]">
          {hint}
        </UIText>
      ) : null}
    </View>
  );
}