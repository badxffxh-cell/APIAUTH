import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { GeminiError, streamGemini } from '@/lib/gemini';
import { getApiKey, useSettings } from './settings';
import { useProgress } from './progress';
import { useAIUI, useCelebration, type AIContext } from './ui';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: number;
  contextLabel?: string;
  error?: boolean;
  needsKey?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  streaming: boolean;
  send: (text: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
let controller: AbortController | null = null;

const SYSTEM = `Você é o DevDuo AI, mentor de programação dentro do app DevDuo (um "Duolingo para desenvolvedores" com editor de código mobile).
Regras:
- Responda SEMPRE em português do Brasil, de forma clara, amigável e objetiva.
- Use Markdown: títulos curtos, listas e blocos de código com a linguagem (\`\`\`html, \`\`\`css, \`\`\`js...).
- Quando explicar erros, aponte a linha/trecho exato, explique o porquê e mostre a correção.
- Em exercícios de lição, dê DICAS progressivas e não entregue a resposta completa de cara, a menos que o aluno peça explicitamente.
- O preview do editor é um WebView: index.html pode referenciar style.css e script.js do mesmo projeto.
- Seja conciso: prefira respostas que caibam na tela de um celular.`;

function contextBlock(ctx: AIContext | null): string {
  if (!ctx) return '';
  if (ctx.kind === 'file') {
    const content = ctx.content.length > 12000 ? ctx.content.slice(0, 12000) + '\n/* ...arquivo truncado... */' : ctx.content;
    return `\n\n[CONTEXTO AUTOMÁTICO] O usuário está com o arquivo "${ctx.path}" aberto no projeto "${ctx.projectName}" (linguagem: ${ctx.language}). Conteúdo atual:\n\`\`\`${ctx.language}\n${content}\n\`\`\``;
  }
  return `\n\n[CONTEXTO AUTOMÁTICO] O usuário está fazendo a lição "${ctx.lessonTitle}" de ${ctx.language}. Exercício atual: "${ctx.prompt}"${
    ctx.code ? `\nCódigo do exercício/rascunho do aluno:\n\`\`\`\n${ctx.code}\n\`\`\`` : ''
  }\nAjude com dicas sem entregar a resposta pronta.`;
}

export function contextLabel(ctx: AIContext | null): string | undefined {
  if (!ctx) return undefined;
  return ctx.kind === 'file' ? ctx.fileName : `Lição: ${ctx.lessonTitle}`;
}

export const useChat = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      streaming: false,

      send: async (raw) => {
        const text = raw.trim();
        if (!text || get().streaming) return;
        const { includeContext, model } = useSettings.getState();
        const ctx = includeContext ? useAIUI.getState().context : null;

        const userMsg: ChatMessage = { id: uid(), role: 'user', text, createdAt: Date.now(), contextLabel: contextLabel(ctx) };
        const botMsg: ChatMessage = { id: uid(), role: 'model', text: '', createdAt: Date.now() };
        set((s) => ({ messages: [...s.messages, userMsg, botMsg].slice(-80), streaming: true }));

        const fresh = useProgress.getState().track('aiQuestions');
        useCelebration.getState().push(fresh);

        const patchBot = (patch: Partial<ChatMessage>) =>
          set((s) => ({ messages: s.messages.map((m) => (m.id === botMsg.id ? { ...m, ...patch } : m)) }));

        const apiKey = await getApiKey();
        if (!apiKey) {
          patchBot({
            text: 'Para conversar comigo, adicione sua **chave da API Gemini** em Perfil → Ajustes. É grátis no Google AI Studio (aistudio.google.com).',
            needsKey: true,
            error: true,
          });
          set({ streaming: false });
          return;
        }

        const history = get()
          .messages.filter((m) => m.id !== botMsg.id && !m.error && m.text)
          .slice(-16)
          .map((m) => ({ role: m.role, text: m.text }));
        // O contexto vai junto da última pergunta (sempre a versão mais atual do arquivo).
        if (history.length) history[history.length - 1] = { role: 'user', text: text + contextBlock(ctx) };

        controller = new AbortController();
        try {
          let last = 0;
          await streamGemini({
            apiKey,
            model,
            system: SYSTEM,
            history,
            signal: controller.signal,
            onToken: (full) => {
              const now = Date.now();
              if (now - last > 40) {
                last = now;
                patchBot({ text: full });
              }
            },
          }).then((full) => patchBot({ text: full || '_(sem resposta)_' }));
        } catch (e) {
          const msg = e instanceof GeminiError ? e.message : 'Não consegui falar com a IA. Verifique sua conexão.';
          patchBot({ text: msg, error: true });
        } finally {
          controller = null;
          set({ streaming: false });
        }
      },

      stop: () => {
        controller?.abort();
        set({ streaming: false });
      },

      clear: () => {
        controller?.abort();
        set({ messages: [], streaming: false });
      },
    }),
    {
      name: 'devduo-chat-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ messages: s.messages.filter((m) => m.text).slice(-60) }) as never,
    }
  )
);
