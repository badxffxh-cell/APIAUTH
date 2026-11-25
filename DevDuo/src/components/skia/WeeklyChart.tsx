import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Line,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme';

interface Props {
  values: number[];
  labels: string[];
  goal?: number;
  height?: number;
}

const TOP = 22;
const BOTTOM = 8;
const SIDE = 14;

/** Gráfico de linha suave com área em gradiente, brilho e revelação animada. */
export function WeeklyChart({ values, labels, goal, height = 150 }: Props) {
  const [w, setW] = useState(0);
  const reveal = useSharedValue(0);

  useEffect(() => {
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [values, reveal]);

  const max = Math.max(goal ?? 0, ...values, 10) * 1.15;
  const plotH = height - TOP - BOTTOM;

  const { line, area, pts, goalY } = useMemo(() => {
    const n = values.length;
    const pts = values.map((v, i) => ({
      x: SIDE + (n === 1 ? 0 : (i * (w - SIDE * 2)) / (n - 1)),
      y: TOP + (1 - v / max) * plotH,
    }));
    const b = Skia.PathBuilder.Make();
    if (pts.length) {
      b.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const t = 0.18;
        b.cubicTo(p1.x + (p2.x - p0.x) * t, p1.y + (p2.y - p0.y) * t, p2.x - (p3.x - p1.x) * t, p2.y - (p3.y - p1.y) * t, p2.x, p2.y);
      }
    }
    const line = b.build();
    const ab = Skia.PathBuilder.MakeFromPath(line);
    if (pts.length) {
      ab.lineTo(pts[pts.length - 1].x, height);
      ab.lineTo(pts[0].x, height);
      ab.close();
    }
    const area = ab.build();
    const goalY = goal ? TOP + (1 - goal / max) * plotH : null;
    return { line, area, pts, goalY };
  }, [values, w, max, plotH, height, goal]);

  const last = pts[pts.length - 1];

  return (
    <View>
      <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && (
          <Canvas style={StyleSheet.absoluteFill}>
            {goalY !== null && (
              <Line p1={vec(SIDE, goalY)} p2={vec(w - SIDE, goalY)} color="rgba(0,255,148,0.35)" strokeWidth={1}>
                <DashPathEffect intervals={[4, 6]} />
              </Line>
            )}
            <Group opacity={reveal}>
              <Path path={area}>
                <LinearGradient start={vec(0, TOP)} end={vec(0, height)} colors={['rgba(108,99,255,0.45)', 'rgba(0,229,255,0.0)']} />
              </Path>
            </Group>
            <Path path={line} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" end={reveal} opacity={0.8}>
              <LinearGradient start={vec(0, 0)} end={vec(w, 0)} colors={[colors.primary, colors.accent]} />
              <BlurMask blur={8} style="solid" />
            </Path>
            <Path path={line} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" end={reveal}>
              <LinearGradient start={vec(0, 0)} end={vec(w, 0)} colors={[colors.primary, colors.accent]} />
            </Path>
            <Group opacity={reveal}>
              {pts.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3} color={i === pts.length - 1 ? colors.accent : 'rgba(255,255,255,0.7)'} />
              ))}
              {last && (
                <Circle cx={last.x} cy={last.y} r={11} color={colors.accent} opacity={0.35}>
                  <BlurMask blur={8} style="normal" />
                </Circle>
              )}
            </Group>
          </Canvas>
        )}
      </View>
      <View style={styles.labels}>
        {labels.map((l, i) => (
          <Txt key={i} variant="micro" color={i === labels.length - 1 ? colors.accent : colors.textTertiary} style={{ width: 32, textAlign: 'center' }}>
            {l}
          </Txt>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SIDE - 16 + 2, marginTop: 6 },
});
