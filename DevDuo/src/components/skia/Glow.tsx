import { BlurMask, Canvas, Circle, RoundedRect } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface Props {
  color: string;
  width: number;
  height: number;
  radius?: number;
  blur?: number;
  opacity?: number;
  pulse?: boolean;
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Halo de luz (glow) desenhado com Skia atrás de elementos em destaque.
 * Posicione como irmão anterior ao elemento, com o mesmo tamanho.
 */
export function Glow({ color, width, height, radius = 20, blur = 18, opacity = 0.7, pulse, circle, style }: Props) {
  const o = useSharedValue(opacity);
  useEffect(() => {
    if (pulse) {
      o.value = opacity * 0.45;
      o.value = withRepeat(withTiming(opacity, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      o.value = opacity;
    }
  }, [pulse, opacity, o]);

  const pad = blur * 2.2;
  const cw = width + pad * 2;
  const ch = height + pad * 2;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: -pad, top: -pad, width: cw, height: ch }, style]}>
      <Canvas style={{ width: cw, height: ch }}>
        {circle ? (
          <Circle cx={cw / 2} cy={ch / 2} r={Math.min(width, height) / 2} color={color} opacity={o}>
            <BlurMask blur={blur} style="normal" />
          </Circle>
        ) : (
          <RoundedRect x={pad} y={pad} width={width} height={height} r={radius} color={color} opacity={o}>
            <BlurMask blur={blur} style="normal" />
          </RoundedRect>
        )}
      </Canvas>
    </View>
  );
}
