import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { BLUR_INTENSITY, colors, radius as R } from '@/theme';

export interface GlassViewProps extends ViewProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
  /** Fundo um pouco mais opaco (modais, tab bar). */
  strong?: boolean;
  /** Reflexo de luz no topo, como no iOS. */
  highlight?: boolean;
  shadow?: boolean;
  borderColor?: string;
  tintColor?: string;
}

const tint = Platform.OS === 'ios' ? 'systemUltraThinMaterialDark' : 'dark';

/**
 * Superfície de vidro estilo iOS (Control Center / notificações):
 * blur intenso + véu translúcido + borda a ~20% + brilho superior + sombra suave.
 */
export function GlassView({
  children,
  style,
  radius = R.lg,
  intensity = BLUR_INTENSITY,
  strong,
  highlight = true,
  shadow = true,
  borderColor = colors.glassBorder,
  tintColor,
  ...rest
}: GlassViewProps) {
  const veil = tintColor ?? (Platform.OS === 'android' ? (strong ? 'rgba(24,24,42,0.92)' : 'rgba(22,22,38,0.78)') : strong ? colors.glassStrong : colors.glass);
  return (
    <View style={[shadow && styles.shadow, { borderRadius: radius }, style]} {...rest}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: veil }]} />
        {highlight && (
          <LinearGradient
            colors={['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']}
            locations={[0, 0.45, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
});
