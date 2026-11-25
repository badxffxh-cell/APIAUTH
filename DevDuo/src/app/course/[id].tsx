import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSheet } from '@/components/glass/GlassSheet';
import { GlassView } from '@/components/glass/GlassView';
import { LessonNode, type NodeState } from '@/components/learn/LessonNode';
import { TrailPath } from '@/components/learn/TrailPath';
import { ProgressRing } from '@/components/skia/ProgressRing';
import { LanguageIcon3D } from '@/components/three/LanguageIcon3D';
import { GradientIcon, IconButton, StatPill } from '@/components/ui/Bits';
import { GradientButton } from '@/components/ui/GradientButton';
import { ScreenBackground } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { LANGUAGE_MAP, LEVEL_LABEL } from '@/data/languages';
import { LESSONS_BY_LANGUAGE, LEVEL_ORDER } from '@/data/lessons';
import { haptic } from '@/lib/haptics';
import { REFILL_COST, isLessonUnlocked, languageProgress, useProgress } from '@/store/progress';
import { colors, fonts, gradients, radius } from '@/theme';
import type { LanguageId, Lesson } from '@/types';

const NODE = 78;
const NODE_ROW = 136;
const BANNER = 96;
const OFFSETS = [0, 62, 92, 62, 0, -62, -92, -62];
const LEVEL_DESC = {
  iniciante: 'Fundamentos para começar do zero',
  intermediario: 'Coloque a mão na massa',
  avancado: 'Domine os detalhes',
} as const;
const LEVEL_COLORS = {
  iniciante: gradients.success,
  intermediario: gradients.primary,
  avancado: gradients.flame,
} as const;

