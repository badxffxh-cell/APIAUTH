import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticStyle?: 'tap' | 'light' | 'medium' | 'none';
}

const SPRING = { damping: 14, stiffness: 320, mass: 0.6 };

/** Pressable com micro-animação de mola (Reanimated) e feedback háptico. */
export function PressableScale({ children, style, scaleTo = 0.96, hapticStyle = 'light', onPressIn, onPressOut, onPress, disabled, ...rest }: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.set(withSpring(scaleTo, SPRING));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, SPRING));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (hapticStyle !== 'none') haptic[hapticStyle]();
        onPress?.(e);
      }}
      style={[style, anim, disabled && { opacity: 0.5 }]}
    >
      {children}
    </AnimatedPressable>
  );
}
