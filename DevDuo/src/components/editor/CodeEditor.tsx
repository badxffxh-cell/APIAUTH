import { forwardRef, memo, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';

import { TokenText } from '@/components/code/CodeBlock';
import { normalizeQuotes } from '@/lib/exercise';
import { tokenizeLines, type Token } from '@/lib/highlighter';
import { colors, fonts, syntax } from '@/theme';
import type { CodeLang } from '@/types';

export interface CodeEditorHandle {
  insert: (text: string, caretBack?: number) => void;
  closeTag: () => void;
  indent: () => void;
  focus: () => void;
  blur: () => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  language: CodeLang;
  fontSize?: number;
  accessoryId?: string;
  bottomInset?: number;
  editable?: boolean;
  autoFocus?: boolean;
  /** Modo compacto (exercícios): sem numeração e sem ScrollView próprio. */
  compact?: boolean;
  placeholder?: string;
  minHeight?: number;
}

const GUTTER = 38;
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function signature(tokens: Token[]) {
  let s = '';
  for (const t of tokens) s += t.type + '\u0001' + t.text + '\u0002';
  return s;
}

const Row = memo(
  function Row({ n, tokens, active, lineHeight, fontSize, gutter }: { n: number; tokens: Token[]; sig: string; active: boolean; lineHeight: number; fontSize: number; gutter: boolean }) {
    return (
      <View style={[styles.row, active && styles.rowActive]}>
        {gutter && <Text style={[styles.lineNo, { lineHeight, fontSize: fontSize - 1.5 }, active && { color: colors.accent }]}>{n}</Text>}
        <Text style={[styles.code, { fontSize, lineHeight }]}>
          <TokenText tokens={tokens} />
        </Text>
      </View>
    );
  },
  (a, b) => a.sig === b.sig && a.active === b.active && a.n === b.n && a.lineHeight === b.lineHeight
);

/** Encontra a última tag HTML aberta e ainda não fechada antes do cursor. */
function lastOpenTag(before: string): string | null {
  const stack: string[] = [];
  const re = /<\/?([a-zA-Z][\w-]*)[^>]*?(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(before))) {
    const name = m[1].toLowerCase();
    if (m[0].startsWith('</')) {
      const i = stack.lastIndexOf(name);
      if (i >= 0) stack.splice(i);
    } else if (!m[2] && !VOID_TAGS.has(name)) stack.push(name);
  }
  return stack.pop() ?? null;
}

/**
 * Editor de código com syntax highlighting: um TextInput transparente sobreposto
 * a uma camada de texto colorido com a mesma fonte/métrica (JetBrains Mono).
 * Inclui numeração de linhas, linha ativa, auto-indentação e inserção de símbolos.
 */
