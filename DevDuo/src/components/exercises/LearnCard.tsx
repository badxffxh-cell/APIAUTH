import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';

import { CodeBlock } from '@/components/code/CodeBlock';
import { GlassView } from '@/components/glass/GlassView';
import { GradientIcon } from '@/components/ui/Bits';
import { Txt } from '@/components/ui/Txt';
import { colors, radius } from '@/theme';
import type { LearnExercise } from '@/types';

const previewDoc = (code: string, lang: string) =>
  lang === 'css'
    ? null
    : `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{margin:0;padding:14px;background:#0c0c18;color:#fff;font-family:-apple-system,system-ui;font-size:15px}
a{color:#00E5FF}h1{font-size:24px;margin:.2em 0}h2{font-size:20px;margin:.2em 0}p{color:rgba(255,255,255,.75)}
table{border-collapse:collapse}td,th{border:1px solid rgba(255,255,255,.2);padding:6px 10px}
input{padding:8px;border-radius:8px;border:1px solid #444;background:#15152a;color:#fff}
button{padding:8px 14px;border-radius:10px;border:0;background:#6C63FF;color:#fff}
img{max-width:60px;background:#222;min-height:40px}
</style></head><body>${code}</body></html>`;

/** Cartão de conceito: apresenta o assunto antes dos exercícios. */
export function LearnCard({ exercise }: { exercise: LearnExercise }) {
  const showPreview = exercise.code && exercise.codeLang === 'html';
  return (
    <View style={{ gap: 16 }}>
      <Animated.View entering={FadeInDown.springify()} style={styles.head}>
        <GradientIcon icon="bulb" colors={['#FFD166', '#FF8A3D']} size={40} />
        <Txt variant="label" color={colors.gold}>
          Novo conceito
        </Txt>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <Txt variant="title">{exercise.title}</Txt>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <GlassView radius={radius.lg} style={{ padding: 16 }}>
          <Txt variant="body" style={{ lineHeight: 23 }}>
            {exercise.prompt}
          </Txt>
        </GlassView>
      </Animated.View>
      {exercise.code && (
        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <CodeBlock code={exercise.code} lang={exercise.codeLang ?? 'html'} title="exemplo" />
        </Animated.View>
      )}
      {showPreview && (
        <Animated.View entering={FadeInDown.delay(240).springify()} style={{ gap: 8 }}>
          <Txt variant="label">Resultado</Txt>
          <View style={styles.preview}>
            <WebView
              originWhitelist={['*']}
              source={{ html: previewDoc(exercise.code!, 'html') ?? '' }}
              style={{ backgroundColor: '#0c0c18' }}
              scrollEnabled={false}
              javaScriptEnabled={false}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  preview: { height: 150, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorderSoft },
});
