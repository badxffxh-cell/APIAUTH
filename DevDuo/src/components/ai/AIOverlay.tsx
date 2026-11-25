import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture, useTapGesture, useExclusiveGestures } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { GlassView } from '@/components/glass/GlassView';
import { IconButton } from '@/components/ui/Bits';
import { Txt } from '@/components/ui/Txt';
import { haptic } from '@/lib/haptics';
import { contextLabel, useChat } from '@/store/chat';
import { useSettings } from '@/store/settings';
import { useAIUI } from '@/store/ui';
import { colors, gradients } from '@/theme';
import { ChatView } from './ChatView';

const FAB = 58;
const SPRING = { damping: 17, stiffness: 190, mass: 0.8 };

/**
 * Assistente IA acessível em qualquer tela: botão flutuante arrastável
 * (gruda nas bordas) que abre um painel de chat de vidro.
 */
export function AIOverlay() {
  const pathname = usePathname();
  const open = useAIUI((s) => s.open);
  const setOpen = useAIUI((s) => s.setOpen);
  const hideFab = pathname === '/assistant' || pathname.startsWith('/lesson');
  return (
    <>
      {!hideFab && !open && <FloatingButton onPress={() => setOpen(true)} />}
      <ChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function FloatingButton({ onPress }: { onPress: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const margin = 14;
  const minY = insets.top + 70;
  const maxY = height - insets.bottom - 110 - FAB;
  const x = useSharedValue(width - FAB - margin);
  // Começa logo acima da tab bar, no canto direito (arrastável).
  const y = useSharedValue(height - Math.max(insets.bottom, 12) - 68 - FAB - 18);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const pressed = useSharedValue(1);
  const pulse = useSharedValue(0);
  const hasContext = useAIUI((s) => !!s.context);

  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false));
  }, [pulse]);

  const pan = usePanGesture({
    minDistance: 6,
    onActivate: () => {
      'worklet';
      startX.set(x.value);
      startY.set(y.value);
      pressed.set(withSpring(1.08, SPRING));
    },
    onUpdate: (e) => {
      'worklet';
      x.set(startX.value + e.translationX);
      y.set(startY.value + e.translationY);
    },
    onDeactivate: (e) => {
      'worklet';
      pressed.set(withSpring(1, SPRING));
      const goRight = x.value + FAB / 2 + e.velocityX * 0.08 > width / 2;
      x.set(withSpring(goRight ? width - FAB - margin : margin, { ...SPRING, velocity: e.velocityX }));
      y.set(withSpring(Math.min(maxY, Math.max(minY, y.value + e.velocityY * 0.05)), SPRING));
    },
  });

  const tap = useTapGesture({
    onBegin: () => {
      'worklet';
      pressed.set(withSpring(0.9, SPRING));
    },
    onFinalize: () => {
      'worklet';
      pressed.set(withSpring(1, SPRING));
    },
    onActivate: () => {
      'worklet';
      scheduleOnRN(haptic.medium);
      scheduleOnRN(onPress);
    },
  });

  const gesture = useExclusiveGestures(pan, tap);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }, { scale: pressed.value }] }));
  const ring = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 0.55 }] }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.fab, style]}>
        <Animated.View pointerEvents="none" style={[styles.ring, ring]} />
        <LinearGradient colors={['#7B6CFF', '#00C8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
          <LinearGradient colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={[StyleSheet.absoluteFill, { borderRadius: FAB / 2 }]} />
          <Ionicons name="sparkles" size={26} color="#fff" />
          {hasContext && <View style={styles.ctxDot} />}
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const ty = useSharedValue(height);
  const fade = useSharedValue(0);
  const clear = useChat((s) => s.clear);
  const model = useSettings((s) => s.model);
  const context = useAIUI((s) => s.context);

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      ty.set(withSpring(0, { damping: 22, stiffness: 200, mass: 0.9 }));
      fade.set(withTiming(1, { duration: 220 }));
    } else {
      fade.set(withTiming(0, { duration: 200 }));
      ty.set(
        withTiming(height, { duration: 260, easing: Easing.in(Easing.cubic) }, (done) => {
          if (done) scheduleOnRN(setMounted, false);
        })
      );
    }
  }, [open, height, ty, fade]);

  const pan = usePanGesture({
    activeOffsetY: 8,
    onUpdate: (e) => {
      'worklet';
      ty.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > 140 || e.velocityY > 900) scheduleOnRN(onClose);
      else ty.set(withSpring(0, SPRING));
    },
  });

  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));

  if (!mounted) return null;
  const label = contextLabel(context);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(4,4,10,0.4)' }]} />
        </Pressable>
      </Animated.View>
      <Animated.View style={[styles.panelWrap, { top: insets.top + 24 }, panel]}>
        <GlassView radius={30} strong intensity={80} style={{ flex: 1, overflow: 'hidden' }}>
          <GestureDetector gesture={pan}>
            <View style={styles.header}>
              <View style={styles.handle} />
              <View style={styles.headerRow}>
                <LinearGradient colors={gradients.primary} style={styles.headerIcon}>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Txt variant="headline">Assistente IA</Txt>
                  <Txt variant="micro" numberOfLines={1}>
                    {model}
                    {label ? ` · vendo ${label}` : ''}
                  </Txt>
                </View>
                <IconButton icon="trash-outline" size={36} color={colors.textSecondary} onPress={clear} />
                <IconButton icon="close" size={36} onPress={onClose} />
              </View>
            </View>
          </GestureDetector>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 24}>
            <ChatView bottomPadding={Math.max(insets.bottom, 12)} compactHeader />
          </KeyboardAvoidingView>
        </GlassView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', left: 0, top: 0, width: FAB, height: FAB, borderRadius: FAB / 2, shadowColor: '#6C63FF', shadowOpacity: 0.7, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  ring: { position: 'absolute', width: FAB, height: FAB, borderRadius: FAB / 2, borderWidth: 2, borderColor: colors.accent },
  fabInner: { width: FAB, height: FAB, borderRadius: FAB / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  ctxDot: { position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, borderWidth: 2, borderColor: '#5A7BFF' },
  panelWrap: { position: 'absolute', left: 8, right: 8, bottom: 8 },
  header: { paddingTop: 8, paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorderSoft },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
