import { create } from 'zustand';

import type { CodeLang } from '@/types';

/* ---------- Celebrações de conquistas (fila global) ---------- */

interface CelebrationState {
  queue: string[];
  push: (ids: string[]) => void;
  shift: () => void;
}

export const useCelebration = create<CelebrationState>((set) => ({
  queue: [],
  push: (ids) => ids.length && set((s) => ({ queue: [...s.queue, ...ids] })),
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
}));

/* ---------- Contexto enviado automaticamente ao Assistente IA ---------- */

export interface FileContext {
  kind: 'file';
  projectName: string;
  fileName: string;
  path: string;
  language: CodeLang;
  content: string;
}

export interface LessonContext {
  kind: 'lesson';
  lessonTitle: string;
  language: string;
  prompt: string;
  code?: string;
}

export type AIContext = FileContext | LessonContext;

interface AIUIState {
  open: boolean;
  /** Registrado pela tela do editor para permitir "Inserir no editor" a partir do chat. */
  editorInsert: ((code: string) => void) | null;
  setEditorInsert: (fn: ((code: string) => void) | null) => void;
  context: AIContext | null;
  /** Prompt a ser enviado assim que o chat abrir (atalhos "Explicar", "Encontrar erros"...). */
  pendingPrompt: string | null;
  setOpen: (open: boolean) => void;
  setContext: (ctx: AIContext | null) => void;
  ask: (prompt: string) => void;
  consumePending: () => string | null;
}

export const useAIUI = create<AIUIState>((set, get) => ({
  open: false,
  editorInsert: null,
  setEditorInsert: (editorInsert) => set({ editorInsert }),
  context: null,
  pendingPrompt: null,
  setOpen: (open) => set({ open }),
  setContext: (context) => set({ context }),
  ask: (prompt) => set({ pendingPrompt: prompt, open: true }),
  consumePending: () => {
    const p = get().pendingPrompt;
    if (p) set({ pendingPrompt: null });
    return p;
  },
}));
