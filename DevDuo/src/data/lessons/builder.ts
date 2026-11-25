import type { Exercise, LanguageId, Lesson, Level } from '@/types';

type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
export type ExerciseInput = DistributiveOmit<Exercise, 'id'>;

interface LessonMeta {
  id: string;
  languageId: LanguageId;
  level: Level;
  title: string;
  description: string;
  icon: string;
  xp?: number;
}

/** Cria uma lição atribuindo ids estáveis aos exercícios. */
export function lesson(meta: LessonMeta, exercises: ExerciseInput[]): Lesson {
  return {
    xp: 15,
    ...meta,
    exercises: exercises.map((e, i) => ({ ...e, id: `${meta.id}-${i + 1}` }) as Exercise),
  };
}

export const r = String.raw;
