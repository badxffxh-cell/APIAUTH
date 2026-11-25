import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView } from '@/components/glass/GlassView';
import { XPBar } from '@/components/skia/XPBar';
import { GradientIcon, IconButton } from '@/components/ui/Bits';
import { ScreenBackground } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { ACHIEVEMENTS } from '@/data/achievements';
import { useProgress } from '@/store/progress';
import { colors } from '@/theme';

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const unlockedMap = useProgress((s) => s.achievements);
  const unlocked = ACHIEVEMENTS.filter((a) => unlockedMap[a.id]).length;
  const cell = (width - 40 - 12) / 2;

  return (
    <ScreenBackground palette={['rgba(255,209,102,0.22)', 'rgba(108,99,255,0.34)', 'rgba(0,229,255,0.14)']}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120, paddingHorizontal: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <IconButton icon="chevron-back" onPress={() => router.back()} />
          <Txt variant="headline">Conquistas</Txt>
          <View style={{ width: 42 }} />
        </View>
        <GlassView radius={22} style={{ padding: 16, gap: 10 }}>
          <Txt variant="title">
            {unlocked} de {ACHIEVEMENTS.length}
          </Txt>
          <XPBar progress={unlocked / ACHIEVEMENTS.length} colors={['#FFD166', '#FF8A3D']} />
          <Txt variant="caption">Complete lições, crie projetos e converse com a IA para desbloquear todas.</Txt>
        </GlassView>
        <View style={styles.grid}>
          {ACHIEVEMENTS.map((a, i) => {
            const at = unlockedMap[a.id];
            return (
              <Animated.View key={a.id} entering={FadeInDown.delay(i * 45).springify()}>
                <GlassView radius={24} style={[styles.cell, { width: cell }, !at && { opacity: 0.5 }]} borderColor={at ? `${a.colors[0]}88` : colors.glassBorderSoft}>
                  <GradientIcon icon={(at ? a.icon : 'lock-closed') as never} colors={at ? a.colors : ['#2A2A3A', '#1A1A26']} size={58} glow={!!at} />
                  <Txt variant="bodyStrong" center>
                    {a.title}
                  </Txt>
                  <Txt variant="micro" center>
                    {a.description}
                  </Txt>
                  {at && (
                    <Txt variant="micro" color={colors.success}>
                      ✓ {new Date(at).toLocaleDateString('pt-BR')}
                    </Txt>
                  )}
                </GlassView>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { padding: 16, alignItems: 'center', gap: 8, minHeight: 190 },
});
