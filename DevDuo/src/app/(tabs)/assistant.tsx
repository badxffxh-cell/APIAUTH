import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatView } from '@/components/ai/ChatView';
import { IconButton } from '@/components/ui/Bits';
import { ScreenBackground, ScreenTitle } from '@/components/ui/Screen';
import { useChat } from '@/store/chat';
import { useSettings } from '@/store/settings';

export default function AssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const clear = useChat((s) => s.clear);
  const model = useSettings((s) => s.model);
  return (
    <ScreenBackground palette={['rgba(0,229,255,0.32)', 'rgba(108,99,255,0.40)', 'rgba(0,255,148,0.10)']}>
      <ScreenTitle
        title="Assistente"
        subtitle={`Gemini · ${model}`}
        right={
          <View style={styles.actions}>
            <IconButton icon="trash-outline" onPress={clear} />
            <IconButton icon="settings-outline" onPress={() => router.push('/settings')} />
          </View>
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ChatView bottomPadding={insets.bottom + 92} />
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
});
