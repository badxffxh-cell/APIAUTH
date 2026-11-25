import { useIsFocused, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView } from '@/components/glass/GlassView';
import { LanguageCard } from '@/components/learn/LanguageCard';
import { AmbientOrbs } from '@/components/skia/AmbientOrbs';
import { ProgressRing } from '@/components/skia/ProgressRing';
import { XPBar } from '@/components/skia/XPBar';
import { ParticleCodeBackground } from '@/components/three/ParticleCodeBackground';
import { SectionHeader, StatPill } from '@/components/ui/Bits';
import { GradientButton } from '@/components/ui/GradientButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { TAB_BAR_SPACE } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { LANGUAGES, LANGUAGE_MAP } from '@/data/languages';
import { ALL_LESSONS } from '@/data/lessons';
import { dayKey } from '@/lib/date';
import { effectiveStreak, languageProgress, levelFromXp, nextRecommendedLesson, useProgress } from '@/store/progress';
import { colors, fonts } from '@/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { width } = useWindowDimensions();
  const p = useProgress();
  const streak = effectiveStreak(p);
  const todayXp = p.xpByDay[dayKey()] ?? 0;
  const level = levelFromXp(p.xp);
  const next = nextRecommendedLesson(p.completedLessons);
  const nextLang = LANGUAGE_MAP[next.languageId];
  const cardW = (width - 20 * 2 - 12) / 2;

  return (
    <View style={styles.root}>
      <ParticleCodeBackground paused={!focused} />
      <AmbientOrbs intensity={0.55} />
      <LinearGradient pointerEvents="none" colors={['rgba(8,8,16,0)', 'rgba(8,8,16,0.85)']} locations={[0.25, 0.6]} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: TAB_BAR_SPACE, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <PressableScale onPress={() => router.navigate('/profile')} hapticStyle="tap" style={styles.avatarWrap}>
            <LinearGradient colors={['#6C63FF', '#00E5FF']} style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Txt style={{ fontSize: 20 }}>{p.avatar}</Txt>
              </View>
            </LinearGradient>
          </PressableScale>
          <View style={{ flex: 1 }}>
            <Txt variant="caption">{greeting()},</Txt>
            <Txt variant="headline" numberOfLines={1}>
              {p.username}
            </Txt>
          </View>
          <View style={styles.stats}>
            <StatPill icon="flame" value={streak} color={streak > 0 ? colors.flame : colors.textTertiary} onPress={() => router.navigate('/profile')} />
            <StatPill icon="heart" value={p.hearts} color={colors.heart} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).duration(700)} style={styles.heroSpace}>
          <Txt style={styles.heroKicker}>DEVDUO</Txt>
          <Txt style={styles.heroTitle}>Aprenda a programar{'\n'}jogando.</Txt>
          <Txt variant="caption" style={{ marginTop: 6 }}>
            {LANGUAGES.length} linguagens · {ALL_LESSONS.length} lições interativas
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify().damping(16)}>
          <GlassView radius={28} style={styles.hero}>
            <View style={styles.heroRow}>
              <ProgressRing size={104} stroke={11} progress={todayXp / p.dailyGoal}>
                <Txt style={styles.ringValue}>{todayXp}</Txt>
                <Txt variant="micro">/ {p.dailyGoal} XP</Txt>
              </ProgressRing>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt variant="label">Meta diária</Txt>
                <Txt variant="headline">{todayXp >= p.dailyGoal ? 'Meta batida! 🎉' : `Faltam ${Math.max(0, p.dailyGoal - todayXp)} XP`}</Txt>
                <View style={styles.levelRow}>
                  <Txt style={styles.level}>Nível {level.level}</Txt>
                  <Txt variant="micro">
                    {level.current}/{level.needed} XP
                  </Txt>
                </View>
                <XPBar progress={level.progress} height={9} />
              </View>
            </View>
            <View style={styles.nextBox}>
              <View style={{ flex: 1 }}>
                <Txt variant="micro" color={nextLang.color}>
                  {nextLang.name.toUpperCase()} · PRÓXIMA LIÇÃO
                </Txt>
                <Txt variant="bodyStrong" numberOfLines={1}>
                  {next.title}
                </Txt>
              </View>
              <GradientButton title="Continuar" iconRight="play" size="md" onPress={() => router.push(`/lesson/${next.id}`)} />
            </View>
          </GlassView>
        </Animated.View>

        <SectionHeader title="Trilhas" action="Ranking" onAction={() => router.push('/ranking')} style={{ marginTop: 28 }} />
        <View style={styles.grid}>
          {LANGUAGES.map((lang, i) => {
            const prog = languageProgress(p.completedLessons, lang.id);
            return (
              <Animated.View key={lang.id} entering={FadeInDown.delay(200 + i * 60).springify().damping(15)}>
                <LanguageCard language={lang} done={prog.done} total={prog.total} width={cardW} paused={!focused} onPress={() => router.push(`/course/${lang.id}`)} />
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {},
  avatarRing: { width: 46, height: 46, borderRadius: 23, padding: 2 },
  avatar: { flex: 1, borderRadius: 21, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 8 },
  heroSpace: { height: 270, justifyContent: 'flex-end', paddingBottom: 18 },
  heroKicker: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 4, color: colors.accent },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 35, color: colors.text, letterSpacing: -0.8, marginTop: 6 },
  hero: { padding: 18, gap: 18 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  ringValue: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text, letterSpacing: -0.5 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  level: { fontFamily: fonts.bold, fontSize: 13, color: colors.accent },
  nextBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingLeft: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.glassBorderSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
