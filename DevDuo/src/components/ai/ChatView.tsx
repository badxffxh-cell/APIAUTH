import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { GlassView } from '@/components/glass/GlassView';
import { Chip, GradientIcon } from '@/components/ui/Bits';
import { GradientButton } from '@/components/ui/GradientButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { contextLabel, useChat, type ChatMessage } from '@/store/chat';
import { useSettings } from '@/store/settings';
import { useAIUI } from '@/store/ui';
import { colors, fonts, gradients, radius } from '@/theme';
import { Markdown } from './Markdown';

const FILE_ACTIONS = [
  { label: 'Explicar código', icon: 'book-outline', prompt: 'Explique o que este arquivo faz, parte por parte, de forma didática.' },
  { label: 'Encontrar erros', icon: 'bug-outline', prompt: 'Revise este arquivo e encontre erros ou bugs. Mostre a linha e a correção.' },
  { label: 'Sugerir melhorias', icon: 'sparkles-outline', prompt: 'Sugira melhorias de qualidade, acessibilidade e boas práticas para este arquivo.' },
] as const;

const LESSON_ACTIONS = [
  { label: 'Me dê uma dica', icon: 'bulb-outline', prompt: 'Me dê uma dica para resolver este exercício, sem entregar a resposta.' },
  { label: 'Explique o conceito', icon: 'school-outline', prompt: 'Explique o conceito por trás deste exercício com um exemplo simples.' },
] as const;

const STARTERS = [
  'Qual a diferença entre let e const?',
  'Como centralizar uma div com flexbox?',
  'O que é HTML semântico?',
  'Me explique promises em JavaScript',
];

/** Conversa com o Gemini: streaming, markdown, contexto automático do arquivo aberto. */
export function ChatView({ bottomPadding = 12, compactHeader }: { bottomPadding?: number; compactHeader?: boolean }) {
  const messages = useChat((s) => s.messages);
  const streaming = useChat((s) => s.streaming);
  const send = useChat((s) => s.send);
  const stop = useChat((s) => s.stop);
  const context = useAIUI((s) => s.context);
  const open = useAIUI((s) => s.open);
  const includeContext = useSettings((s) => s.includeContext);
  const setIncludeContext = useSettings((s) => s.setIncludeContext);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollViewInstance>(null);

  // Prompts disparados por atalhos de outras telas.
  useEffect(() => {
    const p = useAIUI.getState().consumePending();
    if (p) send(p);
  }, [open, send]);

  const submit = (text = input) => {
    if (!text.trim()) return;
    setInput('');
    send(text);
  };

  const actions = context?.kind === 'file' ? FILE_ACTIONS : context?.kind === 'lesson' ? LESSON_ACTIONS : [];
  const label = contextLabel(context);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}
        onContentSizeChange={() => messages.length > 0 && scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {messages.length === 0 ? <Welcome compact={compactHeader} onPick={submit} /> : messages.map((m, i) => <Bubble key={m.id} msg={m} streaming={streaming && i === messages.length - 1} />)}
      </ScrollView>

      <View style={{ paddingHorizontal: 12, paddingBottom: bottomPadding, gap: 8 }}>
        {label && (
          <Animated.View entering={FadeInUp} style={styles.contextRow}>
            <Chip label={label} icon={context?.kind === 'file' ? 'document-text-outline' : 'school-outline'} active={includeContext} onPress={() => setIncludeContext(!includeContext)} mono={context?.kind === 'file'} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
              {includeContext &&
                actions.map((a) => <Chip key={a.label} label={a.label} icon={a.icon as never} onPress={() => submit(a.prompt)} />)}
            </ScrollView>
          </Animated.View>
        )}
        <GlassView radius={26} strong style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={label && includeContext ? `Pergunte sobre ${label}...` : 'Pergunte qualquer coisa de código...'}
            placeholderTextColor={colors.textTertiary}
            multiline
            style={styles.input}
            keyboardAppearance="dark"
            selectionColor={colors.accent}
          />
          {streaming ? (
            <PressableScale onPress={stop} scaleTo={0.88} hapticStyle="light">
              <View style={[styles.send, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="stop" size={16} color="#fff" />
              </View>
            </PressableScale>
          ) : (
            <PressableScale onPress={() => submit()} disabled={!input.trim()} scaleTo={0.88} hapticStyle="medium">
              <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.send}>
                <Ionicons name="arrow-up" size={20} color="#fff" />
              </LinearGradient>
            </PressableScale>
          )}
        </GlassView>
      </View>
    </View>
  );
}

