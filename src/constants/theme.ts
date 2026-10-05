/**
 * Design system StudyRats — tokens extraídos das telas do Stitch
 * (tema escuro navy, acento âmbar para ação/XP, roxo para IA/nível,
 * verde para sincronizado, laranja para pendente).
 */
import '@/global.css';

export const Colors = {
  background: '#0E121C',
  surface: '#161C29',
  surfaceRaised: '#1E2535',
  surfaceInput: '#111622',
  border: '#262E40',
  borderStrong: '#323B50',

  text: '#F3F5F9',
  textSecondary: '#9AA3B5',
  textMuted: '#667085',

  primary: '#FDBA5C', // âmbar (CTA, XP)
  primaryStrong: '#F59E0B',
  primaryText: '#2A1A04',
  primarySoft: 'rgba(253, 186, 92, 0.14)',

  ai: '#8B5CF6', // roxo (IA, nível)
  aiStrong: '#6D28D9',
  aiSoft: 'rgba(139, 92, 246, 0.16)',
  aiText: '#C4B5FD',

  success: '#34D399', // sincronizado
  successSoft: 'rgba(52, 211, 153, 0.14)',
  warning: '#F59E0B', // pendente
  warningSoft: 'rgba(245, 158, 11, 0.14)',
  danger: '#F87171', // erro
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
} as const;

/** Paleta para o campo `cor` da entidade Disciplina. */
export const DisciplinaCores = [
  '#FDBA5C',
  '#8B5CF6',
  '#34D399',
  '#38BDF8',
  '#F472B6',
  '#F87171',
] as const;

export const Fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const MaxContentWidth = 520;
