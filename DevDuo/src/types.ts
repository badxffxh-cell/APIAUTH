export type CodeLang =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'swift'
  | 'kotlin'
  | 'sql'
  | 'json'
  | 'markdown'
  | 'plain';

export type LanguageId =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'swift'
  | 'kotlin'
  | 'sql';

export type Level = 'iniciante' | 'intermediario' | 'avancado';

export type ShapeKind =
  | 'octahedron'
  | 'torusKnot'
  | 'cube'
  | 'dodecahedron'
  | 'twinTorus'
  | 'cone'
  | 'tetrahedron'
  | 'database';

export interface Language {
  id: LanguageId;
  name: string;
  tagline: string;
  color: string;
  gradient: readonly [string, string];
  glyph: string;
  shape: ShapeKind;
  codeLang: CodeLang;
}

interface BaseExercise {
  id: string;
  prompt: string;
  explanation: string;
}

/** Cartão de conceito: ensina antes de cobrar (não vale nota). */
export interface LearnExercise extends BaseExercise {
  type: 'learn';
  title: string;
  code?: string;
  codeLang?: CodeLang;
}

export interface ChoiceExercise extends BaseExercise {
  type: 'choice';
  code?: string;
  codeLang?: CodeLang;
  options: string[];
  answer: number;
  /** Mostra as opções em fonte mono (quando são trechos de código). */
  monoOptions?: boolean;
}

/** Completar código: `template` usa {{0}}, {{1}}... para as lacunas. */
export interface FillExercise extends BaseExercise {
  type: 'fill';
  template: string;
  codeLang: CodeLang;
  blanks: string[];
  bank: string[];
}

export interface WriteCheck {
  pattern: string;
  flags?: string;
  hint: string;
}

/** Escrever código do zero, validado por regras (regex). */
export interface WriteExercise extends BaseExercise {
  type: 'write';
  codeLang: CodeLang;
  starter?: string;
  placeholder?: string;
  checks: WriteCheck[];
  solution: string;
}

/** Ordenar linhas de código. */
export interface ArrangeExercise extends BaseExercise {
  type: 'arrange';
  codeLang: CodeLang;
  lines: string[];
}

export type Exercise =
  | LearnExercise
  | ChoiceExercise
  | FillExercise
  | WriteExercise
  | ArrangeExercise;

export interface Lesson {
  id: string;
  languageId: LanguageId;
  level: Level;
  title: string;
  description: string;
  icon: string;
  xp: number;
  exercises: Exercise[];
}

export interface LessonRecord {
  completedAt: number;
  bestAccuracy: number;
  timesCompleted: number;
  xpEarned: number;
}

export interface ProjectMeta {
  id: string;
  name: string;
  template: string;
  createdAt: number;
  updatedAt: number;
}

export interface FileNode {
  name: string;
  /** Caminho relativo à raiz do projeto, sem barra inicial (ex.: "css/style.css"). */
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}
