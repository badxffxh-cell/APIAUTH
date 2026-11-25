import { Platform } from 'react-native';

/** Paleta oficial do DevDuo. */
export const colors = {
  bg: '#080810',
  bgElevated: '#0E0E1B',
  bgSunken: '#05050B',

  glass: 'rgba(255,255,255,0.08)',
  glassStrong: 'rgba(255,255,255,0.12)',
  glassPressed: 'rgba(255,255,255,0.16)',
  glassBorder: 'rgba(255,255,255,0.20)',
  glassBorderSoft: 'rgba(255,255,255,0.10)',
  glassHighlight: 'rgba(255,255,255,0.28)',

  primary: '#6C63FF',
  primarySoft: 'rgba(108,99,255,0.22)',
  primaryLight: '#A39DFF',
  accent: '#00E5FF',
  accentSoft: 'rgba(0,229,255,0.18)',
  success: '#00FF94',
  successSoft: 'rgba(0,255,148,0.16)',
  danger: '#FF4D6D',
  dangerSoft: 'rgba(255,77,109,0.18)',
  warning: '#FFB020',
  gold: '#FFD166',
  flame: '#FF8A3D',
  heart: '#FF4D6D',
  gem: '#00E5FF',

  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.38)',
  textInverse: '#080810',
} as const;

export const gradients = {
  primary: ['#6C63FF', '#00E5FF'] as const,
  primaryDeep: ['#7B5CFF', '#6C63FF', '#3D7BFF'] as const,
  success: ['#00FF94', '#00E5FF'] as const,
  danger: ['#FF4D6D', '#FF8A3D'] as const,
  gold: ['#FFD166', '#FF8A3D'] as const,
  flame: ['#FFB020', '#FF4D6D'] as const,
  glass: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.02)'] as const,
  disabled: ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.08)'] as const,
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

/** Intensidade padrão do blur (equivalente visual ao blur 20 do Control Center). */
export const BLUR_INTENSITY = Platform.OS === 'ios' ? 40 : 30;

/** Cores do syntax highlighting, afinadas para a paleta neon. */
export const syntax = {
  plain: '#E6E6F2',
  keyword: '#B9A6FF',
  string: '#00FF94',
  number: '#FFB86C',
  comment: 'rgba(255,255,255,0.36)',
  tag: '#00E5FF',
  attr: '#C3B8FF',
  function: '#7FD4FF',
  type: '#FFD166',
  punct: 'rgba(255,255,255,0.62)',
  property: '#00E5FF',
  selector: '#FFD166',
  entity: '#FF8AC6',
  builtin: '#FF8AC6',
} as const;

export type SyntaxToken = keyof typeof syntax;

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  glow: (color: string, opacity = 0.55, r = 18) => ({
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: r,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  }),
};
