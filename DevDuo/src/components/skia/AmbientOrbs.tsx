import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface Props {
  /** Cores dos 3 orbes (com alpha). */
  palette?: [string, string, string];
  intensity?: number;
}

const DEFAULT: [string, string, string] = ['rgba(108,99,255,0.42)', 'rgba(0,229,255,0.26)', 'rgba(0,255,148,0.14)'];

/**
 * Orbes de luz desfocados que flutuam lentamente — dão profundidade e cor
 * para o vidro "ter o que desfocar", como no iOS.
 */
export function AmbientOrbs({ palette = DEFAULT, intensity = 1 }: Props) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t]);

  const c1 = useDerivedValue(() => vec(width * (0.1 + 0.25 * t.value), height * (0.12 + 0.06 * t.value)));
  const c2 = useDerivedValue(() => vec(width * (0.95 - 0.2 * t.value), height * (0.42 + 0.1 * (1 - t.value))));
  const c3 = useDerivedValue(() => vec(width * (0.3 + 0.3 * (1 - t.value)), height * (0.86 - 0.05 * t.value)));
  const r1 = width * 0.95;
  const r2 = width * 0.8;
  const r3 = width * 0.75;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: intensity }]}>
      <Canvas style={FILL}>
        <Circle c={c1} r={r1}>
          <RadialGradient c={c1} r={r1} colors={[palette[0], 'rgba(8,8,16,0)']} />
        </Circle>
        <Circle c={c2} r={r2}>
          <RadialGradient c={c2} r={r2} colors={[palette[1], 'rgba(8,8,16,0)']} />
        </Circle>
        <Circle c={c3} r={r3}>
          <RadialGradient c={c3} r={r3} colors={[palette[2], 'rgba(8,8,16,0)']} />
        </Circle>
      </Canvas>
    </View>
  );
}

const FILL = { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 } as const;
