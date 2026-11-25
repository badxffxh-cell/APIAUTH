import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, gradients, radius } from '@/theme';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

type Variant = 'primary' | 'success' | 'danger' | 'gold' | 'glass';

interface Props {
  title: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  colors?: readonly [string, string, ...string[]];
}

const VARIANTS: Record<Variant, readonly [string, string, ...string[]]> = {
  primary: gradients.primary,
  success: gradients.success,
  danger: gradients.danger,
  gold: gradients.gold,
  glass: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.06)'],
};

const GLOW: Record<Variant, string> = {
  primary: colors.primary,
  success: colors.success,
  danger: colors.danger,
  gold: colors.flame,
  glass: '#000',
};

const HEIGHT = { sm: 38, md: 48, lg: 56 } as const;

export function GradientButton({ title, onPress, icon, iconRight, variant = 'primary', size = 'lg', disabled, loading, style, colors: custom }: Props) {
  const grad = disabled ? gradients.disabled : (custom ?? VARIANTS[variant]);
  const dark = !disabled && (variant === 'success' || variant === 'gold');
  const fg = dark ? colors.textInverse : colors.text;
  const h = HEIGHT[size];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      hapticStyle="medium"
      style={[
        { height: h, borderRadius: radius.pill },
        !disabled && variant !== 'glass' && { shadowColor: GLOW[variant], shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
        style,
      ]}
    >
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.fill, { borderRadius: radius.pill }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, opacity: variant === 'glass' ? 0.4 : 0.7 }]}
        />
        {variant === 'glass' && <View style={[StyleSheet.absoluteFill, styles.glassBorder]} />}
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={styles.row}>
            {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={fg} />}
            <Txt style={[styles.label, { color: fg, fontSize: size === 'sm' ? 14 : 16 }]}>{title}</Txt>
            {iconRight && <Ionicons name={iconRight} size={size === 'sm' ? 16 : 19} color={fg} />}
          </View>
        )}
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bold, letterSpacing: 0.2 },
  glassBorder: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder },
});
