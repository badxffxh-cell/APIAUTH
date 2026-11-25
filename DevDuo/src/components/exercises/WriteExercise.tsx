import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CodeEditor } from '@/components/editor/CodeEditor';
import { GlassView } from '@/components/glass/GlassView';
import { Txt } from '@/components/ui/Txt';
import type { AnswerValue } from '@/lib/exercise';
import { colors, fonts, radius } from '@/theme';
import type { WriteExercise as WriteEx } from '@/types';

interface Props {
  exercise: WriteEx;
  value: AnswerValue | null;
  onChange: (v: AnswerValue) => void;
  locked: boolean;
  result: 'correct' | 'wrong' | null;
  hints?: string[];
}

/** Escrever código do zero, com highlighting ao vivo. */
export function WriteExercise({ exercise, value, onChange, locked, result, hints }: Props) {
  const code = value?.type === 'write' ? value.code : (exercise.starter ?? '');

  useEffect(() => {
    if (!value && exercise.starter) onChange({ type: 'write', code: exercise.starter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  const tone = result === 'correct' ? colors.success : result === 'wrong' ? colors.danger : colors.glassBorder;

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.badge}>
        <Ionicons name="create-outline" size={14} color={colors.accent} />
        <Txt variant="label" color={colors.accent}>
          Escreva o código
        </Txt>
      </View>
      <Txt variant="title">{exercise.prompt}</Txt>
      <GlassView radius={radius.md} shadow={false} borderColor={tone} tintColor="rgba(5,5,12,0.7)" style={styles.editor}>
        <View style={styles.bar}>
          <View style={[styles.dot, { backgroundColor: '#FF5F57' }]} />
          <View style={[styles.dot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[styles.dot, { backgroundColor: '#28C840' }]} />
          <Txt style={styles.file}>exercicio.{ext(exercise.codeLang)}</Txt>
        </View>
        <View style={{ padding: 14 }}>
          <CodeEditor
            compact
            value={code}
            onChange={(c) => onChange({ type: 'write', code: c })}
            language={exercise.codeLang}
            editable={!locked}
            fontSize={15}
            placeholder={exercise.placeholder ?? 'Digite aqui...'}
            minHeight={120}
          />
        </View>
      </GlassView>
      {result === 'wrong' && hints && hints.length > 0 && (
        <Animated.View entering={FadeInDown.springify()} style={{ gap: 6 }}>
          {hints.map((h) => (
            <View key={h} style={styles.hint}>
              <Ionicons name="bulb" size={15} color={colors.warning} />
              <Txt variant="caption" color={colors.text} style={{ flex: 1 }}>
                {h}
              </Txt>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

function ext(lang: string) {
  return { html: 'html', css: 'css', javascript: 'js', typescript: 'ts', python: 'py', swift: 'swift', kotlin: 'kt', sql: 'sql' }[lang] ?? 'txt';
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editor: { overflow: 'hidden' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorderSoft, backgroundColor: 'rgba(255,255,255,0.04)' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  file: { marginLeft: 8, fontFamily: fonts.mono, fontSize: 11, color: colors.textTertiary },
  hint: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,176,32,0.10)', borderWidth: 1, borderColor: 'rgba(255,176,32,0.3)' },
});
