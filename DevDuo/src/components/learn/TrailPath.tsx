import { BlurMask, Canvas, DashPathEffect, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { colors } from '@/theme';

interface Props {
  points: { x: number; y: number }[];
  width: number;
  height: number;
  /** Quantos segmentos (a partir do início) já foram concluídos. */
  doneSegments: number;
}

function curve(points: { x: number; y: number }[], from: number, to: number) {
  const b = Skia.PathBuilder.Make();
  if (points.length < 2 || to <= from) return b.build();
  b.moveTo(points[from].x, points[from].y);
  for (let i = from; i < to; i++) {
    const a = points[i];
    const c = points[i + 1];
    const my = (a.y + c.y) / 2;
    b.cubicTo(a.x, my, c.x, my, c.x, c.y);
  }
  return b.build();
}

/** Linha que conecta os nós da trilha: tracejada (pendente) e neon (concluída). */
export function TrailPath({ points, width, height, doneSegments }: Props) {
  const all = useMemo(() => curve(points, 0, points.length - 1), [points]);
  const done = useMemo(() => curve(points, 0, Math.min(doneSegments, points.length - 1)), [points, doneSegments]);
  return (
    <Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { width, height }]}>
      <Path path={all} style="stroke" strokeWidth={5} strokeCap="round" color="rgba(255,255,255,0.13)">
        <DashPathEffect intervals={[2, 14]} />
      </Path>
      <Path path={done} style="stroke" strokeWidth={6} strokeCap="round" opacity={0.7}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[colors.success, colors.accent]} />
        <BlurMask blur={8} style="solid" />
      </Path>
      <Path path={done} style="stroke" strokeWidth={4} strokeCap="round">
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[colors.success, colors.accent]} />
      </Path>
    </Canvas>
  );
}
