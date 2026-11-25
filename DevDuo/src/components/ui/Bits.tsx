import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { GlassView } from '@/components/glass/GlassView';
import { colors, fonts, radius } from '@/theme';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

type IconName = keyof typeof Ionicons.glyphMap;

/** Botão circular de vidro. */
export function IconButton({
  icon,
  onPress,
  size = 42,
  color = colors.text,
  style,
  badge,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  badge?: boolean;
}) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} hapticStyle="tap" style={style} hitSlop={6}>
      <GlassView radius={size / 2} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} shadow={false}>
        <Ionicons name={icon} size={size * 0.46} color={color} />
        {badge && <View style={styles.badge} />}
      </GlassView>
    </PressableScale>
  );
}

/** Pílula de estatística (ofensiva, gemas, corações). */
export function StatPill({ icon, value, color, onPress }: { icon: IconName; value: string | number; color: string; onPress?: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.92} hapticStyle="tap" disabled={!onPress} style={{ opacity: 1 }}>
      <GlassView radius={radius.pill} style={styles.pill} shadow={false}>
        <Ionicons name={icon} size={16} color={color} style={{ textShadowColor: color, textShadowRadius: 8 }} />
        <Txt style={styles.pillText}>{value}</Txt>
      </GlassView>
    </PressableScale>
  );
}

/** Chip selecionável. */
export function Chip({
  label,
  active,
  onPress,
  icon,
  mono,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  mono?: boolean;
}) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.94} hapticStyle="tap">
      {active ? (
        <LinearGradient colors={['#6C63FF', '#00B8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip}>
          {icon && <Ionicons name={icon} size={14} color="#fff" />}
          <Txt style={[styles.chipText, mono && { fontFamily: fonts.monoMedium }]}>{label}</Txt>
        </LinearGradient>
      ) : (
        <GlassView radius={radius.pill} style={styles.chip} shadow={false} borderColor={colors.glassBorderSoft}>
          {icon && <Ionicons name={icon} size={14} color={colors.textSecondary} />}
          <Txt style={[styles.chipText, { color: colors.textSecondary }, mono && { fontFamily: fonts.monoMedium }]}>{label}</Txt>
        </GlassView>
      )}
    </PressableScale>
  );
}

export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.section, style]}>
      <Txt variant="label">{title}</Txt>
      {action && (
        <PressableScale onPress={onAction} hapticStyle="tap" hitSlop={8}>
          <Txt variant="caption" color={colors.accent}>
            {action}
          </Txt>
        </PressableScale>
      )}
    </View>
  );
}

/** Ícone dentro de um quadrado com gradiente (estilo app icon). */
export function GradientIcon({
  icon,
  colors: c,
  size = 44,
  iconSize,
  glow = true,
}: {
  icon: IconName;
  colors: readonly [string, string, ...string[]];
  size?: number;
  iconSize?: number;
  glow?: boolean;
}) {
  return (
    <View style={glow ? { shadowColor: c[0], shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } } : undefined}>
      <LinearGradient colors={c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size * 0.32, alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size * 0.32 }]}
        />
        <Ionicons name={icon} size={iconSize ?? size * 0.5} color="#fff" />
      </LinearGradient>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorderSoft }, style]} />;
}

export function EmptyState({ icon, title, subtitle, children }: { icon: IconName; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
      <GradientIcon icon={icon} colors={['#6C63FF', '#00E5FF']} size={64} />
      <Txt variant="headline" center style={{ marginTop: 6 }}>
        {title}
      </Txt>
      {subtitle && (
        <Txt variant="caption" center style={{ maxWidth: 260 }}>
          {subtitle}
        </Txt>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34 },
  pillText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: '#fff' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
});
