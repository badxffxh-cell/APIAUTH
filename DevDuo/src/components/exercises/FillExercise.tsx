import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { TokenText } from '@/components/code/CodeBlock';
import { GlassView } from '@/components/glass/GlassView';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { seededShuffle, type AnswerValue } from '@/lib/exercise';
import { tokenize } from '@/lib/highlighter';
import { colors, fonts, radius, syntax } from '@/theme';
import type { FillExercise as FillEx } from '@/types';

interface Props {
  exercise: FillEx;
  value: AnswerValue | null;
  onChange: (v: AnswerValue) => void;
  locked: boolean;
  result: 'correct' | 'wrong' | null;
}

type Piece = { kind: 'text'; text: string } | { kind: 'slot'; index: number };

/** Divide o template em linhas, cada uma com trechos de texto e lacunas. */
function parseTemplate(template: string): Piece[][] {
  return template.split('\n').map((line) => {
    const pieces: Piece[] = [];
    const re = /\{\{(\d+)\}\}/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m.index > last) pieces.push({ kind: 'text', text: line.slice(last, m.index) });
      pieces.push({ kind: 'slot', index: Number(m[1]) });
      last = m.index + m[0].length;
    }
    if (last < line.length) pieces.push({ kind: 'text', text: line.slice(last) });
    return pieces;
  });
}

export function FillExercise({ exercise, value, onChange, locked, result }: Props) {
  const lines = useMemo(() => parseTemplate(exercise.template), [exercise.template]);
  // Cada ficha do banco recebe um id único (o banco pode ter palavras repetidas).
  const bank = useMemo(() => seededShuffle(exercise.bank.map((text, id) => ({ id, text })), exercise.id), [exercise.bank, exercise.id]);
  const slots: (number | null)[] = useMemo(() => {
    const raw = value?.type === 'fill' ? value.slots : [];
    // Reconstrói ids de fichas a partir dos textos (estado guardado como texto).
    const used = new Set<number>();
    return exercise.blanks.map((_, i) => {
      const t = raw[i];
      if (t == null) return null;
      const chip = bank.find((b) => b.text === t && !used.has(b.id));
      if (!chip) return null;
      used.add(chip.id);
      return chip.id;
    });
  }, [value, exercise.blanks, bank]);

  const emit = (next: (number | null)[]) =>
    onChange({ type: 'fill', slots: next.map((id) => (id === null ? null : (bank.find((b) => b.id === id)?.text ?? null))) });

  const place = (chipId: number) => {
    if (locked) return;
    const i = slots.findIndex((s) => s === null);
    if (i < 0) return;
    const next = slots.slice();
    next[i] = chipId;
    emit(next);
  };

  const remove = (slotIndex: number) => {
    if (locked) return;
    const next = slots.slice();
    next[slotIndex] = null;
    emit(next);
  };

  const usedIds = new Set(slots.filter((s): s is number => s !== null));
  const tone = result === 'correct' ? colors.success : result === 'wrong' ? colors.danger : colors.accent;

  return (
    <View style={{ gap: 18 }}>
      <Txt variant="title">{exercise.prompt}</Txt>
      <View style={styles.codeWindow}>
        {lines.map((pieces, li) => (
          <View key={li} style={styles.line}>
            <Text style={styles.lineNo}>{li + 1}</Text>
            <View style={styles.lineBody}>
              {pieces.length === 0 && <Text style={styles.code}> </Text>}
              {pieces.map((p, pi) =>
                p.kind === 'text' ? (
                  <Text key={pi} style={styles.code}>
                    <TokenText tokens={tokenize(p.text, exercise.codeLang)} />
                  </Text>
                ) : (
                  <PressableScale key={pi} onPress={() => remove(p.index)} disabled={locked || slots[p.index] === null} hapticStyle="tap" scaleTo={0.92} style={{ opacity: 1 }}>
                    {slots[p.index] !== null ? (
                      <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.slotFilled, { borderColor: tone, shadowColor: tone }]}>
                        <Text style={styles.slotText}>{bank.find((b) => b.id === slots[p.index])?.text}</Text>
                      </Animated.View>
                    ) : (
                      <View style={styles.slotEmpty} />
                    )}
                  </PressableScale>
                )
              )}
            </View>
          </View>
        ))}
      </View>

      <Txt variant="label">Toque para encaixar</Txt>
      <View style={styles.bank}>
        {bank.map((chip) => {
          const used = usedIds.has(chip.id);
          return (
            <Animated.View key={chip.id} entering={FadeIn.delay(chip.id * 40)}>
              <PressableScale onPress={() => place(chip.id)} disabled={used || locked} scaleTo={0.9} hapticStyle="tap" style={used ? { opacity: 1 } : undefined}>
                {used ? (
                  <View style={[styles.chip, styles.chipGhost]}>
                    <Text style={[styles.chipText, { opacity: 0 }]}>{chip.text}</Text>
                  </View>
                ) : (
                  <GlassView radius={12} shadow={false} style={styles.chip}>
                    <Text style={styles.chipText}>{chip.text}</Text>
                  </GlassView>
                )}
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  codeWindow: { borderRadius: radius.md, backgroundColor: 'rgba(5,5,12,0.8)', borderWidth: 1, borderColor: colors.glassBorderSoft, paddingVertical: 14, paddingRight: 12 },
  line: { flexDirection: 'row', minHeight: 34, alignItems: 'center' },
  lineNo: { width: 34, textAlign: 'right', paddingRight: 10, fontFamily: fonts.mono, fontSize: 12, color: 'rgba(255,255,255,0.22)' },
  lineBody: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  code: { fontFamily: fonts.mono, fontSize: 14.5, color: syntax.plain },
  slotEmpty: { minWidth: 64, height: 28, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(0,229,255,0.55)', backgroundColor: 'rgba(0,229,255,0.06)', marginHorizontal: 2 },
  slotFilled: { height: 28, paddingHorizontal: 9, borderRadius: 8, borderWidth: 1.5, backgroundColor: 'rgba(108,99,255,0.25)', justifyContent: 'center', marginHorizontal: 2, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  slotText: { fontFamily: fonts.monoBold, fontSize: 14, color: '#fff' },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, height: 42, justifyContent: 'center', borderRadius: 12 },
  chipGhost: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.glassBorderSoft },
  chipText: { fontFamily: fonts.monoMedium, fontSize: 15, color: colors.text },
});
