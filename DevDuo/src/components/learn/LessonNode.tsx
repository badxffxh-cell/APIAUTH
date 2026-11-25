import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Glow } from '@/components/skia/Glow';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, fonts, gradients } from '@/theme';

export type NodeState = 'done' | 'current' | 'locked';

interface Props {
  icon: string;
  state: NodeState;
  title: string;
  color: string;
  size?: number;
  onPress: () => void;
}

export function LessonNode({ icon, state, title, color, size = 78, onPress }: Props) {
  const bob = useSharedValue(0);
  useEffect(() => {
    if (state === 'current') {
      bob.value = withRepeat(withSequence(withTiming(-6, { duration: 700, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) })), -1);
    }
  }, [state, bob]);
  const bubble = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  const grad: readonly [string, string] = state === 'done' ? gradients.success : state === 'current' ? [color, colors.primary] : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)'];
  const iconColor = state === 'locked' ? colors.textTertiary : state === 'done' ? colors.textInverse : '#fff';

  return (
    <View style={{ alignItems: 'center', width: 150 }}>
      {state === 'current' && (
        <Animated.View style={[styles.bubble, bubble]}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bubbleInner}>
            <Txt style={styles.bubbleText}>COMEÇAR</Txt>
          </LinearGradient>
          <View style={styles.bubbleTip} />
        </Animated.View>
      )}
      <PressableScale onPress={onPress} scaleTo={0.9} hapticStyle={state === 'locked' ? 'none' : 'medium'}>
        <View style={{ width: size, height: size }}>
          {state !== 'locked' && <Glow color={state === 'done' ? colors.success : color} width={size} height={size} circle blur={16} opacity={state === 'current' ? 0.85 : 0.4} pulse={state === 'current'} />}
          {/* Base "3D" do botão */}
          <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: state === 'locked' ? 'rgba(255,255,255,0.05)' : state === 'done' ? '#00A866' : '#3B32B8' }]} />
          <LinearGradient colors={grad} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[styles.face, { width: size, height: size - 6, borderRadius: size / 2 }]}>
            <LinearGradient colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]} />
            <Ionicons name={(state === 'locked' ? 'lock-closed' : state === 'done' ? 'checkmark-sharp' : icon) as never} size={size * 0.4} color={iconColor} />
          </LinearGradient>
          {state === 'locked' && <View pointerEvents="none" style={[styles.lockedBorder, { borderRadius: size / 2, width: size, height: size - 6 }]} />}
        </View>
      </PressableScale>
      <Txt variant="micro" center numberOfLines={2} style={[styles.title, state === 'locked' && { color: colors.textTertiary }, state === 'current' && { color: colors.text }]}>
        {title}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute', top: 6, left: 0 },
  face: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lockedBorder: { position: 'absolute', top: 0, left: 0, borderWidth: 1, borderColor: colors.glassBorderSoft },
  title: { marginTop: 8, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 15 },
  bubble: { position: 'absolute', top: -40, zIndex: 2, alignItems: 'center' },
  bubbleInner: { paddingHorizontal: 12, height: 28, borderRadius: 10, justifyContent: 'center' },
  bubbleText: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1.2, color: '#fff' },
  bubbleTip: { width: 10, height: 10, backgroundColor: '#3AA8FF', transform: [{ rotate: '45deg' }], marginTop: -6 },
});
