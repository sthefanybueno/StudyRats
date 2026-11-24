/** Description: This file (src/providers/ThemeProvider.tsx) contains the implementation for its respective feature. */
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as DarkColors } from '../constants/theme';

const THEME_PREF_KEY = 'studyrats.pref.modoEscuro';

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

const defaultThemeState: ThemeState = {
  modoEscuro: true,
  setModoEscuro: () => {},
  colors: DarkColors,
};

const ThemeContext = createContext<ThemeState>(defaultThemeState);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [modoEscuro, setModoEscuroState] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') return;
    AsyncStorage.getItem(THEME_PREF_KEY)
      .then((valor) => {
        if (valor === 'false') setModoEscuroState(false);
        else if (valor === 'true') setModoEscuroState(true);
      })
      .catch(() => {});
  }, []);

  const setModoEscuro = React.useCallback((ativo: boolean) => {
    setModoEscuroState(ativo);
    AsyncStorage.setItem(THEME_PREF_KEY, String(ativo)).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      modoEscuro,
      setModoEscuro,
      colors: modoEscuro ? DarkColors : LightColors,
    }),
    [modoEscuro, setModoEscuro]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
