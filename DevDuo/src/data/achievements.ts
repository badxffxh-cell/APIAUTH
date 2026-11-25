import type { LanguageId, LessonRecord } from '@/types';
import { LESSONS_BY_LANGUAGE } from './lessons';

export interface AchievementContext {
  xp: number;
  streak: number;
  longestStreak: number;
  completedLessons: Record<string, LessonRecord>;
  stats: {
    lessonsCompleted: number;
    perfectLessons: number;
    projectsCreated: number;
    aiQuestions: number;
    previewsRun: number;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  colors: readonly [string, string];
  check: (c: AchievementContext) => boolean;
}

const languagesStarted = (c: AchievementContext) =>
  new Set(Object.keys(c.completedLessons).map((id) => id.split('-')[0])).size;

const completedAll = (lang: LanguageId) => (c: AchievementContext) =>
  LESSONS_BY_LANGUAGE[lang].every((l) => c.completedLessons[l.id]);

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    title: 'Hello, World!',
    description: 'Complete sua primeira lição.',
    icon: 'rocket',
    colors: ['#6C63FF', '#00E5FF'],
    check: (c) => c.stats.lessonsCompleted >= 1,
  },
  {
    id: 'perfect',
    title: 'Zero bugs',
    description: 'Termine uma lição sem errar nada.',
    icon: 'diamond',
    colors: ['#00FF94', '#00E5FF'],
    check: (c) => c.stats.perfectLessons >= 1,
  },
  {
    id: 'streak_3',
    title: 'Em chamas',
    description: 'Mantenha uma ofensiva de 3 dias.',
    icon: 'flame',
    colors: ['#FFB020', '#FF4D6D'],
    check: (c) => c.longestStreak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Semana imparável',
    description: 'Mantenha uma ofensiva de 7 dias.',
    icon: 'bonfire',
    colors: ['#FF8A3D', '#FF4D6D'],
    check: (c) => c.longestStreak >= 7,
  },
  {
    id: 'xp_100',
    title: 'Centenário',
    description: 'Acumule 100 XP.',
    icon: 'flash',
    colors: ['#FFD166', '#FF8A3D'],
    check: (c) => c.xp >= 100,
  },
  {
    id: 'xp_500',
    title: 'Overclock',
    description: 'Acumule 500 XP.',
    icon: 'speedometer',
    colors: ['#B48CFF', '#6C63FF'],
    check: (c) => c.xp >= 500,
  },
  {
    id: 'html_master',
    title: 'Mestre do Markup',
    description: 'Complete toda a trilha de HTML.',
    icon: 'code-slash',
    colors: ['#FF8A3D', '#E34F26'],
    check: completedAll('html'),
  },
  {
    id: 'polyglot',
    title: 'Poliglota',
    description: 'Estude 3 linguagens diferentes.',
    icon: 'globe',
    colors: ['#00E5FF', '#6C63FF'],
    check: (c) => languagesStarted(c) >= 3,
  },
  {
    id: 'first_project',
    title: 'Builder',
    description: 'Crie seu primeiro projeto no Editor.',
    icon: 'hammer',
    colors: ['#6C63FF', '#B48CFF'],
    check: (c) => c.stats.projectsCreated >= 1,
  },
  {
    id: 'first_preview',
    title: 'Ao vivo!',
    description: 'Rode o preview de um projeto.',
    icon: 'play-circle',
    colors: ['#00FF94', '#6C63FF'],
    check: (c) => c.stats.previewsRun >= 1,
  },
  {
    id: 'ai_curious',
    title: 'Pair programming',
    description: 'Faça 5 perguntas ao Assistente IA.',
    icon: 'sparkles',
    colors: ['#00E5FF', '#00FF94'],
    check: (c) => c.stats.aiQuestions >= 5,
  },
  {
    id: 'ten_lessons',
    title: 'Maratonista',
    description: 'Complete 10 lições.',
    icon: 'trophy',
    colors: ['#FFD166', '#FFB020'],
    check: (c) => c.stats.lessonsCompleted >= 10,
  },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
