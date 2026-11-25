import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView } from '@/components/glass/GlassView';
import { Glow } from '@/components/skia/Glow';
import { IconButton } from '@/components/ui/Bits';
import { ScreenBackground } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { LEAGUES, buildLeaderboard, leagueFor, type RankEntry } from '@/data/leaderboard';
import { addDays, formatCountdown, startOfWeek } from '@/lib/date';
import { useProgress, weeklyXp } from '@/store/progress';
import { colors, fonts } from '@/theme';

const PODIUM_COLORS: [string, string][] = [
  ['#FFD166', '#FF9F1C'],
  ['#E6ECF5', '#8D99AE'],
  ['#D79B6A', '#8C5A3C'],
];

export default function RankingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { username, avatar, xpByDay, xp } = useProgress();
  const league = leagueFor(xp);
  const board = useMemo(() => buildLeaderboard({ name: username, avatar, weeklyXp: weeklyXp(xpByDay) }), [username, avatar, xpByDay]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const weekEnd = addDays(startOfWeek(new Date(now)), 7).getTime();
  const top3 = board.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as RankEntry[];
  const nextLeague = LEAGUES[LEAGUES.indexOf(league) + 1];

  return (
    <ScreenBackground palette={[`${league.colors[0]}55`, 'rgba(108,99,255,0.32)', 'rgba(0,229,255,0.14)']}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <IconButton icon="chevron-back" onPress={() => router.back()} />
          <Txt variant="headline">Ranking</Txt>
          <View style={{ width: 42 }} />
        </View>

        <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center', marginTop: 18 }}>
          <View>
            <Glow color={league.colors[0]} width={84} height={84} circle blur={24} pulse />
            <LinearGradient colors={league.colors} style={styles.leagueIcon}>
              <Ionicons name={league.icon as never} size={40} color="#0B0B14" />
            </LinearGradient>
          </View>
          <Txt variant="title" style={{ marginTop: 14 }}>
            Liga {league.name}
          </Txt>
          <View style={styles.timer}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Txt variant="caption">Termina em {formatCountdown(weekEnd - now)}</Txt>
          </View>
          {nextLeague && (
            <Txt variant="micro" style={{ marginTop: 6 }}>
              {nextLeague.minXp - xp} XP para a Liga {nextLeague.name}
            </Txt>
          )}
        </Animated.View>

        {/* Pódio */}
        <View style={styles.podium}>
          {order.map((e) => {
            const place = board.indexOf(e);
            const h = place === 0 ? 120 : place === 1 ? 92 : 74;
            return (
              <Animated.View key={e.id} entering={FadeInUp.delay(150 + place * 120).springify().damping(12)} style={styles.podiumCol}>
                <Txt style={{ fontSize: place === 0 ? 40 : 32 }}>{e.avatar}</Txt>
                <Txt variant="micro" color={e.isMe ? colors.accent : colors.text} numberOfLines={1} style={{ maxWidth: 96, marginTop: 4 }}>
                  {e.isMe ? 'Você' : e.name.split(' ')[0]}
                </Txt>
                <Txt style={styles.podiumXp}>{e.xp} XP</Txt>
                <LinearGradient colors={PODIUM_COLORS[place]} style={[styles.podiumBlock, { height: h }]}>
                  <LinearGradient colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 16, borderTopRightRadius: 16 }]} />
                  <Txt style={styles.podiumPlace}>{place + 1}</Txt>
                </LinearGradient>
              </Animated.View>
            );
          })}
        </View>

        <GlassView radius={24} style={{ paddingVertical: 6 }}>
          {board.map((e, i) => (
            <Animated.View key={e.id} entering={FadeInDown.delay(200 + i * 35)}>
              {i === 5 && (
                <View style={styles.zone}>
                  <View style={[styles.zoneLine, { backgroundColor: 'rgba(0,255,148,0.4)' }]} />
                  <Txt variant="micro" color={colors.success}>
                    ZONA DE PROMOÇÃO ↑
                  </Txt>
                  <View style={[styles.zoneLine, { backgroundColor: 'rgba(0,255,148,0.4)' }]} />
                </View>
              )}
              {i === board.length - 3 && (
                <View style={styles.zone}>
                  <View style={[styles.zoneLine, { backgroundColor: 'rgba(255,77,109,0.4)' }]} />
                  <Txt variant="micro" color={colors.danger}>
                    ZONA DE REBAIXAMENTO ↓
                  </Txt>
                  <View style={[styles.zoneLine, { backgroundColor: 'rgba(255,77,109,0.4)' }]} />
                </View>
              )}
              <View style={[styles.row, e.isMe && styles.rowMe]}>
                <Txt style={[styles.place, i < 5 && { color: colors.success }, i >= board.length - 3 && { color: colors.danger }]}>{i + 1}</Txt>
                <View style={styles.avatar}>
                  <Txt style={{ fontSize: 20 }}>{e.avatar}</Txt>
                </View>
                <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1} color={e.isMe ? colors.accent : colors.text}>
                  {e.isMe ? `${e.name} (você)` : e.name}
                </Txt>
                <Txt style={styles.xp}>{e.xp} XP</Txt>
              </View>
            </Animated.View>
          ))}
        </GlassView>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leagueIcon: { width: 84, height: 84, borderRadius: 28, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '0deg' }] },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginTop: 28, marginBottom: 18 },
  podiumCol: { alignItems: 'center', width: 100 },
  podiumXp: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.textSecondary, marginBottom: 8 },
  podiumBlock: { width: 92, borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center', paddingTop: 10 },
  podiumPlace: { fontFamily: fonts.extrabold, fontSize: 28, color: '#0B0B14' },
  zone: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  zoneLine: { flex: 1, height: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, height: 56, marginHorizontal: 6, borderRadius: 16 },
  rowMe: { backgroundColor: 'rgba(0,229,255,0.10)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.35)' },
  place: { width: 22, fontFamily: fonts.bold, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  xp: { fontFamily: fonts.monoBold, fontSize: 13, color: colors.text },
});
