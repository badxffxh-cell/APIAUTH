import { BlurMask, Canvas, Group, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';

import { gradients } from '@/theme';

interface Props {
  progress: number;
  height?: number;
  colors?: readonly string[];
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
  trackColor?: string;
}

const PAD = 8;

/** Barra de XP com gradiente animado (shimmer), brilho e reflexo superior. */
export function XPBar({ progress, height = 12, colors = gradients.primary, glow = true, style, trackColor = 'rgba(255,255,255,0.08)' }: Props) {
  const [w, setW] = useState(0);
  const p = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    p.value = withSpring(Math.max(0, Math.min(1, progress)), { damping: 18, stiffness: 90 });
  }, [progress, p]);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false);
  }, [shimmer]);

  const fillW = useDerivedValue(() => (p.value <= 0.001 ? 0 : Math.max(height, w * p.value)));
  const hiW = useDerivedValue(() => Math.max(0, fillW.value - height));
  const start = useDerivedValue(() => vec(-w + shimmer.value * w * 2, 0));
  const end = useDerivedValue(() => vec(shimmer.value * w * 2, 0));
  const r = height / 2;
  const grad = [colors[0], colors[colors.length - 1], colors[0]];

  return (
    <View style={[{ height }, style]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Canvas style={{ position: 'absolute', left: -PAD, top: -PAD, width: w + PAD * 2, height: height + PAD * 2 }}>
          <Group transform={[{ translateX: PAD }, { translateY: PAD }]}>
            <RoundedRect x={0} y={0} width={w} height={height} r={r} color={trackColor} />
            {glow && (
              <RoundedRect x={0} y={0} width={fillW} height={height} r={r} color={colors[colors.length - 1]} opacity={0.6}>
                <BlurMask blur={7} style="outer" />
              </RoundedRect>
            )}
            <RoundedRect x={0} y={0} width={fillW} height={height} r={r}>
              <LinearGradient start={start} end={end} colors={grad} mode="repeat" />
            </RoundedRect>
            <RoundedRect x={r / 2} y={height * 0.18} width={hiW} height={height * 0.28} r={height * 0.14} color="rgba(255,255,255,0.38)" />
          </Group>
        </Canvas>
      )}
    </View>
  );
}
