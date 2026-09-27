import { Text, TextProps } from "react-native";
import { cn } from "@/lib/cn";

type Props = TextProps & {
  className?: string;
  muted?: boolean;
};

export function UIText({ className, muted, ...props }: Props) {
  return (
    <Text
      className={cn("text-zinc-100", muted && "text-zinc-500", className)}
      {...props}
    />
  );
}
