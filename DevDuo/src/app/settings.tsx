import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView } from '@/components/glass/GlassView';
import { Chip, IconButton } from '@/components/ui/Bits';
import { GradientButton } from '@/components/ui/GradientButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenBackground } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { pingGemini } from '@/lib/gemini';
import { haptic } from '@/lib/haptics';
import { useChat } from '@/store/chat';
import { useProgress } from '@/store/progress';
import { GEMINI_MODELS, getApiKey, maskKey, setApiKey, useSettings } from '@/store/settings';
import { colors, fonts, radius } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const model = useSettings((s) => s.model);
  const setModel = useSettings((s) => s.setModel);
  const includeContext = useSettings((s) => s.includeContext);
  const setIncludeContext = useSettings((s) => s.setIncludeContext);
  const dailyGoal = useProgress((s) => s.dailyGoal);
  const setDailyGoal = useProgress((s) => s.setDailyGoal);
  const hapticsOn = useProgress((s) => s.haptics);
  const setHaptics = useProgress((s) => s.setHaptics);
  const resetProgress = useProgress((s) => s.resetProgress);
  const clearChat = useChat((s) => s.clear);

  const [savedKey, setSavedKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [customModel, setCustomModel] = useState(GEMINI_MODELS.some((m) => m.id === model) ? '' : model);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    getApiKey().then(setSavedKey);
  }, []);

  const saveKey = async () => {
    await setApiKey(keyInput);
    setSavedKey(keyInput.trim());
    setKeyInput('');
    haptic.success();
  };

  const test = async () => {
    const k = keyInput.trim() || savedKey;
    if (!k) return setTestResult({ ok: false, msg: 'Adicione uma chave primeiro.' });
    setTesting(true);
    setTestResult(null);
    try {
      const out = await pingGemini(k, model);
      setTestResult({ ok: true, msg: `Conectado ao ${model}! Resposta: "${out.slice(0, 40)}"` });
      haptic.success();
    } catch (e: any) {
      setTestResult({ ok: false, msg: e?.message ?? 'Falha na conexão.' });
      haptic.error();
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 60, paddingHorizontal: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <IconButton icon="chevron-down" onPress={() => router.back()} />
            <Txt variant="headline">Ajustes</Txt>
            <View style={{ width: 42 }} />
          </View>

          {/* Gemini */}
          <Txt variant="label" style={{ marginTop: 8 }}>
            Assistente IA · Gemini
          </Txt>
          <GlassView radius={radius.lg} style={styles.card}>
            <View style={styles.rowBetween}>
              <Txt variant="bodyStrong">Chave da API</Txt>
              <Txt variant="micro" color={savedKey ? colors.success : colors.warning}>
                {savedKey ? `● ${maskKey(savedKey)}` : '● não configurada'}
              </Txt>
            </View>
            <GlassView radius={radius.md} shadow={false} style={styles.inputWrap}>
              <TextInput
                value={keyInput}
                onChangeText={setKeyInput}
                placeholder="Cole sua chave AIza..."
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                keyboardAppearance="dark"
                selectionColor={colors.accent}
                style={styles.input}
              />
            </GlassView>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GradientButton title="Salvar" size="md" icon="key" disabled={!keyInput.trim()} onPress={saveKey} style={{ flex: 1 }} />
              <GradientButton title="Testar" size="md" variant="glass" icon="pulse" loading={testing} onPress={test} style={{ flex: 1 }} />
            </View>
            {testResult && (
              <Txt variant="caption" color={testResult.ok ? colors.success : colors.danger}>
                {testResult.msg}
              </Txt>
            )}
            {savedKey ? (
              <PressableScale
                onPress={async () => {
                  await setApiKey('');
                  setSavedKey('');
                }}
                hapticStyle="tap"
              >
                <Txt variant="caption" color={colors.danger}>
                  Remover chave salva
                </Txt>
              </PressableScale>
            ) : null}
            <PressableScale onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')} hapticStyle="tap" style={styles.link}>
              <Ionicons name="open-outline" size={14} color={colors.accent} />
              <Txt variant="caption" color={colors.accent}>
                Gerar chave grátis no Google AI Studio
              </Txt>
            </PressableScale>
            <Txt variant="micro">A chave fica no Keychain/Keystore do aparelho e só é enviada para a API do Google.</Txt>
          </GlassView>

          <GlassView radius={radius.lg} style={styles.card}>
            <Txt variant="bodyStrong">Modelo</Txt>
            <View style={styles.chips}>
              {GEMINI_MODELS.map((m) => (
                <Chip
                  key={m.id}
                  label={m.label}
                  active={model === m.id}
                  onPress={() => {
                    setModel(m.id);
                    setCustomModel('');
                  }}
                />
              ))}
            </View>
            <Txt variant="micro">{GEMINI_MODELS.find((m) => m.id === model)?.note ?? 'Modelo personalizado'}</Txt>
            <GlassView radius={radius.md} shadow={false} style={styles.inputWrap}>
              <TextInput
                value={customModel}
                onChangeText={setCustomModel}
                onSubmitEditing={() => customModel.trim() && setModel(customModel)}
                placeholder="ou digite um id de modelo (ex.: gemini-4-carbon)"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardAppearance="dark"
                returnKeyType="done"
                selectionColor={colors.accent}
                style={[styles.input, { fontFamily: fonts.mono, fontSize: 13 }]}
              />
            </GlassView>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">Enviar contexto automaticamente</Txt>
                <Txt variant="micro">Arquivo aberto no editor ou exercício atual</Txt>
              </View>
              <Switch value={includeContext} onValueChange={setIncludeContext} trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.15)' }} />
            </View>
          </GlassView>

          {/* Aprendizado */}
          <Txt variant="label" style={{ marginTop: 8 }}>
            Aprendizado
          </Txt>
          <GlassView radius={radius.lg} style={styles.card}>
            <Txt variant="bodyStrong">Meta diária de XP</Txt>
            <View style={styles.chips}>
              {[10, 20, 30, 50, 80].map((g) => (
                <Chip key={g} label={`${g} XP`} active={dailyGoal === g} onPress={() => setDailyGoal(g)} />
              ))}
            </View>
            <View style={styles.rowBetween}>
              <Txt variant="bodyStrong">Vibração (haptics)</Txt>
              <Switch value={hapticsOn} onValueChange={setHaptics} trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.15)' }} />
            </View>
          </GlassView>

          <Txt variant="label" style={{ marginTop: 8 }}>
            Dados
          </Txt>
          <GlassView radius={radius.lg} style={styles.card}>
            <GradientButton title="Limpar conversa com a IA" variant="glass" size="md" icon="chatbubbles-outline" onPress={clearChat} />
            <GradientButton
              title="Apagar todo o progresso"
              variant="danger"
              size="md"
              icon="trash"
              onPress={() =>
                Alert.alert('Apagar progresso?', 'XP, ofensiva, conquistas e lições concluídas serão zerados. Seus projetos do editor não serão apagados.', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Apagar', style: 'destructive', onPress: () => (resetProgress(), haptic.warning()) },
                ])
              }
            />
          </GlassView>

          <Txt variant="micro" center style={{ marginTop: 10 }}>
            DevDuo 1.0 · feito com Expo, Three.js, Skia e Reanimated
          </Txt>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { padding: 16, gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  inputWrap: { paddingHorizontal: 14, height: 48, justifyContent: 'center' },
  input: { position: 'relative', color: colors.text, fontFamily: fonts.medium, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
