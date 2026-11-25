import type { Exercise, WriteExercise } from '@/types';

/** Converte aspas "inteligentes" do teclado iOS em aspas retas. */
export function normalizeQuotes(s: string): string {
  return s.replace(/[“”„″]/g, '"').replace(/[‘’‚′]/g, "'").replace(/—/g, '--');
}

export interface WriteResult {
  ok: boolean;
  failedHints: string[];
}

export function checkWrite(ex: WriteExercise, code: string): WriteResult {
  const src = normalizeQuotes(code).trim();
  const failedHints: string[] = [];
  for (const c of ex.checks) {
    try {
      const re = new RegExp(c.pattern, c.flags ?? '');
      if (!re.test(src)) failedHints.push(c.hint);
    } catch {
      // Regra inválida não bloqueia o aluno.
    }
  }
  return { ok: failedHints.length === 0 && src.length > 0, failedHints };
}

/** Embaralhamento determinístico (mesma ordem toda vez que a lição abre). */
export function seededShuffle<T>(arr: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) | 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return ((seed >>> 0) % 100000) / 100000;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Garante que a ordem embaralhada não seja igual à original.
  if (out.length > 1 && out.every((v, i) => v === arr[i])) out.push(out.shift()!);
  return out;
}

/* ---------- Avaliação genérica ---------- */

export type AnswerValue =
  | { type: 'learn' }
  | { type: 'choice'; selected: number | null }
  | { type: 'fill'; slots: (string | null)[] }
  | { type: 'write'; code: string }
  | { type: 'arrange'; order: string[] };

export interface Evaluation {
  correct: boolean;
  /** Resposta correta formatada para exibir no feedback. */
  solution?: string;
  hints?: string[];
}

export function isAnswerReady(ex: Exercise, a: AnswerValue | null): boolean {
  if (ex.type === 'learn') return true;
  if (!a) return false;
  switch (a.type) {
    case 'choice':
      return a.selected !== null;
    case 'fill':
      return a.slots.length > 0 && a.slots.every((s) => s !== null);
    case 'write':
      return a.code.trim().length > 0;
    case 'arrange':
      return ex.type === 'arrange' && a.order.length === ex.lines.length;
    default:
      return true;
  }
}

export function evaluate(ex: Exercise, a: AnswerValue | null): Evaluation {
  switch (ex.type) {
    case 'learn':
      return { correct: true };
    case 'choice':
      return { correct: a?.type === 'choice' && a.selected === ex.answer, solution: ex.options[ex.answer] };
    case 'fill': {
      const ok = a?.type === 'fill' && ex.blanks.every((b, i) => a.slots[i] === b);
      const solution = ex.template.replace(/\{\{(\d+)\}\}/g, (_, i: string) => ex.blanks[Number(i)] ?? '');
      return { correct: ok, solution };
    }
    case 'write': {
      const r = checkWrite(ex, a?.type === 'write' ? a.code : '');
      return { correct: r.ok, solution: ex.solution, hints: r.failedHints };
    }
    case 'arrange': {
      const ok = a?.type === 'arrange' && a.order.length === ex.lines.length && a.order.every((l, i) => l === ex.lines[i]);
      return { correct: ok, solution: ex.lines.join('\n') };
    }
  }
}
