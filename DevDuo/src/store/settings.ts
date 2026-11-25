import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const GEMINI_MODELS = [
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen', note: 'Rápido e ótimo para código' },
  { id: 'gemini-flash-latest', label: 'Flash (latest)', note: 'Sempre o Flash mais recente' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', note: 'Estável' },
  { id: 'gemini-4-neon', label: 'Gemini 4 Neon', note: 'Mais inteligente' },
  { id: 'gemini-3.5-flash-lite', label: '3.5 Flash-Lite', note: 'Econômico' },
] as const;

export const DEFAULT_MODEL = GEMINI_MODELS[0].id;

interface SettingsState {
  model: string;
  includeContext: boolean;
  setModel: (m: string) => void;
  setIncludeContext: (v: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      model: DEFAULT_MODEL,
      includeContext: true,
      setModel: (model) => set({ model: model.trim() || DEFAULT_MODEL }),
      setIncludeContext: (includeContext) => set({ includeContext }),
    }),
    { name: 'devduo-settings-v1', storage: createJSONStorage(() => AsyncStorage) }
  )
);

/* ---------- Chave da API Gemini (guardada no Keychain/Keystore) ---------- */

const KEY_NAME = 'devduo.gemini.apiKey';
const ENV_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

let cachedKey: string | null = null;

export async function getApiKey(): Promise<string> {
  if (cachedKey !== null) return cachedKey || ENV_KEY;
  try {
    cachedKey =
      Platform.OS === 'web' ? ((await AsyncStorage.getItem(KEY_NAME)) ?? '') : ((await SecureStore.getItemAsync(KEY_NAME)) ?? '');
  } catch {
    cachedKey = '';
  }
  return cachedKey || ENV_KEY;
}

export async function setApiKey(value: string): Promise<void> {
  const v = value.trim();
  cachedKey = v;
  if (Platform.OS === 'web') {
    if (v) await AsyncStorage.setItem(KEY_NAME, v);
    else await AsyncStorage.removeItem(KEY_NAME);
    return;
  }
  if (v) await SecureStore.setItemAsync(KEY_NAME, v);
  else await SecureStore.deleteItemAsync(KEY_NAME);
}

export function maskKey(k: string): string {
  if (!k) return '';
  return k.length <= 8 ? '••••' : `${k.slice(0, 4)}••••••${k.slice(-4)}`;
}
