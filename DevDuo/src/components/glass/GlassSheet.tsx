import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { GradientButton } from '@/components/ui/GradientButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, fonts, radius } from '@/theme';
import { GlassView } from './GlassView';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

const SPRING = { damping: 22, stiffness: 240, mass: 0.8 };

/** Bottom sheet de vidro com arraste para fechar (Gesture Handler + Reanimated). */
export function GlassSheet({ visible, onClose, title, subtitle, children }: SheetProps) {
  const [mounted, setMounted] = useState(visible);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ty = useSharedValue(height);
  const backdrop = useSharedValue(0);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      ty.set(height);
      ty.set(withSpring(0, SPRING));
      backdrop.set(withTiming(1, { duration: 220 }));
    } else {
      backdrop.set(withTiming(0, { duration: 200 }));
      ty.set(
        withTiming(height, { duration: 240, easing: Easing.in(Easing.cubic) }, (done) => {
          if (done) scheduleOnRN(setMounted, false);
        })
      );
    }
  }, [visible, height, ty, backdrop]);

  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      ty.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > 110 || e.velocityY > 900) scheduleOnRN(onClose);
      else ty.set(withSpring(0, SPRING));
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(4,4,10,0.45)' }]} />
          </Pressable>
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav} pointerEvents="box-none">
          <Animated.View style={[styles.sheetWrap, sheetStyle]}>
            <GlassView radius={radius.xl} strong intensity={70} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
              <GestureDetector gesture={pan}>
                <View style={styles.handleArea}>
                  <View style={styles.handle} />
                  {(title || subtitle) && (
                    <View style={styles.header}>
                      {title && <Txt variant="headline">{title}</Txt>}
                      {subtitle && <Txt variant="caption">{subtitle}</Txt>}
                    </View>
                  )}
                </View>
              </GestureDetector>
              {children}
            </GlassView>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

/* ---------- Lista de ações ---------- */

export interface SheetAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

export function ActionList({ actions }: { actions: SheetAction[] }) {
  return (
    <View style={{ gap: 8 }}>
      {actions.map((a) => (
        <PressableScale key={a.label} onPress={a.onPress} scaleTo={0.97} hapticStyle="tap">
          <GlassView radius={radius.md} shadow={false} style={styles.action} borderColor={colors.glassBorderSoft}>
            <Ionicons name={a.icon} size={20} color={a.destructive ? colors.danger : colors.accent} />
            <Txt variant="bodyStrong" color={a.destructive ? colors.danger : colors.text}>
              {a.label}
            </Txt>
          </GlassView>
        </PressableScale>
      ))}
    </View>
  );
}

/* ---------- Prompt (entrada de texto) ---------- */

export function PromptSheet({
  visible,
  title,
  subtitle,
  initial = '',
  placeholder,
  confirmLabel = 'Salvar',
  onSubmit,
  onClose,
  mono,
  error,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  initial?: string;
  placeholder?: string;
  confirmLabel?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
  mono?: boolean;
  error?: string | null;
}) {
  const [value, setValue] = useState(initial);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initial);
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={title} subtitle={subtitle}>
      <GlassView radius={radius.md} shadow={false} style={styles.inputWrap} borderColor={error ? colors.danger : colors.glassBorder}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          keyboardAppearance="dark"
          onSubmitEditing={() => onSubmit(value)}
          returnKeyType="done"
          selectionColor={colors.accent}
          style={[styles.input, mono && { fontFamily: fonts.mono }]}
        />
      </GlassView>
      {error ? (
        <Txt variant="caption" color={colors.danger} style={{ marginTop: 8 }}>
          {error}
        </Txt>
      ) : null}
      <GradientButton title={confirmLabel} onPress={() => onSubmit(value)} style={{ marginTop: 16 }} />
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheetWrap: { paddingHorizontal: 8, paddingBottom: 8 },
  sheet: { paddingHorizontal: 18, paddingTop: 6 },
  handleArea: { paddingTop: 6, paddingBottom: 14 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  header: { marginTop: 14, gap: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 52 },
  inputWrap: { paddingHorizontal: 14, height: 52, justifyContent: 'center' },
  input: { position: 'relative', color: colors.text, fontFamily: fonts.medium, fontSize: 16 },
});
