import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { TokenText } from '@/components/code/CodeBlock';
import { GlassView } from '@/components/glass/GlassView';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { seededShuffle, type AnswerValue } from '@/lib/exercise';
import { tokenize } from '@/lib/highlighter';
import { colors, fonts, radius } from '@/theme';
import type { ArrangeExercise as ArrangeEx } from '@/types';

interface Props {
  exercise: ArrangeEx;
  value: AnswerValue | null;
  onChange: (v: AnswerValue) => void;
  locked: boolean;
  result: 'correct' | 'wrong' | null;
}

const layout = LinearTransition.springify().damping(18).stiffness(180);

/** Ordenar linhas: toque nas linhas para montá-las na ordem correta. */
export function ArrangeExercise({ exercise, value, onChange, locked, result }: Props) {
  const pool = useMemo(() => seededShuffle(exercise.lines.map((text, id) => ({ id, text })), exercise.id), [exercise.lines, exercise.id]);
  const orderIds: number[] = useMemo(() => {
    const texts = value?.type === 'arrange' ? value.order : [];
    const used = new Set<number>();
    return texts
      .map((t) => {
        const item = pool.find((p) => p.text === t && !used.has(p.id));
        if (item) used.add(item.id);
        return item?.id ?? -1;
      })
      .filter((id) => id >= 0);
  }, [value, pool]);

  const emit = (ids: number[]) => onChange({ type: 'arrange', order: ids.map((id) => pool.find((p) => p.id === id)!.text) });
  const remaining = pool.filter((p) => !orderIds.includes(p.id));
  const tone = result === 'correct' ? colors.success : result === 'wrong' ? colors.danger : colors.primary;

  return (
    <View style={{ gap: 16 }}>
      <Txt variant="title">{exercise.prompt}</Txt>

      <GlassView radius={radius.md} shadow={false} borderColor={result ? tone : colors.glassBorderSoft} tintColor="rgba(5,5,12,0.55)" style={styles.answer}>
        {orderIds.length === 0 && (
          <View style={styles.placeholder}>
            <Ionicons name="hand-left-outline" size={18} color={colors.textTertiary} />
            <Txt variant="caption" color={colors.textTertiary}>
              Toque nas linhas abaixo na ordem certa
            </Txt>
          </View>
        )}
        {orderIds.map((id, i) => {
          const item = pool.find((p) => p.id === id)!;
          return (
            <Animated.View key={id} layout={layout} entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
              <PressableScale onPress={() => !locked && emit(orderIds.filter((x) => x !== id))} disabled={locked} scaleTo={0.97} hapticStyle="tap" style={locked ? { opacity: 1 } : undefined}>
                <View style={[styles.placed, { borderLeftColor: tone }]}>
                  <Text style={styles.num}>{i + 1}</Text>
                  <Text style={styles.code} numberOfLines={2}>
                    <TokenText tokens={tokenize(item.text, exercise.codeLang)} />
                  </Text>
                </View>
              </PressableScale>
            </Animated.View>
          );
        })}
      </GlassView>

      <View style={{ gap: 8 }}>
        {remaining.map((item) => (
          <Animated.View key={item.id} layout={layout} entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
            <PressableScale onPress={() => !locked && emit([...orderIds, item.id])} disabled={locked} scaleTo={0.97} hapticStyle="tap">
              <GlassView radius={12} shadow={false} style={styles.poolItem}>
                <Text style={styles.code} numberOfLines={2}>
                  <TokenText tokens={tokenize(item.text.trimStart(), exercise.codeLang)} />
                </Text>
                <Ionicons name="add-circle" size={20} color={colors.accent} />
              </GlassView>
            </PressableScale>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  answer: { padding: 10, minHeight: 120, gap: 6 },
  placeholder: { flex: 1, minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placed: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderLeftWidth: 3 },
  num: { width: 18, fontFamily: fonts.mono, fontSize: 12, color: colors.textTertiary, textAlign: 'right' },
  code: { flex: 1, fontFamily: fonts.mono, fontSize: 14 },
  poolItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
});
