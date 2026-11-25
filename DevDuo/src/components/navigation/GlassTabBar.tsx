import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { GlassView } from '@/components/glass/GlassView';
import { Txt } from '@/components/ui/Txt';
import { haptic } from '@/lib/haptics';
import { colors, fonts } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { on: IconName; off: IconName; label: string }> = {
  index: { on: 'school', off: 'school-outline', label: 'Aprender' },
  editor: { on: 'code-slash', off: 'code-slash-outline', label: 'Editor' },
  assistant: { on: 'sparkles', off: 'sparkles-outline', label: 'Assistente' },
  profile: { on: 'person-circle', off: 'person-circle-outline', label: 'Perfil' },
};

const SPRING = { damping: 18, stiffness: 220, mass: 0.7 };

/** Tab bar flutuante de vidro com indicador em gradiente que desliza com mola. */
export function GlassTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const [hidden, setHidden] = useState(false);
  const count = state.routes.length;
  const itemW = width / Math.max(1, count);
  const x = useSharedValue(0);

  useEffect(() => {
    if (itemW > 0) x.value = withSpring(state.index * itemW, SPRING);
  }, [state.index, itemW, x]);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setHidden(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setHidden(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  if (hidden) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <GlassView radius={30} strong style={styles.bar} intensity={60}>
        <View style={styles.row} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 && (
            <Animated.View style={[styles.indicatorWrap, { width: itemW }, indicator]}>
              <LinearGradient colors={['rgba(108,99,255,0.55)', 'rgba(0,229,255,0.35)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.indicator}>
                <View style={styles.indicatorBorder} />
              </LinearGradient>
            </Animated.View>
          )}
          {state.routes.map((route, index) => {
            const focused = index === state.index;
            const meta = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline', label: route.name };
            const options = descriptors[route.key]?.options;
            const onPress = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                haptic.tap();
                navigateToTab(route.key);
              }
            };
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={options?.tabBarAccessibilityLabel ?? meta.label}
                style={styles.item}
              >
                <TabIcon name={focused ? meta.on : meta.off} focused={focused} />
                <Txt style={[styles.label, { color: focused ? colors.text : colors.textTertiary }]}>{meta.label}</Txt>
              </Pressable>
            );
          })}
        </View>
      </GlassView>
    </View>
  );
}

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const s = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    s.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + s.value * 0.12 }, { translateY: -s.value * 1.5 }] }));
  return (
    <Animated.View style={style}>
      <Ionicons
        name={name}
        size={23}
        color={focused ? '#fff' : colors.textTertiary}
        style={focused ? { textShadowColor: colors.accent, textShadowRadius: 10 } : undefined}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: { height: 68, paddingHorizontal: 6, justifyContent: 'center' },
  row: { flexDirection: 'row', height: 56 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontFamily: fonts.semibold, fontSize: 10.5, letterSpacing: 0.2 },
  indicatorWrap: { position: 'absolute', top: 0, bottom: 0, left: 0, padding: 2 },
  indicator: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  indicatorBorder: { ...StyleSheet.absoluteFill, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
});
