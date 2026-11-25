import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { GlassView } from '@/components/glass/GlassView';
import { Glow } from '@/components/skia/Glow';
import { ParticleBurst } from '@/components/three/ParticleBurst';
import { GradientIcon } from '@/components/ui/Bits';
import { GradientButton } from '@/components/ui/GradientButton';
import { Txt } from '@/components/ui/Txt';
import { ACHIEVEMENT_MAP } from '@/data/achievements';
import { haptic } from '@/lib/haptics';
import { useCelebration } from '@/store/ui';
import { colors } from '@/theme';

/** Celebração global de conquistas: explosão de partículas 3D + cartão de vidro. */
export function CelebrationOverlay() {
  const current = useCelebration((s) => s.queue[0]);
  const shift = useCelebration((s) => s.shift);
  const achievement = current ? ACHIEVEMENT_MAP.get(current) : undefined;

  useEffect(() => {
    if (achievement) haptic.success();
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Animated.View key={achievement.id} entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={shift}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,5,12,0.72)' }]} />
      </Pressable>
      <ParticleBurst colors={[achievement.colors[0], achievement.colors[1], '#FFFFFF', colors.accent]} burstKey={achievement.id} loopEvery={2.6} originY={0.25} />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View entering={ZoomIn.springify().damping(12).stiffness(140)}>
          <GlassView radius={32} strong style={styles.card}>
            <Txt variant="label" color={colors.gold}>
              Conquista desbloqueada
            </Txt>
            <View style={{ marginVertical: 22 }}>
              <Glow color={achievement.colors[0]} width={96} height={96} circle blur={26} pulse />
              <GradientIcon icon={achievement.icon as never} colors={achievement.colors} size={96} />
            </View>
            <Txt variant="title" center>
              {achievement.title}
            </Txt>
            <Txt variant="caption" center style={{ marginTop: 6 }}>
              {achievement.description}
            </Txt>
            <GradientButton title="Incrível!" onPress={shift} style={{ marginTop: 24, alignSelf: 'stretch' }} colors={[achievement.colors[0], achievement.colors[1]]} />
          </GlassView>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { width: 300, padding: 26, alignItems: 'center' },
});
