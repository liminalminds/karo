import { useEffect, useMemo, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { UIText } from "@/components/ui-text";

const EMOJI = ["🎉", "✨", "🎊", "🌟", "💫"];
const PARTICLES = 16;
/** Full-screen lifetime; the overlay unmounts right after. */
const RUN_MS = 2400;

type Particle = {
  emoji: string;
  size: number;
  /** -1 launches left, 1 right. */
  drift: number;
  rise: number;
  spin: number;
  delay: number;
};

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLES }, (_, i) => ({
    emoji: EMOJI[i % EMOJI.length],
    size: 22 + ((i * 7) % 12),
    drift: ((i * 7919) % 200) / 100 - 1, // deterministic spread of -1..1
    rise: 340 + ((i * 3313) % 180),
    spin: i % 2 === 0 ? 1 : -1,
    delay: (i % 5) * 90,
  }));
}

/**
 * A quick self-dismissing celebration: emoji particles burst up from the
 * bottom and drift apart. Rendering with `run` > 0 fires one pass; bumping
 * `run` again replays it.
 */
export function Celebration({ run }: { run: number }) {
  const particles = useMemo(() => makeParticles(), []);
  const progress = useMemo(
    () => particles.map(() => new Animated.Value(0)),
    [particles]
  );
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (run <= 0) return;
    for (const value of progress) value.setValue(0);
    const animations = progress.map((value, i) =>
      Animated.timing(value, {
        toValue: 1,
        duration: RUN_MS - particles[i].delay - 300,
        delay: particles[i].delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
    const show = requestAnimationFrame(() => setActive(true));
    const hide = setTimeout(() => setActive(false), RUN_MS);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, [run, particles, progress]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            bottom: 120,
            transform: [
              {
                translateX: progress[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, particle.drift * 160],
                }),
              },
              {
                translateY: progress[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -particle.rise],
                }),
              },
              {
                rotate: progress[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${particle.spin * 40}deg`],
                }),
              },
              {
                scale: progress[i].interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [0.6, 1.1, 0.8],
                }),
              },
            ],
          }}
        >
          <UIText style={{ fontSize: particle.size, opacity: 0.9 }}>
            {particle.emoji}
          </UIText>
        </Animated.View>
      ))}
    </View>
  );
}
