import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

type Variant = 'display' | 'title' | 'headline' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'mono' | 'micro';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  dim?: boolean;
  center?: boolean;
}

export function Txt({ variant = 'body', color, dim, center, style, ...rest }: Props) {
  return (
    <Text
      allowFontScaling={false}
      {...rest}
      style={[styles[variant], dim && { color: colors.textSecondary }, color ? { color } : null, center && styles.center, style]}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, color: colors.text, letterSpacing: -0.8 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.text, letterSpacing: -0.5 },
  headline: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.text, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.text },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  label: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, color: colors.textSecondary, letterSpacing: 1.1, textTransform: 'uppercase' },
  micro: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 19, color: colors.text },
  center: { textAlign: 'center' },
});
