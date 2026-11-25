import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { GlassView } from '@/components/glass/GlassView';
import { haptic } from '@/lib/haptics';
import { colors, fonts } from '@/theme';
import { Txt } from './Txt';

interface Item<T extends string> {
  key: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

/** Controle segmentado de vidro com indicador animado (mola). */
export function Segmented<T extends string>({ items, value, onChange }: { items: Item<T>[]; value: T; onChange: (v: T) => void }) {
  const [w, setW] = useState(0);
  const idx = Math.max(0, items.findIndex((i) => i.key === value));
  const itemW = w / items.length;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(idx * itemW, { damping: 18, stiffness: 220 });
  }, [idx, itemW, x]);
  const ind = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GlassView radius={14} shadow={false} style={styles.wrap}>
      <View style={styles.row} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && (
          <Animated.View style={[styles.indicator, { width: itemW }, ind]}>
            <LinearGradient colors={['rgba(108,99,255,0.7)', 'rgba(0,229,255,0.45)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.indicatorFill} />
          </Animated.View>
        )}
        {items.map((it) => {
          const active = it.key === value;
          return (
            <Pressable
              key={it.key}
              style={styles.item}
              onPress={() => {
                if (!active) haptic.tap();
                onChange(it.key);
              }}
            >
              {it.icon && <Ionicons name={it.icon} size={14} color={active ? '#fff' : colors.textSecondary} />}
              <Txt style={[styles.label, { color: active ? '#fff' : colors.textSecondary }]}>{it.label}</Txt>
              {!!it.badge && (
                <View style={styles.badge}>
                  <Txt style={styles.badgeText}>{it.badge > 99 ? '99+' : it.badge}</Txt>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 3 },
  row: { flexDirection: 'row', height: 34 },
  indicator: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  indicatorFill: { flex: 1, borderRadius: 11 },
  item: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
  badge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, color: '#fff' },
});
