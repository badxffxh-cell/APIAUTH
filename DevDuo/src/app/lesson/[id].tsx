import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOutLeft, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CodeBlock } from '@/components/code/CodeBlock';
import { ArrangeExercise } from '@/components/exercises/ArrangeExercise';
import { ChoiceExercise } from '@/components/exercises/ChoiceExercise';
import { FillExercise } from '@/components/exercises/FillExercise';
import { LearnCard } from '@/components/exercises/LearnCard';
import { WriteExercise } from '@/components/exercises/WriteExercise';
import { GlassView } from '@/components/glass/GlassView';
import { LessonComplete } from '@/components/learn/LessonComplete';
import { XPBar } from '@/components/skia/XPBar';
import { GradientIcon, IconButton } from '@/components/ui/Bits';
import { GradientButton } from '@/components/ui/GradientButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenBackground } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { LANGUAGE_MAP } from '@/data/languages';
import { getLesson, nextLessonOf } from '@/data/lessons';
import { evaluate, isAnswerReady, type AnswerValue, type Evaluation } from '@/lib/exercise';
import { haptic } from '@/lib/haptics';
import { MAX_HEARTS, REFILL_COST, msToNextHeart, useProgress, type LessonResult } from '@/store/progress';
import { useAIUI, useCelebration } from '@/store/ui';
import { formatCountdown } from '@/lib/date';
import { colors, fonts } from '@/theme';
import type { Exercise } from '@/types';

type Phase = 'answering' | 'feedback' | 'done' | 'noHearts';
type QueueItem = { key: string; exercise: Exercise };

