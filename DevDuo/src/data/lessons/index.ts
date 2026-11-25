import type { LanguageId, Lesson, Level } from '@/types';
import { HTML_LESSONS } from './html';
import { KOTLIN_LESSONS, PY_LESSONS, SQL_LESSONS, SWIFT_LESSONS } from './native';
import { CSS_LESSONS, JS_LESSONS, TS_LESSONS } from './web';

export const LESSONS_BY_LANGUAGE: Record<LanguageId, Lesson[]> = {
  html: HTML_LESSONS,
  css: CSS_LESSONS,
  javascript: JS_LESSONS,
  typescript: TS_LESSONS,
  python: PY_LESSONS,
  swift: SWIFT_LESSONS,
  kotlin: KOTLIN_LESSONS,
  sql: SQL_LESSONS,
};

export const ALL_LESSONS: Lesson[] = Object.values(LESSONS_BY_LANGUAGE).flat();

const LESSON_MAP = new Map(ALL_LESSONS.map((l) => [l.id, l]));

export function getLesson(id: string): Lesson | undefined {
  return LESSON_MAP.get(id);
}

export const LEVEL_ORDER: Level[] = ['iniciante', 'intermediario', 'avancado'];

/** Retorna a lição seguinte na trilha da mesma linguagem. */
export function nextLessonOf(lesson: Lesson): Lesson | undefined {
  const list = LESSONS_BY_LANGUAGE[lesson.languageId];
  const i = list.findIndex((l) => l.id === lesson.id);
  return i >= 0 ? list[i + 1] : undefined;
}
