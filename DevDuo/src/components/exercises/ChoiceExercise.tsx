import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { CodeBlock } from '@/components/code/CodeBlock';
import { GlassView } from '@/components/glass/GlassView';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import type { AnswerValue } from '@/lib/exercise';
import { colors, fonts, radius } from '@/theme';
import type { ChoiceExercise as ChoiceEx } from '@/types';

interface Props {
  exercise: ChoiceEx;
  value: AnswerValue | null;
  onChange: (v: AnswerValue) => void;
  locked: boolean;
  result: 'correct' | 'wrong' | null;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function ChoiceExercise({ exercise, value, onChange, locked, result }: Props) {
  const selected = value?.type === 'choice' ? value.selected : null;
  return (
    <View style={{ gap: 16 }}>
      <Txt variant="title">{exercise.prompt}</Txt>
      {exercise.code && <CodeBlock code={exercise.code} lang={exercise.codeLang ?? 'html'} copy={false} />}
      <View style={{ gap: 10 }}>
        {exercise.options.map((opt, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(80 + i * 60).springify().damping(16)}>
            <Option
              label={opt}
              letter={LETTERS[i]}
              mono={exercise.monoOptions}
              selected={selected === i}
              state={result && locked ? (i === exercise.answer ? 'correct' : selected === i ? 'wrong' : null) : null}
              disabled={locked}
              onPress={() => onChange({ type: 'choice', selected: i })}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function Option({
  label,
  letter,
  mono,
  selected,
  state,
  disabled,
  onPress,
}: {
  label: string;
  letter: string;
  mono?: boolean;
  selected: boolean;
  state: 'correct' | 'wrong' | null;
  disabled: boolean;
  onPress: () => void;
}) {
  const shake = useSharedValue(0);
  useEffect(() => {
    if (state === 'wrong') {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [state, shake]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const tone = state === 'correct' ? colors.success : state === 'wrong' ? colors.danger : selected ? colors.primary : null;
  return (
    <Animated.View style={anim}>
      <PressableScale onPress={onPress} disabled={disabled && !selected && !state} scaleTo={0.97} hapticStyle="tap" style={disabled ? { opacity: 1 } : undefined}>
        <GlassView
          radius={radius.md}
          shadow={false}
          borderColor={tone ?? colors.glassBorderSoft}
          tintColor={tone ? `${tone}22` : undefined}
          style={[styles.option, tone ? { shadowColor: tone, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } } : null]}
        >
          {tone ? (
            <LinearGradient colors={[tone, `${tone}99`]} style={styles.letter}>
              {state ? (
                <Ionicons name={state === 'correct' ? 'checkmark' : 'close'} size={16} color={colors.textInverse} />
              ) : (
                <Txt style={[styles.letterText, { color: '#fff' }]}>{letter}</Txt>
              )}
            </LinearGradient>
          ) : (
            <View style={[styles.letter, styles.letterIdle]}>
              <Txt style={styles.letterText}>{letter}</Txt>
            </View>
          )}
          <Txt style={[styles.label, mono && { fontFamily: fonts.monoMedium, fontSize: 15 }]}>{label}</Txt>
        </GlassView>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 14, minHeight: 58 },
  letter: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  letterIdle: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.glassBorderSoft },
  letterText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSecondary },
  label: { flex: 1, fontFamily: fonts.semibold, fontSize: 15.5, color: colors.text, lineHeight: 21 },
});