const PRAISE = ['Mandou bem!', 'Excelente!', 'Perfeito!', 'Isso aí!', 'Código limpo!', 'Brilhante!'];

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getLesson(id ?? '');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hearts = useProgress((s) => s.hearts);
  const loseHeart = useProgress((s) => s.loseHeart);
  const refill = useProgress((s) => s.refillHearts);
  const completeLesson = useProgress((s) => s.completeLesson);
  const setContext = useAIUI((s) => s.setContext);
  const setAIOpen = useAIUI((s) => s.setOpen);
  const ask = useAIUI((s) => s.ask);

  const [queue, setQueue] = useState<QueueItem[]>(() => (lesson?.exercises ?? []).map((e) => ({ key: e.id, exercise: e })));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [phase, setPhase] = useState<Phase>(() => (useProgress.getState().hearts <= 0 ? 'noHearts' : 'answering'));
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [result, setResult] = useState<(LessonResult & { durationMs: number }) | null>(null);
  const [startedAt] = useState(() => Date.now());
  const stats = useRef({ correct: 0, answered: 0, mistakes: 0 });
  const pendingAdvance = useRef(false);
  const [doneCount, setDoneCount] = useState(0);
  const heartScale = useSharedValue(1);

  const current = queue[index];
  const lang = lesson ? LANGUAGE_MAP[lesson.languageId] : undefined;
  const total = lesson?.exercises.length ?? 1;
  const next = useMemo(() => (lesson ? nextLessonOf(lesson) : undefined), [lesson]);

  // Contexto automático para o Assistente IA.
  useEffect(() => {
    if (!lesson || !current) return;
    const ex = current.exercise;
    const code = ex.type === 'write' ? (answer?.type === 'write' ? answer.code : ex.starter) : ex.type === 'fill' ? ex.template.replace(/\{\{\d+\}\}/g, '____') : 'code' in ex ? ex.code : undefined;
    setContext({ kind: 'lesson', lessonTitle: lesson.title, language: lang?.name ?? '', prompt: ex.type === 'learn' ? ex.title : ex.prompt, code });
  }, [lesson, current, answer, lang, setContext]);

  useEffect(() => () => setContext(null), [setContext]);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  if (!lesson || !lang) {
    return (
      <ScreenBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Txt variant="title">Lição não encontrada</Txt>
          <GradientButton title="Voltar" onPress={() => router.back()} />
        </View>
      </ScreenBackground>
    );
  }

  const exercise = current?.exercise;
  const locked = phase === 'feedback';
  const ready = exercise ? isAnswerReady(exercise, answer) : false;
  const resultTone = phase === 'feedback' && evaluation ? (evaluation.correct ? 'correct' : 'wrong') : null;

  const quit = () => {
    if (phase === 'done' || doneCount === 0) return router.back();
    Alert.alert('Sair da lição?', 'Seu progresso nesta lição será perdido.', [
      { text: 'Continuar estudando', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const check = () => {
    if (!exercise) return;
    if (exercise.type === 'learn') return advance();
    const ev = evaluate(exercise, answer);
    setEvaluation(ev);
    setPhase('feedback');
    stats.current.answered++;
    if (ev.correct) {
      haptic.success();
      stats.current.correct++;
    } else {
      haptic.error();
      stats.current.mistakes++;
      loseHeart();
      heartScale.set(withSequence(withTiming(1.45, { duration: 120 }), withSpring(1, { damping: 6 })));
      // Exercício errado volta para o fim da fila (estilo Duolingo).
      setQueue((q) => [...q, { key: `${exercise.id}-retry-${q.length}`, exercise }]);
    }
  };

  const proceed = () => {
    if (index + 1 >= queue.length) {
      const r = completeLesson({
        lessonId: lesson.id,
        baseXp: lesson.xp,
        correct: stats.current.correct,
        answered: stats.current.answered,
        mistakes: stats.current.mistakes,
        durationMs: Date.now() - startedAt,
      });
      setResult({ ...r, durationMs: Date.now() - startedAt });
      setPhase('done');
      haptic.success();
      return;
    }
    setIndex((i) => i + 1);
    setPhase('answering');
  };

  const advance = () => {
    const wasCorrect = exercise?.type === 'learn' || evaluation?.correct;
    if (wasCorrect) setDoneCount((c) => c + 1);
    setEvaluation(null);
    setAnswer(null);
    if (useProgress.getState().hearts <= 0) {
      pendingAdvance.current = true;
      setPhase('noHearts');
      return;
    }
    proceed();
  };

  const resume = () => {
    if (pendingAdvance.current) {
      pendingAdvance.current = false;
      proceed();
    } else setPhase('answering');
  };

  const progress = Math.min(1, (doneCount + (phase === 'feedback' && evaluation?.correct ? 1 : 0)) / total);

  if (phase === 'done' && result) {
    return (
      <ScreenBackground>
        <LessonComplete
          result={result}
          durationMs={result.durationMs}
          hasNext={!!next}
          onContinue={() => {
            router.back();
            if (result.newAchievements.length) setTimeout(() => useCelebration.getState().push(result.newAchievements), 500);
          }}
          onNext={() => {
            if (result.newAchievements.length) useCelebration.getState().push(result.newAchievements);
            router.replace(`/lesson/${next!.id}`);
          }}
        />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground palette={[`${lang.color}40`, 'rgba(108,99,255,0.28)', 'rgba(0,229,255,0.12)']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <IconButton icon="close" onPress={quit} size={40} />
          <XPBar progress={progress} height={14} style={{ flex: 1 }} colors={['#00FF94', '#00E5FF']} />
          <Animated.View style={[styles.hearts, heartStyle]}>
            <Ionicons name="heart" size={20} color={colors.heart} style={{ textShadowColor: colors.heart, textShadowRadius: 10 }} />
            <Txt style={styles.heartsText}>{hearts}</Txt>
          </Animated.View>
          <IconButton icon="sparkles" size={40} color={colors.accent} onPress={() => setAIOpen(true)} />
        </View>

        {phase === 'noHearts' ? (
          <NoHearts
            onRefill={() => {
              if (refill()) {
                haptic.success();
                resume();
              }
            }}
            onResume={resume}
            onLeave={() => router.back()}
          />
        ) : (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {current && (
                <Animated.View key={current.key} entering={FadeInRight.springify().damping(18)} exiting={FadeOutLeft.duration(150)}>
                  {current.key.includes('retry') && (
                    <View style={styles.retry}>
                      <Ionicons name="refresh" size={14} color={colors.warning} />
                      <Txt variant="micro" color={colors.warning}>
                        ERRO ANTERIOR · TENTE DE NOVO
                      </Txt>
                    </View>
                  )}
                  <ExerciseView exercise={current.exercise} value={answer} onChange={setAnswer} locked={locked} result={resultTone} hints={evaluation?.hints} />
                </Animated.View>
              )}
            </ScrollView>

            {phase === 'answering' && (
              <Animated.View entering={FadeIn} style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <GradientButton title={exercise?.type === 'learn' ? 'Entendi!' : 'Verificar'} onPress={check} disabled={!ready} />
              </Animated.View>
            )}

            {phase === 'feedback' && evaluation && exercise && (
              <Feedback
                evaluation={evaluation}
                exercise={exercise}
                bottom={insets.bottom}
                onContinue={advance}
                onAskAI={() => ask('Errei este exercício. Pode me explicar o porquê e me dar uma dica para acertar?')}
              />
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

function ExerciseView(props: { exercise: Exercise; value: AnswerValue | null; onChange: (v: AnswerValue) => void; locked: boolean; result: 'correct' | 'wrong' | null; hints?: string[] }) {
  const { exercise } = props;
  switch (exercise.type) {
    case 'learn':
      return <LearnCard exercise={exercise} />;
    case 'choice':
      return <ChoiceExercise {...props} exercise={exercise} />;
    case 'fill':
      return <FillExercise {...props} exercise={exercise} />;
    case 'write':
      return <WriteExercise {...props} exercise={exercise} />;
    case 'arrange':
      return <ArrangeExercise {...props} exercise={exercise} />;
  }
}

function Feedback({ evaluation, exercise, bottom, onContinue, onAskAI }: { evaluation: Evaluation; exercise: Exercise; bottom: number; onContinue: () => void; onAskAI: () => void }) {
  const ok = evaluation.correct;
  const tone = ok ? colors.success : colors.danger;
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  const showSolution = !ok && evaluation.solution && exercise.type !== 'choice';
  const codeLang = 'codeLang' in exercise && exercise.codeLang ? exercise.codeLang : 'html';
  return (
    <Animated.View entering={SlideInDown.springify().damping(18).stiffness(160)} exiting={SlideOutDown.duration(180)} style={styles.feedbackWrap}>
      <GlassView radius={30} strong intensity={70} borderColor={`${tone}88`} tintColor={ok ? 'rgba(0,255,148,0.10)' : 'rgba(255,77,109,0.12)'} style={[styles.feedback, { paddingBottom: bottom + 14 }]}>
        <View style={styles.feedbackHead}>
          <GradientIcon icon={ok ? 'checkmark-circle' : 'close-circle'} colors={ok ? ['#00FF94', '#00C2A8'] : ['#FF4D6D', '#FF8A3D']} size={40} />
          <View style={{ flex: 1 }}>
            <Txt variant="title" color={tone}>
              {ok ? praise : 'Quase lá!'}
            </Txt>
          </View>
          {!ok && (
            <PressableScale onPress={onAskAI} hapticStyle="tap" style={styles.askAI}>
              <Ionicons name="sparkles" size={14} color={colors.accent} />
              <Txt variant="micro" color={colors.accent}>
                Perguntar à IA
              </Txt>
            </PressableScale>
          )}
        </View>
        {!ok && exercise.type === 'choice' && evaluation.solution && (
          <Txt variant="bodyStrong">
            Resposta correta: <Txt style={{ fontFamily: fonts.monoBold, color: colors.success }}>{evaluation.solution}</Txt>
          </Txt>
        )}
        {showSolution && <CodeBlock code={evaluation.solution!} lang={codeLang} title="solução" fontSize={12.5} copy={false} />}
        {!!exercise.explanation && (
          <Txt variant="caption" color={colors.text} style={{ opacity: 0.85, lineHeight: 19 }}>
            {exercise.explanation}
          </Txt>
        )}
        <GradientButton title="Continuar" variant={ok ? 'success' : 'danger'} onPress={onContinue} style={{ marginTop: 4 }} />
      </GlassView>
    </Animated.View>
  );
}

function NoHearts({ onRefill, onResume, onLeave }: { onRefill: () => void; onResume: () => void; onLeave: () => void }) {
  const hearts = useProgress((s) => s.hearts);
  const heartsUpdatedAt = useProgress((s) => s.heartsUpdatedAt);
  const gems = useProgress((s) => s.gems);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      useProgress.getState().syncHearts();
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = msToNextHeart({ hearts, heartsUpdatedAt }, now);
  return (
    <Animated.View entering={FadeIn} style={styles.noHearts}>
      <GradientIcon icon={hearts > 0 ? 'heart' : 'heart-dislike'} colors={['#FF4D6D', '#C9184A']} size={96} />
      <Txt variant="title" center>
        {hearts > 0 ? 'Corações recuperados!' : 'Sem corações!'}
      </Txt>
      <Txt variant="caption" center style={{ maxWidth: 280 }}>
        {hearts > 0
          ? 'Você já pode continuar a lição.'
          : `Você ganha 1 coração a cada 20 minutos (máx. ${MAX_HEARTS}). Próximo em ${formatCountdown(remaining)}.`}
      </Txt>
      {hearts > 0 ? (
        <GradientButton title="Continuar lição" icon="play" onPress={onResume} style={{ alignSelf: 'stretch', marginTop: 12 }} />
      ) : (
        <>
          <GradientButton title={`Recarregar por ${REFILL_COST} 💎`} icon="heart" variant="danger" disabled={gems < REFILL_COST} onPress={onRefill} style={{ alignSelf: 'stretch', marginTop: 12 }} />
          <Txt variant="micro">Você tem {gems} gemas</Txt>
        </>
      )}
      <GradientButton title="Sair por enquanto" variant="glass" onPress={onLeave} style={{ alignSelf: 'stretch' }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 6 },
  hearts: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heartsText: { fontFamily: fonts.bold, fontSize: 16, color: colors.heart },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 10 },
  feedbackWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  feedback: { padding: 20, gap: 12, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  askAI: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: colors.accentSoft },
  noHearts: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
});
