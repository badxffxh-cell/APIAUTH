import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientOrbs } from '@/components/skia/AmbientOrbs';
import { colors } from '@/theme';
import { Txt } from './Txt';

/** Fundo padrão das telas: preto azulado + orbes de luz animados (Skia). */
export function ScreenBackground({ children, orbs = true, palette }: { children?: ReactNode; orbs?: boolean; palette?: [string, string, string] }) {
  return (
    <View style={styles.bg}>
      {orbs && <AmbientOrbs palette={palette} />}
      {children}
    </View>
  );
}

/** Cabeçalho grande estilo iOS. */
export function ScreenTitle({
  title,
  subtitle,
  right,
  style,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }, style]}>
      <View style={{ flex: 1 }}>
        {subtitle && <Txt variant="caption">{subtitle}</Txt>}
        <Txt variant="display">{title}</Txt>
      </View>
      {right}
    </View>
  );
}

/** Espaço inferior para o conteúdo não ficar atrás da tab bar flutuante. */
export const TAB_BAR_SPACE = 120;

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
});
