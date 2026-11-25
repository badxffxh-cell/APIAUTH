import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ACHIEVEMENTS } from '@/data/achievements';
import { LESSONS_BY_LANGUAGE } from '@/data/lessons';
import { addDays, dayKey, startOfWeek } from '@/lib/date';
import type { LanguageId, LessonRecord } from '@/types';

export const MAX_HEARTS = 5;
export const HEART_REGEN_MS = 20 * 60 * 1000;
export const REFILL_COST = 30;

type StatKey = 'projectsCreated' | 'aiQuestions' | 'previewsRun';

export interface Stats {
  lessonsCompleted: number;
  perfectLessons: number;
  exercisesCorrect: number;
  exercisesAnswered: number;
  projectsCreated: number;
  aiQuestions: number;
  previewsRun: number;
  minutesLearning: number;
}

export interface LessonResult {
  xpEarned: number;
  gemsEarned: number;
  accuracy: number;
  streak: number;
  streakIncreased: boolean;
  firstTime: boolean;
  newAchievements: string[];
}

interface ProgressState {
  hydrated: boolean;
  username: string;
  avatar: string;
  xp: number;
  gems: number;
  hearts: number;
  heartsUpdatedAt: number;
  streak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  dailyGoal: number;
  xpByDay: Record<string, number>;
  completedLessons: Record<string, LessonRecord>;
  achievements: Record<string, number>;
  stats: Stats;
  haptics: boolean;

  completeLesson: (input: {
    lessonId: string;
    baseXp: number;
    correct: number;
    answered: number;
    mistakes: number;
    durationMs: number;
  }) => LessonResult;
  loseHeart: () => void;
  syncHearts: () => void;
  refillHearts: () => boolean;
  track: (key: StatKey) => string[];
  setProfile: (p: { username?: string; avatar?: string }) => void;
  setDailyGoal: (goal: number) => void;
  setHaptics: (on: boolean) => void;
  resetProgress: () => void;
}

const initialStats: Stats = {
  lessonsCompleted: 0,
  perfectLessons: 0,
  exercisesCorrect: 0,
  exercisesAnswered: 0,
  projectsCreated: 0,
  aiQuestions: 0,
  previewsRun: 0,
  minutesLearning: 0,
};

const initialData = {
  username: 'Dev',
  avatar: '🧑‍💻',
  xp: 0,
  gems: 50,
  hearts: MAX_HEARTS,
  heartsUpdatedAt: Date.now(),
  streak: 0,
  longestStreak: 0,
  lastActiveDay: null as string | null,
  dailyGoal: 30,
  xpByDay: {} as Record<string, number>,
  completedLessons: {} as Record<string, LessonRecord>,
  achievements: {} as Record<string, number>,
  stats: initialStats,
  haptics: true,
};

/** Desbloqueia conquistas novas e retorna seus ids. */
function evaluate(state: ProgressState): { unlocked: Record<string, number>; fresh: string[] } {
  const fresh: string[] = [];
  const unlocked = { ...state.achievements };
  for (const a of ACHIEVEMENTS) {
    if (unlocked[a.id]) continue;
    if (a.check(state)) {
      unlocked[a.id] = Date.now();
      fresh.push(a.id);
    }
  }
  return { unlocked, fresh };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initialData,

      completeLesson: ({ lessonId, baseXp, correct, answered, mistakes, durationMs }) => {
        const s = get();
        const today = dayKey();
        const yesterday = dayKey(addDays(new Date(), -1));
        const firstTime = !s.completedLessons[lessonId];
        const accuracy = answered > 0 ? correct / answered : 1;
        const perfect = mistakes === 0;

        let streak = s.streak;
        let streakIncreased = false;
        if (s.lastActiveDay !== today) {
          streak = s.lastActiveDay === yesterday ? s.streak + 1 : 1;
          streakIncreased = true;
        }

        const xpEarned = Math.round((firstTime ? baseXp : Math.ceil(baseXp / 2)) + (perfect ? 5 : 0) + Math.min(streak, 7));
        const gemsEarned = firstTime ? (perfect ? 10 : 5) : 2;

        const prevRecord = s.completedLessons[lessonId];
        const record: LessonRecord = {
          completedAt: Date.now(),
          bestAccuracy: Math.max(prevRecord?.bestAccuracy ?? 0, accuracy),
          timesCompleted: (prevRecord?.timesCompleted ?? 0) + 1,
          xpEarned: (prevRecord?.xpEarned ?? 0) + xpEarned,
        };

        set({
          xp: s.xp + xpEarned,
          gems: s.gems + gemsEarned,
          streak,
          longestStreak: Math.max(s.longestStreak, streak),
          lastActiveDay: today,
          xpByDay: { ...s.xpByDay, [today]: (s.xpByDay[today] ?? 0) + xpEarned },
          completedLessons: { ...s.completedLessons, [lessonId]: record },
          stats: {
            ...s.stats,
            lessonsCompleted: s.stats.lessonsCompleted + 1,
            perfectLessons: s.stats.perfectLessons + (perfect ? 1 : 0),
            exercisesCorrect: s.stats.exercisesCorrect + correct,
            exercisesAnswered: s.stats.exercisesAnswered + answered,
            minutesLearning: s.stats.minutesLearning + Math.max(1, Math.round(durationMs / 60000)),
          },
        });

        const { unlocked, fresh } = evaluate(get());
        if (fresh.length) set({ achievements: unlocked });

        return { xpEarned, gemsEarned, accuracy, streak, streakIncreased, firstTime, newAchievements: fresh };
      },

      loseHeart: () => {
        get().syncHearts();
        const s = get();
        const wasFull = s.hearts >= MAX_HEARTS;
        set({ hearts: Math.max(0, s.hearts - 1), heartsUpdatedAt: wasFull ? Date.now() : s.heartsUpdatedAt });
      },

      syncHearts: () => {
        const s = get();
        if (s.hearts >= MAX_HEARTS) return;
        const now = Date.now();
        const gained = Math.floor((now - s.heartsUpdatedAt) / HEART_REGEN_MS);
        if (gained <= 0) return;
        const hearts = Math.min(MAX_HEARTS, s.hearts + gained);
        set({ hearts, heartsUpdatedAt: hearts >= MAX_HEARTS ? now : s.heartsUpdatedAt + gained * HEART_REGEN_MS });
      },

      refillHearts: () => {
        const s = get();
        if (s.gems < REFILL_COST || s.hearts >= MAX_HEARTS) return false;
        set({ gems: s.gems - REFILL_COST, hearts: MAX_HEARTS, heartsUpdatedAt: Date.now() });
        return true;
      },

      track: (key) => {
        const s = get();
        set({ stats: { ...s.stats, [key]: s.stats[key] + 1 } });
        const { unlocked, fresh } = evaluate(get());
        if (fresh.length) set({ achievements: unlocked });
        return fresh;
      },

      setProfile: ({ username, avatar }) =>
        set((s) => ({ username: username?.trim() || s.username, avatar: avatar ?? s.avatar })),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setHaptics: (haptics) => set({ haptics }),
      resetProgress: () => set({ ...initialData, heartsUpdatedAt: Date.now(), stats: { ...initialStats } }),
    }),
    {
      name: 'devduo-progress-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, ...rest }) => {
        // Funções não são serializadas; o hidratador recompõe o estado.
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as never;
      },
      onRehydrateStorage: () => () => {
        useProgress.setState({ hydrated: true });
      },
    }
  )
);

