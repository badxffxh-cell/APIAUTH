import type { Language, LanguageId } from '@/types';

export const LANGUAGES: Language[] = [
  {
    id: 'html',
    name: 'HTML',
    tagline: 'A estrutura da web',
    color: '#FF6B3D',
    gradient: ['#FF8A3D', '#E34F26'],
    glyph: '</>',
    shape: 'octahedron',
    codeLang: 'html',
  },
  {
    id: 'css',
    name: 'CSS',
    tagline: 'Estilo, layout e animação',
    color: '#3D8BFF',
    gradient: ['#3D8BFF', '#2965F1'],
    glyph: '{ }',
    shape: 'torusKnot',
    codeLang: 'css',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    tagline: 'A linguagem da web interativa',
    color: '#F7DF1E',
    gradient: ['#FFE94D', '#F0C800'],
    glyph: 'JS',
    shape: 'cube',
    codeLang: 'javascript',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    tagline: 'JavaScript com superpoderes de tipo',
    color: '#4A9DFF',
    gradient: ['#4A9DFF', '#3178C6'],
    glyph: 'TS',
    shape: 'dodecahedron',
    codeLang: 'typescript',
  },
  {
    id: 'python',
    name: 'Python',
    tagline: 'Simples, poderosa, onipresente',
    color: '#FFD43B',
    gradient: ['#4B8BBE', '#FFD43B'],
    glyph: 'py',
    shape: 'twinTorus',
    codeLang: 'python',
  },
  {
    id: 'swift',
    name: 'Swift',
    tagline: 'Apps nativos para iPhone',
    color: '#FF6B4A',
    gradient: ['#FF8A5B', '#F05138'],
    glyph: 'sw',
    shape: 'cone',
    codeLang: 'swift',
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    tagline: 'Android moderno e conciso',
    color: '#9B7BFF',
    gradient: ['#B48CFF', '#7F52FF'],
    glyph: 'kt',
    shape: 'tetrahedron',
    codeLang: 'kotlin',
  },
  {
    id: 'sql',
    name: 'SQL',
    tagline: 'Converse com bancos de dados',
    color: '#00C2E0',
    gradient: ['#00E5FF', '#0098B8'],
    glyph: 'db',
    shape: 'database',
    codeLang: 'sql',
  },
];

export const LANGUAGE_MAP: Record<LanguageId, Language> = Object.fromEntries(
  LANGUAGES.map((l) => [l.id, l])
) as Record<LanguageId, Language>;

export const LEVEL_LABEL = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
} as const;