function Welcome({ onPick, compact }: { onPick: (t: string) => void; compact?: boolean }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', gap: 12, paddingTop: compact ? 8 : 28 }}>
      <GradientIcon icon="sparkles" colors={['#6C63FF', '#00E5FF']} size={compact ? 56 : 72} />
      <Txt variant="title" center>
        Olá! Sou o DevDuo AI
      </Txt>
      <Txt variant="caption" center style={{ maxWidth: 290 }}>
        Tire dúvidas, peça explicações de erros ou sugestões de melhoria. Quando você estiver no editor, eu leio o arquivo aberto automaticamente.
      </Txt>
      <View style={{ width: '100%', gap: 8, marginTop: 10 }}>
        {STARTERS.map((s, i) => (
          <Animated.View key={s} entering={FadeInDown.delay(100 + i * 70).springify()}>
            <PressableScale onPress={() => onPick(s)} scaleTo={0.97} hapticStyle="tap">
              <GlassView radius={radius.md} shadow={false} style={styles.starter} borderColor={colors.glassBorderSoft}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.accent} />
                <Txt variant="bodyStrong" style={{ flex: 1, fontSize: 14 }}>
                  {s}
                </Txt>
                <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} />
              </GlassView>
            </PressableScale>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

function TypingDots() {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1);
  }, [o]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[{ flexDirection: 'row', gap: 4, paddingVertical: 6 }, s]}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent }} />
      ))}
    </Animated.View>
  );
}

function Bubble({ msg, streaming }: { msg: ChatMessage; streaming: boolean }) {
  const router = useRouter();
  const setOpen = useAIUI((s) => s.setOpen);
  if (msg.role === 'user') {
    return (
      <Animated.View entering={FadeInDown.springify().damping(16)} style={{ alignItems: 'flex-end', gap: 4 }}>
        <LinearGradient colors={['#6C63FF', '#4B7BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.userBubble}>
          <Txt variant="body" style={{ color: '#fff' }}>
            {msg.text}
          </Txt>
        </LinearGradient>
        {msg.contextLabel && (
          <View style={styles.ctxTag}>
            <Ionicons name="attach" size={12} color={colors.textTertiary} />
            <Txt variant="micro" color={colors.textTertiary}>
              {msg.contextLabel}
            </Txt>
          </View>
        )}
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.botRow}>
      <LinearGradient colors={gradients.primary} style={styles.avatar}>
        <Ionicons name="sparkles" size={14} color="#fff" />
      </LinearGradient>
      <GlassView radius={20} shadow={false} borderColor={msg.error ? 'rgba(255,77,109,0.5)' : colors.glassBorderSoft} style={styles.botBubble}>
        {!msg.text && streaming ? <TypingDots /> : <Markdown text={msg.text} streaming={streaming} />}
        {msg.needsKey && (
          <GradientButton
            title="Configurar chave"
            icon="key"
            size="sm"
            style={{ marginTop: 10, alignSelf: 'flex-start' }}
            onPress={() => {
              setOpen(false);
              router.push('/settings');
            }}
          />
        )}
      </GlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 16, paddingRight: 6, paddingVertical: 6, minHeight: 52 },
  input: { position: 'relative', flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15.5, maxHeight: 120, paddingTop: 9, paddingBottom: 9 },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 50 },
  userBubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderBottomRightRadius: 6 },
  ctxTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  botRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  botBubble: { flex: 1, padding: 14, borderTopLeftRadius: 6 },
});
