import { StyleSheet, View } from 'react-native';

import { GlassView } from '@/components/glass/GlassView';
import { XPBar } from '@/components/skia/XPBar';
import { LanguageIcon3D } from '@/components/three/LanguageIcon3D';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, fonts, radius } from '@/theme';
import type { Language } from '@/types';

interface Props {
  language: Language;
  done: number;
  total: number;
  width: number;
  paused?: boolean;
  onPress: () => void;
}

/** Cartão de vidro da linguagem com ícone 3D (Three.js) e progresso (Skia). */
export function LanguageCard({ language, done, total, width, paused, onPress }: Props) {
  const complete = total > 0 && done === total;
  return (
    <PressableScale onPress={onPress} scaleTo={0.95} hapticStyle="light" style={{ width }}>
      <GlassView radius={radius.lg} style={styles.card}>
        <View style={styles.top}>
          <LanguageIcon3D shape={language.shape} color={language.color} size={62} radius={18} paused={paused} />
          {complete ? (
            <View style={[styles.badge, { backgroundColor: colors.successSoft, borderColor: 'rgba(0,255,148,0.4)' }]}>
              <Txt style={[styles.badgeText, { color: colors.success }]}>✓</Txt>
            </View>
          ) : (
            <View style={styles.badge}>
              <Txt style={styles.badgeText}>{language.glyph}</Txt>
            </View>
          )}
        </View>
        <Txt variant="headline" style={{ marginTop: 12 }} numberOfLines={1}>
          {language.name}
        </Txt>
        <Txt variant="micro" numberOfLines={1} style={{ marginTop: 2 }}>
          {language.tagline}
        </Txt>
        <View style={styles.progressRow}>
          <XPBar progress={total ? done / total : 0} height={6} colors={language.gradient} style={{ flex: 1 }} glow={done > 0} />
          <Txt style={styles.count}>
            {done}/{total}
          </Txt>
        </View>
      </GlassView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { paddingHorizontal: 8, height: 24, borderRadius: 8, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: colors.glassBorderSoft },
  badgeText: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.textSecondary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  count: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.textSecondary },
});