/* ---------- Seletores derivados ---------- */

/** Ofensiva efetiva: zera se o último dia ativo não foi hoje nem ontem. */
export function effectiveStreak(s: Pick<ProgressState, 'streak' | 'lastActiveDay'>): number {
  if (!s.lastActiveDay) return 0;
  const today = dayKey();
  const yesterday = dayKey(addDays(new Date(), -1));
  return s.lastActiveDay === today || s.lastActiveDay === yesterday ? s.streak : 0;
}

export function weeklyXp(xpByDay: Record<string, number>, now = new Date()): number {
  const start = startOfWeek(now);
  let total = 0;
  for (let i = 0; i < 7; i++) total += xpByDay[dayKey(addDays(start, i))] ?? 0;
  return total;
}

export function levelFromXp(xp: number) {
  // Cada nível pede um pouco mais de XP que o anterior.
  let level = 1;
  let need = 60;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level++;
    need = Math.round(need * 1.25);
  }
  return { level, current: rest, needed: need, progress: rest / need };
}

export function languageProgress(completed: Record<string, LessonRecord>, lang: LanguageId) {
  const list = LESSONS_BY_LANGUAGE[lang];
  const done = list.filter((l) => completed[l.id]).length;
  return { done, total: list.length, ratio: list.length ? done / list.length : 0 };
}

export function isLessonUnlocked(completed: Record<string, LessonRecord>, lang: LanguageId, lessonId: string) {
  const list = LESSONS_BY_LANGUAGE[lang];
  const i = list.findIndex((l) => l.id === lessonId);
  return i <= 0 || !!completed[list[i - 1].id];
}

/** Próxima lição recomendada (primeira não concluída, priorizando a linguagem mais recente). */
export function nextRecommendedLesson(completed: Record<string, LessonRecord>) {
  const entries = Object.entries(completed).sort((a, b) => b[1].completedAt - a[1].completedAt);
  const recentLang = (entries[0]?.[0].split('-')[0] ?? 'html') as string;
  const order: LanguageId[] = ['html', 'css', 'javascript', 'typescript', 'python', 'swift', 'kotlin', 'sql'];
  const langMap: Record<string, LanguageId> = { js: 'javascript', ts: 'typescript', py: 'python', sw: 'swift', kt: 'kotlin' };
  const recent = (langMap[recentLang] ?? recentLang) as LanguageId;
  const langs = [recent, ...order.filter((l) => l !== recent)];
  for (const lang of langs) {
    const next = LESSONS_BY_LANGUAGE[lang]?.find((l) => !completed[l.id]);
    if (next) return next;
  }
  return LESSONS_BY_LANGUAGE.html[0];
}

export function msToNextHeart(s: Pick<ProgressState, 'hearts' | 'heartsUpdatedAt'>, now = Date.now()) {
  if (s.hearts >= MAX_HEARTS) return 0;
  const elapsed = (now - s.heartsUpdatedAt) % HEART_REGEN_MS;
  return HEART_REGEN_MS - elapsed;
}
