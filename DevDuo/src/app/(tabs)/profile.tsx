import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PromptSheet } from '@/components/glass/GlassSheet';
import { GlassView } from '@/components/glass/GlassView';
import { Glow } from '@/components/skia/Glow';
import { ProgressRing } from '@/components/skia/ProgressRing';
import { WeeklyChart } from '@/components/skia/WeeklyChart';
import { GradientIcon, IconButton, SectionHeader } from '@/components/ui/Bits';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenBackground, ScreenTitle, TAB_BAR_SPACE } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { ACHIEVEMENTS } from '@/data/achievements';
import { LANGUAGES } from '@/data/languages';
import { buildLeaderboard, leagueFor } from '@/data/leaderboard';
import { WEEKDAY_SHORT, dayKey, lastNDays } from '@/lib/date';
import { effectiveStreak, languageProgress, levelFromXp, useProgress, weeklyXp } from '@/store/progress';
import { colors, fonts } from '@/theme';

const AVATARS = ['🧑‍💻', '👩‍💻', '👨‍💻', '🦊', '🐼', '🐙', '🤖', '👾', '🦄', '🐧'];

export default function ProfileScreen() {
  const router = useRouter();
  const p = useProgress();
  const setProfile = useProgress((s) => s.setProfile);
  const [editing, setEditing] = useState(false);

  const level = levelFromXp(p.xp);
  const league = leagueFor(p.xp);
  const streak = effectiveStreak(p);
  const days = lastNDays(7);
  const values = days.map((d) => p.xpByDay[dayKey(d)] ?? 0);
  const labels = days.map((d) => WEEKDAY_SHORT[(d.getDay() + 6) % 7]);
  const accuracy = p.stats.exercisesAnswered ? Math.round((p.stats.exercisesCorrect / p.stats.exercisesAnswered) * 100) : 0;
  const board = useMemo(() => buildLeaderboard({ name: p.username, avatar: p.avatar, weeklyXp: weeklyXp(p.xpByDay) }), [p.username, p.avatar, p.xpByDay]);
  const myRank = board.findIndex((e) => e.isMe) + 1;
  const unlocked = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;

  return (
    <ScreenBackground palette={['rgba(108,99,255,0.40)', 'rgba(255,138,61,0.16)', 'rgba(0,229,255,0.18)']}>
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="Perfil" right={<IconButton icon="settings-outline" onPress={() => router.push('/settings')} />} />

        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {/* Cartão de identidade */}
          <Animated.View entering={FadeInDown.springify()}>
            <GlassView radius={28} style={styles.idCard}>
              <PressableScale onPress={() => setProfile({ avatar: AVATARS[(AVATARS.indexOf(p.avatar) + 1) % AVATARS.length] })} hapticStyle="light" scaleTo={0.9}>
                <View>
                  <Glow color={colors.primary} width={92} height={92} circle blur={18} opacity={0.6} />
                  <ProgressRing size={92} stroke={6} progress={level.progress} glow={false}>
                    <View style={styles.avatar}>
                      <Txt style={{ fontSize: 38 }}>{p.avatar}</Txt>
                    </View>
                  </ProgressRing>
                </View>
              </PressableScale>
              <View style={{ flex: 1, gap: 4 }}>
                <PressableScale onPress={() => setEditing(true)} hapticStyle="tap" style={styles.nameRow}>
                  <Txt variant="title" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {p.username}
                  </Txt>
                  <Ionicons name="pencil" size={14} color={colors.textTertiary} />
                </PressableScale>
                <Txt variant="caption">
                  Nível {level.level} · {p.xp} XP no total
                </Txt>
                <LinearGradient colors={league.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.league}>
                  <Ionicons name={league.icon as never} size={13} color="#0B0B14" />
                  <Txt style={styles.leagueText}>Liga {league.name}</Txt>
                </LinearGradient>
              </View>
            </GlassView>
          </Animated.View>

          {/* Estatísticas */}
          <View style={styles.statsGrid}>
            <Stat i={0} icon="flame" color={colors.flame} value={streak} label="Ofensiva atual" sub={`Recorde: ${p.longestStreak}`} />
            <Stat i={1} icon="flash" color={colors.gold} value={p.xp} label="XP total" sub={`${weeklyXp(p.xpByDay)} nesta semana`} />
            <Stat i={2} icon="checkmark-done" color={colors.success} value={p.stats.lessonsCompleted} label="Lições" sub={`${p.stats.perfectLessons} perfeitas`} />
            <Stat i={3} icon="analytics" color={colors.accent} value={`${accuracy}%`} label="Precisão" sub={`${p.stats.exercisesAnswered} respostas`} />
          </View>

          {/* Gráfico semanal (Skia) */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GlassView radius={24} style={{ padding: 16 }}>
              <View style={styles.chartHead}>
                <View>
                  <Txt variant="label">Últimos 7 dias</Txt>
                  <Txt variant="headline">{values.reduce((a, b) => a + b, 0)} XP</Txt>
                </View>
                <View style={styles.goalTag}>
                  <View style={styles.goalLine} />
                  <Txt variant="micro">meta {p.dailyGoal}</Txt>
                </View>
              </View>
              <WeeklyChart values={values} labels={labels} goal={p.dailyGoal} />
            </GlassView>
          </Animated.View>

          {/* Ranking */}
          <SectionHeader title="Ranking semanal" action="Ver tudo" onAction={() => router.push('/ranking')} style={{ marginTop: 10, marginBottom: 0 }} />
          <PressableScale onPress={() => router.push('/ranking')} scaleTo={0.97}>
            <GlassView radius={22} style={styles.rankCard}>
              <LinearGradient colors={league.colors} style={styles.rankBadge}>
                <Txt style={styles.rankNum}>#{myRank}</Txt>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">Você está em {myRank}º na Liga {league.name}</Txt>
                <Txt variant="caption">{myRank <= 5 ? 'Zona de promoção! Continue assim 🚀' : `Faltam ${Math.max(0, board[4].xp - weeklyXp(p.xpByDay) + 1)} XP para o top 5`}</Txt>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </GlassView>
          </PressableScale>

          {/* Conquistas */}
          <SectionHeader title={`Conquistas · ${unlocked}/${ACHIEVEMENTS.length}`} action="Ver todas" onAction={() => router.push('/achievements')} style={{ marginTop: 10, marginBottom: 0 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {ACHIEVEMENTS.map((a) => {
              const on = !!p.achievements[a.id];
              return (
                <GlassView key={a.id} radius={20} style={[styles.ach, !on && { opacity: 0.45 }]}>
                  <GradientIcon icon={(on ? a.icon : 'lock-closed') as never} colors={on ? a.colors : ['#2A2A3A', '#1A1A26']} size={46} glow={on} />
                  <Txt variant="micro" center numberOfLines={2} color={on ? colors.text : colors.textTertiary}>
                    {a.title}
                  </Txt>
                </GlassView>
              );
            })}
          </ScrollView>

          {/* Progresso por linguagem */}
          <SectionHeader title="Trilhas" style={{ marginTop: 10, marginBottom: 0 }} />
          <GlassView radius={22} style={{ padding: 6 }}>
            {LANGUAGES.map((l, i) => {
              const pr = languageProgress(p.completedLessons, l.id);
              return (
                <PressableScale key={l.id} onPress={() => router.push(`/course/${l.id}`)} scaleTo={0.98} hapticStyle="tap">
                  <View style={[styles.langRow, i > 0 && styles.langBorder]}>
                    <View style={[styles.langDot, { backgroundColor: l.color, shadowColor: l.color }]} />
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>
                      {l.name}
                    </Txt>
                    <Txt style={styles.langCount}>
                      {pr.done}/{pr.total}
                    </Txt>
                    <ProgressRing size={26} stroke={4} progress={pr.ratio} colors={[l.gradient[0], l.gradient[1]]} glow={false} delay={300 + i * 60} />
                  </View>
                </PressableScale>
              );
            })}
          </GlassView>
        </View>
      </ScrollView>

      <PromptSheet
        visible={editing}
        title="Seu nome"
        subtitle="Aparece no ranking e na tela inicial"
        initial={p.username}
        placeholder="Como quer ser chamado?"
        onClose={() => setEditing(false)}
        onSubmit={(v) => {
          setProfile({ username: v });
          setEditing(false);
        }}
      />
    </ScreenBackground>
  );
}

function Stat({ i, icon, color, value, label, sub }: { i: number; icon: keyof typeof Ionicons.glyphMap; color: string; value: number | string; label: string; sub: string }) {
  return (
    <Animated.View entering={FadeInDown.delay(80 + i * 50).springify()} style={styles.statCell}>
      <GlassView radius={22} style={styles.stat}>
        <Ionicons name={icon} size={20} color={color} style={{ textShadowColor: color, textShadowRadius: 10 }} />
        <Txt style={styles.statValue}>{value}</Txt>
        <Txt variant="caption" color={colors.text}>
          {label}
        </Txt>
        <Txt variant="micro">{sub}</Txt>
      </GlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  idCard: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18 },
  avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  league: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, height: 26, borderRadius: 13, marginTop: 4 },
  leagueText: { fontFamily: fonts.bold, fontSize: 12, color: '#0B0B14' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: { width: '48.5%', flexGrow: 1 },
  stat: { padding: 14, gap: 2 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text, letterSpacing: -0.6, marginTop: 6 },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  goalTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalLine: { width: 14, height: 2, backgroundColor: 'rgba(0,255,148,0.6)' },
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  rankBadge: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontFamily: fonts.extrabold, fontSize: 17, color: '#0B0B14' },
  ach: { width: 104, padding: 12, alignItems: 'center', gap: 10 },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, height: 52 },
  langBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.glassBorderSoft },
  langDot: { width: 10, height: 10, borderRadius: 5, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  langCount: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textSecondary },
});

