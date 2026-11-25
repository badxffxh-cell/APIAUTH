import { BlurMask, Canvas, Group, Path, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { colors as C } from '@/theme';

interface Props {
  size?: number;
  stroke?: number;
  progress: number;
  colors?: readonly string[];
  trackColor?: string;
  glow?: boolean;
  delay?: number;
  children?: ReactNode;
}

const PAD = 10;

/** Anel de progresso animado com gradiente angular e brilho (Skia). */
export function ProgressRing({
  size = 120,
  stroke = 12,
  progress,
  colors = [C.primary, C.accent, C.success],
  trackColor = 'rgba(255,255,255,0.08)',
  glow = true,
  delay = 150,
  children,
}: Props) {
  const p = useSharedValue(0);
  const total = size + PAD * 2;
  const r = (size - stroke) / 2;

  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress));
    p.value = withDelay(delay, withTiming(target, { duration: 1300, easing: Easing.out(Easing.cubic) }));
  }, [progress, delay, p]);

  const path = useMemo(() => {
    return Skia.Path.Circle(total / 2, total / 2, r);
  }, [total, r]);

  const visible = useDerivedValue(() => (p.value > 0.005 ? 1 : 0));
  const sweep = useMemo(() => [...colors, colors[0]], [colors]);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ position: 'absolute', left: -PAD, top: -PAD, width: total, height: total }}>
        <Group transform={[{ rotate: -Math.PI / 2 }]} origin={vec(total / 2, total / 2)}>
          <Path path={path} style="stroke" strokeWidth={stroke} color={trackColor} />
          <Group opacity={visible}>
            {glow && (
              <Path path={path} style="stroke" strokeWidth={stroke} strokeCap="round" start={0} end={p} opacity={0.75}>
                <SweepGradient c={vec(total / 2, total / 2)} colors={sweep} />
                <BlurMask blur={9} style="solid" />
              </Path>
            )}
            <Path path={path} style="stroke" strokeWidth={stroke} strokeCap="round" start={0} end={p}>
              <SweepGradient c={vec(total / 2, total / 2)} colors={sweep} />
            </Path>
          </Group>
        </Group>
      </Canvas>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
