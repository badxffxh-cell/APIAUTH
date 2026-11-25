import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView } from '@/components/glass/GlassView';
import { Glow } from '@/components/skia/Glow';
import { ParticleBurst } from '@/components/three/ParticleBurst';
import { GradientIcon } from '@/components/ui/Bits';
import { GradientButton } from '@/components/ui/GradientButton';
import { Txt } from '@/components/ui/Txt';
import { ACHIEVEMENT_MAP } from '@/data/achievements';
import type { LessonResult } from '@/store/progress';
import { colors, fonts } from '@/theme';

function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const id = setTimeout(() => (raf = requestAnimationFrame(tick)), 350);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [target, ms]);
  return v;
}

interface Props {
  result: LessonResult;
  durationMs: number;
  hasNext: boolean;
  onContinue: () => void;
  onNext: () => void;
}

export function LessonComplete({ result, durationMs, hasNext, onContinue, onNext }: Props) {
  const insets = useSafeAreaInsets();
  const xp = useCountUp(result.xpEarned);
  const perfect = result.accuracy >= 0.999;
  const mins = Math.floor(durationMs / 60000);
  const secs = Math.round((durationMs % 60000) / 1000);

  return (
    <View style={StyleSheet.absoluteFill}>
      <ParticleBurst loopEvery={4} originY={0.62} />
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        <View style={{ alignItems: 'center' }}>
          <Animated.View entering={ZoomIn.springify().damping(10).stiffness(120)}>
            <Glow color={perfect ? colors.success : colors.gold} width={120} height={120} circle blur={30} pulse />
            <GradientIcon icon={perfect ? 'diamond' : 'trophy'} colors={perfect ? ['#00FF94', '#00E5FF'] : ['#FFD166', '#FF8A3D']} size={120} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Txt variant="display" center style={{ marginTop: 26 }}>
              {perfect ? 'Perfeito!' : 'Lição concluída!'}
            </Txt>
            <Txt variant="caption" center style={{ marginTop: 6 }}>
              {perfect ? 'Nenhum erro. Você é uma máquina. 🤖' : 'Cada erro é um bug a menos no futuro.'}
            </Txt>
          </Animated.View>
        </View>

        <View style={styles.stats}>
          <Stat delay={350} icon="flash" color={colors.gold} label="XP ganho" value={`+${xp}`} />
          <Stat delay={430} icon="analytics" color={colors.accent} label="Precisão" value={`${Math.round(result.accuracy * 100)}%`} />
          <Stat delay={510} icon="time" color={colors.primaryLight} label="Tempo" value={mins ? `${mins}m${secs}s` : `${secs}s`} />
        </View>

        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <GlassView radius={22} style={styles.streak}>
            <Ionicons name="flame" size={30} color={colors.flame} style={{ textShadowColor: colors.flame, textShadowRadius: 14 }} />
            <View style={{ flex: 1 }}>
              <Txt variant="headline">
                {result.streak} {result.streak === 1 ? 'dia' : 'dias'} de ofensiva
              </Txt>
              <Txt variant="caption">{result.streakIncreased ? 'Ofensiva aumentada hoje! 🔥' : 'Você já praticou hoje. Continue assim!'}</Txt>
            </View>
            <View style={styles.gems}>
              <Ionicons name="diamond" size={14} color={colors.gem} />
              <Txt style={styles.gemText}>+{result.gemsEarned}</Txt>
            </View>
          </GlassView>
        </Animated.View>

        {result.newAchievements.length > 0 && (
          <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.achRow}>
            {result.newAchievements.map((id) => {
              const a = ACHIEVEMENT_MAP.get(id);
              return a ? (
                <View key={id} style={styles.ach}>
                  <GradientIcon icon={a.icon as never} colors={a.colors} size={28} glow={false} />
                  <Txt variant="micro" color={colors.text}>
                    {a.title}
                  </Txt>
                </View>
              ) : null;
            })}
          </Animated.View>
        )}

        <View style={{ flex: 1 }} />
        <Animated.View entering={FadeInDown.delay(800).springify()} style={{ gap: 10 }}>
          {hasNext && <GradientButton title="Próxima lição" iconRight="arrow-forward" onPress={onNext} />}
          <GradientButton title={hasNext ? 'Voltar para a trilha' : 'Continuar'} variant={hasNext ? 'glass' : 'primary'} onPress={onContinue} />
        </Animated.View>
      </View>
    </View>
  );
}

function Stat({ icon, color, label, value, delay }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ flex: 1 }}>
      <GlassView radius={20} style={styles.stat} borderColor={`${color}66`}>
        <Ionicons name={icon} size={20} color={color} />
        <Txt style={[styles.statValue, { color }]}>{value}</Txt>
        <Txt variant="micro">{label}</Txt>
      </GlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, gap: 22 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, letterSpacing: -0.5 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  gems: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: colors.accentSoft },
  gemText: { fontFamily: fonts.bold, fontSize: 13, color: colors.gem },
  achRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  ach: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12, paddingLeft: 4, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.glassBorderSoft },
});