export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor(
  { value, onChange, language, fontSize = 13.5, accessoryId, bottomInset = 160, editable = true, autoFocus, compact, placeholder, minHeight },
  ref
) {
  const inputRef = useRef<TextInputInstance>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const sel = useRef({ start: 0, end: 0 });
  const [activeLine, setActiveLine] = useState(-1);
  const lineHeight = Math.round(fontSize * 1.6);
  const gutter = !compact;

  const lines = useMemo(() => tokenizeLines(value, language), [value, language]);
  const sigs = useMemo(() => lines.map(signature), [lines]);

  const commit = (next: string, caret?: number) => {
    valueRef.current = next;
    onChange(next);
    if (caret !== undefined) {
      sel.current = { start: caret, end: caret };
      requestAnimationFrame(() => inputRef.current?.setSelection(caret, caret));
    }
  };

  const insertAt = (text: string, caretBack = 0) => {
    const v = valueRef.current;
    const { start, end } = sel.current;
    const next = v.slice(0, start) + text + v.slice(end);
    commit(next, start + text.length - caretBack);
  };

  useImperativeHandle(ref, () => ({
    insert: insertAt,
    closeTag: () => {
      const tag = lastOpenTag(valueRef.current.slice(0, sel.current.start));
      if (tag) insertAt(`</${tag}>`);
    },
    indent: () => insertAt('  '),
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  const handleChange = (raw: string) => {
    const prev = valueRef.current;
    let next = normalizeQuotes(raw);
    const { start } = sel.current;
    // Auto-indentação ao pressionar Enter
    if (next.length === prev.length + 1 && next[start] === '\n' && next.slice(0, start) === prev.slice(0, start)) {
      const lineStart = prev.lastIndexOf('\n', start - 1) + 1;
      const current = prev.slice(lineStart, start);
      const indent = /^[ \t]*/.exec(current)?.[0] ?? '';
      const before = prev[start - 1] ?? '';
      const after = prev.slice(start, start + 2);
      const opensTag = before === '>' && /<[a-zA-Z][^>]*>$/.test(current) && !/\/>$/.test(current) && !VOID_TAGS.has((/<([a-zA-Z][\w-]*)[^>]*>$/.exec(current)?.[1] ?? '').toLowerCase()) && !/<\/[^>]*>$/.test(current);
      const extra = /[{[(]/.test(before) || opensTag || (language === 'python' && before === ':') ? '  ' : '';
      let insert = '\n' + indent + extra;
      const caret = start + insert.length;
      const pairs = (before === '{' && after[0] === '}') || (before === '(' && after[0] === ')') || (before === '[' && after[0] === ']') || (opensTag && after === '</');
      if (extra && pairs) insert += '\n' + indent;
      next = prev.slice(0, start) + insert + prev.slice(start);
      commit(next, caret);
      return;
    }
    commit(next);
  };

  const onSelectionChange = (e: { nativeEvent: { selection: { start: number; end: number } } }) => {
    sel.current = e.nativeEvent.selection;
    if (!gutter) return;
    const v = valueRef.current;
    let line = 0;
    const s = Math.min(sel.current.start, v.length);
    for (let i = 0; i < s; i++) if (v.charCodeAt(i) === 10) line++;
    setActiveLine(line);
  };

  const body = (
    <View style={[styles.stack, minHeight ? { minHeight } : null]}>
      <View pointerEvents="none">
        {lines.map((tokens, i) => (
          <Row key={i} n={i + 1} tokens={tokens} sig={sigs[i]} active={i === activeLine} lineHeight={lineHeight} fontSize={fontSize} gutter={gutter} />
        ))}
      </View>
      {!value && placeholder ? (
        <Text pointerEvents="none" style={[styles.placeholder, { left: gutter ? GUTTER : 0, fontSize, lineHeight }]}>
          {placeholder}
        </Text>
      ) : null}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onSelectionChange={onSelectionChange}
        onBlur={() => setActiveLine(-1)}
        multiline
        scrollEnabled={false}
        editable={editable}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        smartInsertDelete={false}
        keyboardAppearance="dark"
        keyboardType="default"
        textContentType="none"
        dataDetectorTypes="none"
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        inputAccessoryViewID={accessoryId}
        textAlignVertical="top"
        underlineColorAndroid="transparent"
        style={[styles.input, { left: gutter ? GUTTER : 0, fontSize, lineHeight }]}
      />
    </View>
  );

  if (compact) return body;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: bottomInset }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
    >
      {body}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  stack: { position: 'relative' },
  row: { flexDirection: 'row', paddingRight: 12 },
  rowActive: { backgroundColor: 'rgba(108,99,255,0.10)' },
  lineNo: { width: GUTTER, paddingRight: 10, textAlign: 'right', fontFamily: fonts.mono, color: 'rgba(255,255,255,0.22)' },
  code: { flex: 1, fontFamily: fonts.mono, color: syntax.plain, padding: 0 },
  input: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 12,
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    fontFamily: fonts.mono,
    color: 'transparent',
    includeFontPadding: false,
  },
  placeholder: { position: 'absolute', top: 0, fontFamily: fonts.mono, color: colors.textTertiary },
});
