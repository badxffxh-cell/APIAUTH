import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { memo, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { tokenizeLines, type Token } from '@/lib/highlighter';
import { haptic } from '@/lib/haptics';
import { colors, fonts, syntax } from '@/theme';
import type { CodeLang } from '@/types';

export const TokenText = memo(function TokenText({ tokens }: { tokens: Token[] }) {
  if (!tokens.length) return <Text> </Text>;
  return (
    <>
      {tokens.map((t, i) => (
        <Text key={i} style={{ color: syntax[t.type] }}>
          {t.text}
        </Text>
      ))}
    </>
  );
});

interface Props {
  code: string;
  lang: CodeLang;
  title?: string;
  style?: StyleProp<ViewStyle>;
  lineNumbers?: boolean;
  copy?: boolean;
  fontSize?: number;
  /** Ação extra (ex.: "Inserir no editor"). */
  onInsert?: () => void;
}

/** Janela de código estilo macOS com highlighting, rolagem horizontal e botão copiar. */
export function CodeBlock({ code, lang, title, style, lineNumbers = true, copy = true, fontSize = 13, onInsert }: Props) {
  const lines = useMemo(() => tokenizeLines(code.replace(/\n$/, ''), lang), [code, lang]);
  const [copied, setCopied] = useState(false);
  const lh = Math.round(fontSize * 1.55);

  const doCopy = async () => {
    await Clipboard.setStringAsync(code);
    haptic.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.bar}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: '#FF5F57' }]} />
          <View style={[styles.dot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[styles.dot, { backgroundColor: '#28C840' }]} />
        </View>
        <Txt variant="micro" style={styles.title} numberOfLines={1}>
          {title ?? lang}
        </Txt>
        <View style={styles.actions}>
          {onInsert && (
            <PressableScale onPress={onInsert} hitSlop={8} hapticStyle="light">
              <Ionicons name="enter-outline" size={16} color={colors.accent} />
            </PressableScale>
          )}
          {copy && (
            <PressableScale onPress={doCopy} hitSlop={8} hapticStyle="none">
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={copied ? colors.success : colors.textSecondary} />
            </PressableScale>
          )}
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {lineNumbers && (
          <View style={styles.gutter}>
            {lines.map((_, i) => (
              <Text key={i} style={[styles.lineNo, { fontSize: fontSize - 1, lineHeight: lh }]}>
                {i + 1}
              </Text>
            ))}
          </View>
        )}
        <View>
          {lines.map((tokens, i) => (
            <Text key={i} style={[styles.code, { fontSize, lineHeight: lh }]}>
              <TokenText tokens={tokens} />
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    backgroundColor: 'rgba(5,5,12,0.78)',
    borderWidth: 1,
    borderColor: colors.glassBorderSoft,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorderSoft,
  },
  dots: { flexDirection: 'row', gap: 6, width: 52 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.monoMedium, color: colors.textTertiary },
  actions: { width: 52, flexDirection: 'row', justifyContent: 'flex-end', gap: 14 },
  scroll: { paddingVertical: 12, paddingRight: 16, flexDirection: 'row' },
  gutter: { paddingLeft: 12, paddingRight: 10, alignItems: 'flex-end' },
  lineNo: { fontFamily: fonts.mono, color: 'rgba(255,255,255,0.22)' },
  code: { fontFamily: fonts.mono, color: syntax.plain, paddingLeft: 4 },
});