type Item = { kind: 'banner'; level: keyof typeof LEVEL_LABEL; y: number; unit: number } | { kind: 'node'; lesson: Lesson; index: number; x: number; y: number };

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { width } = useWindowDimensions();
  const lang = LANGUAGE_MAP[(id as LanguageId) ?? 'html'] ?? LANGUAGE_MAP.html;
  const lessons = LESSONS_BY_LANGUAGE[lang.id];
  const completed = useProgress((s) => s.completedLessons);
  const hearts = useProgress((s) => s.hearts);
  const gems = useProgress((s) => s.gems);
  const refill = useProgress((s) => s.refillHearts);
  const prog = languageProgress(completed, lang.id);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const scrollY = useSharedValue(0);

  const { items, height, points } = useMemo(() => {
    const items: Item[] = [];
    let y = 0;
    let n = 0;
    let unit = 0;
    for (const level of LEVEL_ORDER) {
      const group = lessons.filter((l) => l.level === level);
      if (!group.length) continue;
      unit++;
      items.push({ kind: 'banner', level, y, unit });
      y += BANNER + 56;
      for (const lesson of group) {
        items.push({ kind: 'node', lesson, index: n, x: width / 2 + OFFSETS[n % OFFSETS.length], y });
        y += NODE_ROW;
        n++;
      }
    }
    const points = items.filter((i): i is Extract<Item, { kind: 'node' }> => i.kind === 'node').map((i) => ({ x: i.x, y: i.y + NODE / 2 }));
    return { items, height: y + 20, points };
  }, [lessons, width]);

  const stateOf = (lesson: Lesson): NodeState => {
    if (completed[lesson.id]) return 'done';
    return isLessonUnlocked(completed, lang.id, lesson.id) ? 'current' : 'locked';
  };
  const doneCount = lessons.findIndex((l) => !completed[l.id]);
  const doneSegments = doneCount < 0 ? lessons.length - 1 : doneCount;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 160], [1, 0.2], 'clamp'),
    transform: [{ translateY: scrollY.value * 0.35 }, { scale: interpolate(scrollY.value, [-100, 0], [1.15, 1], 'clamp') }],
  }));
  const barStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [120, 200], [0, 1], 'clamp') }));

  const open = (lesson: Lesson) => {
    if (stateOf(lesson) === 'locked') {
      haptic.warning();
      return;
    }
    setSelected(lesson);
  };

  const selectedState = selected ? stateOf(selected) : 'locked';

  return (
    <ScreenBackground palette={[`${lang.color}55`, 'rgba(108,99,255,0.30)', 'rgba(0,229,255,0.14)']}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: 140 }}>
        <Animated.View style={[styles.hero, heroStyle]}>
          <LanguageIcon3D shape={lang.shape} color={lang.color} size={118} radius={34} paused={!focused} energetic />
          <View style={{ flex: 1, gap: 6 }}>
            <Txt variant="label" color={lang.color}>
              Trilha
            </Txt>
            <Txt variant="display">{lang.name}</Txt>
            <Txt variant="caption">{lang.tagline}</Txt>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <GlassView radius={22} style={styles.summary}>
            <ProgressRing size={58} stroke={7} progress={prog.ratio} colors={[lang.gradient[0], lang.gradient[1], colors.accent]}>
              <Txt style={styles.pct}>{Math.round(prog.ratio * 100)}%</Txt>
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">
                {prog.done} de {prog.total} lições
              </Txt>
              <Txt variant="caption">{prog.done === prog.total ? 'Trilha concluída! Revise quando quiser.' : 'Continue de onde parou'}</Txt>
            </View>
            <StatPill icon="heart" value={hearts} color={colors.heart} />
          </GlassView>
        </Animated.View>

        <View style={{ height, marginTop: 30 }}>
          <TrailPath points={points} width={width} height={height} doneSegments={doneSegments} />
          {items.map((item) =>
            item.kind === 'banner' ? (
              <Animated.View key={item.level} entering={FadeIn.delay(150)} style={[styles.bannerWrap, { top: item.y }]}>
                <GlassView radius={22} style={styles.banner}>
                  <GradientIcon icon={item.level === 'iniciante' ? 'leaf' : item.level === 'intermediario' ? 'flash' : 'rocket'} colors={LEVEL_COLORS[item.level]} size={44} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="micro" color={colors.textTertiary}>
                      UNIDADE {item.unit}
                    </Txt>
                    <Txt variant="headline">{LEVEL_LABEL[item.level]}</Txt>
                    <Txt variant="micro">{LEVEL_DESC[item.level]}</Txt>
                  </View>
                </GlassView>
              </Animated.View>
            ) : (
              <Animated.View key={item.lesson.id} entering={FadeInDown.delay(200 + item.index * 70).springify().damping(14)} style={{ position: 'absolute', top: item.y, left: item.x - 75 }}>
                <LessonNode icon={item.lesson.icon} title={item.lesson.title} state={stateOf(item.lesson)} color={lang.color} size={NODE} onPress={() => open(item.lesson)} />
              </Animated.View>
            )
          )}
        </View>
      </Animated.ScrollView>

      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, barStyle]} pointerEvents="none">
          <GlassView radius={0} strong shadow={false} highlight={false} borderColor="transparent" style={StyleSheet.absoluteFill} />
        </Animated.View>
        <IconButton icon="chevron-back" onPress={() => router.back()} />
        <Animated.View style={[{ flex: 1, alignItems: 'center' }, barStyle]}>
          <Txt variant="headline">{lang.name}</Txt>
        </Animated.View>
        <View style={{ width: 42 }} />
      </View>

      <GlassSheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.title} subtitle={selected ? `${LEVEL_LABEL[selected.level]} · ${lang.name}` : undefined}>
        {selected && (
          <View style={{ gap: 16 }}>
            <Txt variant="body" dim>
              {selected.description}
            </Txt>
            <View style={styles.metaRow}>
              <Meta icon="flash" label={`${selected.xp} XP`} color={colors.gold} />
              <Meta icon="list" label={`${selected.exercises.length} etapas`} color={colors.accent} />
              <Meta icon="time" label={`~${Math.max(2, Math.round(selected.exercises.length * 0.7))} min`} color={colors.primaryLight} />
            </View>
            {completed[selected.id] && (
              <View style={styles.doneRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Txt variant="caption" color={colors.success}>
                  Concluída · melhor precisão {Math.round(completed[selected.id].bestAccuracy * 100)}%
                </Txt>
              </View>
            )}
            {hearts === 0 ? (
              <View style={{ gap: 10 }}>
                <Txt variant="caption" color={colors.danger}>
                  Você está sem corações. Eles se regeneram com o tempo.
                </Txt>
                <GradientButton title={`Recarregar por ${REFILL_COST} 💎 (você tem ${gems})`} variant="danger" disabled={gems < REFILL_COST} onPress={() => refill()} />
              </View>
            ) : (
              <GradientButton
                title={selectedState === 'done' ? 'Revisar lição' : 'Começar lição'}
                icon="play"
                variant={selectedState === 'done' ? 'success' : 'primary'}
                onPress={() => {
                  const l = selected;
                  setSelected(null);
                  setTimeout(() => router.push(`/lesson/${l.id}`), 180);
                }}
              />
            )}
          </View>
        )}
      </GlassSheet>
    </ScreenBackground>
  );
}

function Meta({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={15} color={color} />
      <Txt variant="caption" color={colors.text}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 20 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  pct: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  bannerWrap: { position: 'absolute', left: 20, right: 20 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, height: BANNER },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  metaRow: { flexDirection: 'row', gap: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.07)' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
