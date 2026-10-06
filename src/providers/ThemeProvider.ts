import { create } from 'zustand';
import { Colors as DarkColors } from '../constants/theme';

export const LightColors = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceRaised: '#F8FAFC',
  surfaceInput: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  text: '#19191B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  primary: '#3867D6',
  primaryStrong: '#254EAA',
  primaryText: '#FFFFFF',
  primarySoft: '#EBF2FF',

  ai: '#8854D0',
  aiStrong: '#6840A0',
  aiSoft: '#F3EDFC',
  aiText: '#8854D0',

  success: '#20BF6B',
  successSoft: '#E8F8F0',
  warning: '#FA8231',
  warningSoft: '#FFF2E5',
  danger: '#FF6B6B',
  dangerSoft: '#FFEAEA',

  yellow: '#FFD32A',
  yellowSoft: '#FFFCEB',
} as const;

interface ThemeState {
  modoEscuro: boolean;
  setModoEscuro: (ativo: boolean) => void;
  colors: Record<keyof typeof DarkColors, string>;
}

export const useAppTheme = create<ThemeState>((set) => ({
  modoEscuro: true,
  colors: DarkColors,
  setModoEscuro: (ativo: boolean) => set({
    modoEscuro: ativo,
    colors: ativo ? DarkColors : LightColors,
  }),
}));
