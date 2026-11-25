import { startOfWeek } from '@/lib/date';

export interface League {
  id: string;
  name: string;
  minXp: number;
  colors: readonly [string, string];
  icon: string;
}

export const LEAGUES: League[] = [
  { id: 'bronze', name: 'Bronze', minXp: 0, colors: ['#D79B6A', '#8C5A3C'], icon: 'shield' },
  { id: 'prata', name: 'Prata', minXp: 100, colors: ['#E6ECF5', '#8D99AE'], icon: 'shield-half' },
  { id: 'ouro', name: 'Ouro', minXp: 300, colors: ['#FFD166', '#FF9F1C'], icon: 'medal' },
  { id: 'safira', name: 'Safira', minXp: 700, colors: ['#00E5FF', '#3D7BFF'], icon: 'diamond' },
  { id: 'rubi', name: 'Rubi', minXp: 1500, colors: ['#FF4D6D', '#C9184A'], icon: 'flame' },
  { id: 'diamante', name: 'Diamante', minXp: 3000, colors: ['#B48CFF', '#00E5FF'], icon: 'planet' },
];

export function leagueFor(totalXp: number): League {
  let current = LEAGUES[0];
  for (const l of LEAGUES) if (totalXp >= l.minXp) current = l;
  return current;
}

const BOT_NAMES: { name: string; avatar: string }[] = [
  { name: 'Lia Kernel', avatar: '🦊' },
  { name: 'Rafa Async', avatar: '🐙' },
  { name: 'Bia Pixel', avatar: '🦄' },
  { name: 'Theo Stack', avatar: '🐼' },
  { name: 'Nina Lambda', avatar: '🐝' },
  { name: 'Caio Regex', avatar: '🦖' },
  { name: 'Duda Flex', avatar: '🐧' },
  { name: 'Gabi Swift', avatar: '🦋' },
  { name: 'Leo Kotlin', avatar: '🦁' },
  { name: 'Mel Query', avatar: '🐨' },
  { name: 'João Node', avatar: '🐢' },
  { name: 'Iris Shader', avatar: '🐳' },
  { name: 'Pedro Hook', avatar: '🦉' },
  { name: 'Sofi Byte', avatar: '🐱' },
];

/** PRNG determinístico (mulberry32) para que o ranking seja estável dentro da semana. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RankEntry {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  isMe: boolean;
}

/**
 * Ranking semanal simulado: os competidores "estudam" ao longo da semana,
 * então o XP deles cresce conforme os dias passam.
 */
export function buildLeaderboard(me: { name: string; avatar: string; weeklyXp: number }, now = Date.now()): RankEntry[] {
  const weekStart = startOfWeek(new Date(now)).getTime();
  const elapsed = Math.min(1, (now - weekStart) / (7 * 24 * 3600 * 1000));
  const rand = rng(Math.floor(weekStart / 1000));
  const bots: RankEntry[] = BOT_NAMES.map((b, i) => {
    const pace = 40 + rand() * 360;
    const curve = Math.pow(elapsed, 0.6 + rand() * 0.8);
    return { id: `bot-${i}`, name: b.name, avatar: b.avatar, xp: Math.round(pace * curve + rand() * 12), isMe: false };
  });
  const list = [...bots, { id: 'me', name: me.name, avatar: me.avatar, xp: me.weeklyXp, isMe: true }];
  return list.sort((a, b) => b.xp - a.xp || (a.isMe ? -1 : 1));
}
