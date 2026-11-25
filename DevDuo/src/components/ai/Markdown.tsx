import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CodeBlock } from '@/components/code/CodeBlock';
import { normalizeLangTag } from '@/lib/highlighter';
import { haptic } from '@/lib/haptics';
import { useAIUI } from '@/store/ui';
import { colors, fonts } from '@/theme';

type Block =
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'bullet'; marker: string; text: string; indent: number }
  | { kind: 'para'; text: string }
  | { kind: 'rule' };

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r/g, '').split('\n');
  let i = 0;
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      blocks.push({ kind: 'para', text: para.join('\n') });
      para = [];
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    const fence = /^\s*```\s*([\w+#.-]*)/.exec(line);
    if (fence) {
      flush();
      const lang = fence[1];
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      i++; // fecha a cerca (ou fim do texto durante streaming)
      blocks.push({ kind: 'code', lang, code: code.join('\n') });
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      blocks.push({ kind: 'heading', level: h[1].length, text: h[2] });
    } else if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      flush();
      const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line)!;
      blocks.push({ kind: 'bullet', indent: Math.min(3, Math.floor(m[1].length / 2)), marker: /\d/.test(m[2]) ? m[2] : '•', text: m[3] });
    } else if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      flush();
      blocks.push({ kind: 'rule' });
    } else if (!line.trim()) {
      flush();
    } else {
      para.push(line);
    }
    i++;
  }
  flush();
  return blocks;
}

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) out.push(<Text key={`${keyBase}-${k++}`} style={styles.bold}>{t.slice(2, -2)}</Text>);
    else if (t.startsWith('`')) out.push(<Text key={`${keyBase}-${k++}`} style={styles.inlineCode}>{` ${t.slice(1, -1)} `}</Text>);
    else out.push(<Text key={`${keyBase}-${k++}`} style={styles.italic}>{t.slice(1, -1)}</Text>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Renderizador de Markdown leve para as respostas da IA (com blocos de código destacados). */
export const Markdown = memo(function Markdown({ text, streaming }: { text: string; streaming?: boolean }) {
  const blocks = parse(text);
  const editorInsert = useAIUI((s) => s.editorInsert);
  return (
    <View style={{ gap: 8 }}>
      {blocks.map((b, i) => {
        const last = i === blocks.length - 1;
        const cursor = streaming && last ? <Text style={{ color: colors.accent }}> ▍</Text> : null;
        switch (b.kind) {
          case 'code':
            return (
              <CodeBlock
                key={i}
                code={b.code}
                lang={normalizeLangTag(b.lang)}
                title={b.lang || 'código'}
                fontSize={12.5}
                onInsert={
                  editorInsert
                    ? () => {
                        haptic.success();
                        editorInsert(b.code);
                      }
                    : undefined
                }
              />
            );
          case 'heading':
            return (
              <Text key={i} style={[styles.heading, b.level <= 2 && { fontSize: 17 }]}>
                {inline(b.text, `h${i}`)}
                {cursor}
              </Text>
            );
          case 'bullet':
            return (
              <View key={i} style={[styles.bulletRow, { paddingLeft: b.indent * 14 }]}>
                <Text style={[styles.bulletMarker, b.marker !== '•' && { fontFamily: fonts.semibold }]}>{b.marker}</Text>
                <Text style={styles.body}>
                  {inline(b.text, `b${i}`)}
                  {cursor}
                </Text>
              </View>
            );
          case 'rule':
            return <View key={i} style={styles.rule} />;
          default:
            return (
              <Text key={i} style={styles.body}>
                {inline(b.text, `p${i}`)}
                {cursor}
              </Text>
            );
        }
      })}
      {streaming && blocks.length === 0 && <Text style={{ color: colors.accent }}>▍</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  body: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
  bold: { fontFamily: fonts.bold, color: '#fff' },
  italic: { fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' },
  inlineCode: { fontFamily: fonts.mono, fontSize: 13.5, color: colors.accent, backgroundColor: 'rgba(0,229,255,0.10)' },
  heading: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: '#fff', marginTop: 4 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletMarker: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: colors.accent, minWidth: 12 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginVertical: 4 },
});
