import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { InputAccessoryView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { haptic } from '@/lib/haptics';
import { colors, fonts } from '@/theme';
import type { CodeLang } from '@/types';

interface Props {
  nativeID: string;
  language: CodeLang;
  onInsert: (text: string, caretBack?: number) => void;
  onCloseTag: () => void;
  onDismiss: () => void;
}

type Key = { label: string; text?: string; back?: number; action?: 'tab' | 'close' };

const COMMON: Key[] = [
  { label: '⇥', action: 'tab' },
  { label: '{ }', text: '{}', back: 1 },
  { label: '( )', text: '()', back: 1 },
  { label: '[ ]', text: '[]', back: 1 },
  { label: '" "', text: '""', back: 1 },
  { label: "' '", text: "''", back: 1 },
  { label: ';', text: ';' },
  { label: ':', text: ':' },
  { label: '=', text: '=' },
  { label: '.', text: '.' },
  { label: '#', text: '#' },
  { label: '/', text: '/' },
  { label: '-', text: '-' },
  { label: '_', text: '_' },
  { label: '!', text: '!' },
  { label: '&', text: '&' },
  { label: '|', text: '|' },
  { label: '`', text: '``', back: 1 },
];

const HTML_KEYS: Key[] = [
  { label: '<', text: '<' },
  { label: '>', text: '>' },
  { label: '</>', action: 'close' },
];

const JS_KEYS: Key[] = [
  { label: '=>', text: ' => ' },
  { label: '${}', text: '${}', back: 1 },
  { label: '<', text: '<' },
  { label: '>', text: '>' },
];

/** Barra de símbolos acima do teclado — essencial para programar no celular. */
export function KeyboardBar({ nativeID, language, onInsert, onCloseTag, onDismiss }: Props) {
  const extra = language === 'html' ? HTML_KEYS : language === 'javascript' || language === 'typescript' ? JS_KEYS : [{ label: '<', text: '<' }, { label: '>', text: '>' }];
  const keys = [...extra, ...COMMON];

  const content = (
    <View style={styles.bar}>
      <BlurView intensity={50} tint={Platform.OS === 'ios' ? 'systemChromeMaterialDark' : 'dark'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.veil]} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.scroll}>
        {keys.map((k) => (
          <Pressable
            key={k.label}
            onPress={() => {
              haptic.tap();
              if (k.action === 'tab') onInsert('  ');
              else if (k.action === 'close') onCloseTag();
              else onInsert(k.text ?? k.label, k.back);
            }}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed, k.action === 'close' && styles.keyAccent]}
          >
            <Txt style={[styles.keyText, k.action === 'close' && { color: colors.accent }]}>{k.label}</Txt>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable onPress={onDismiss} style={styles.dismiss} hitSlop={8}>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );

  if (Platform.OS === 'ios') return <InputAccessoryView nativeID={nativeID}>{content}</InputAccessoryView>;
  return content;
}

const styles = StyleSheet.create({
  bar: { height: 48, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.glassBorder, overflow: 'hidden' },
  veil: { backgroundColor: 'rgba(14,14,27,0.55)' },
  scroll: { paddingHorizontal: 8, gap: 6, alignItems: 'center' },
  key: { minWidth: 38, height: 34, paddingHorizontal: 10, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  keyPressed: { backgroundColor: 'rgba(108,99,255,0.45)' },
  keyAccent: { borderColor: 'rgba(0,229,255,0.5)' },
  keyText: { fontFamily: fonts.monoMedium, fontSize: 15, color: colors.text },
  dismiss: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center', borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.glassBorderSoft },
});
