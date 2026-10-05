import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DIContainer } from '@/application/di/container';
import type { Usuario } from '@/domain/entities/Usuario';

interface AuthContextValue {
  usuario: Usuario | null;
  restaurando: boolean;
  /** true logo após o cadastro, até o onboarding (RF02) ser concluído. */
  precisaOnboarding: boolean;
  login: (email: string, senha: string) => Promise<string | null>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<string | null>;
  concluirOnboarding: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Adapter de UI que conecta o React aos use cases de autenticação.
 * Retorna mensagens de erro (string) em vez de lançar, para as telas exibirem.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [restaurando, setRestaurando] = useState(true);
  const [precisaOnboarding, setPrecisaOnboarding] = useState(false);

  useEffect(() => {
    DIContainer.autenticarUsuario
      .execute({ email: '', isLogin: false })
      .then(res => {
        if (res.isSuccess) setUsuario(res.value);
      })
      .finally(() => setRestaurando(false));
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const res = await DIContainer.autenticarUsuario.execute({ email: email.trim(), senha, isLogin: true });
    if (!res.isSuccess) return res.error;
    setUsuario(res.value);
    return null;
  }, []);

  const cadastrar = useCallback(async (nomeExibicao: string, email: string, senha: string) => {
    const res = await DIContainer.cadastrarUsuario.execute({ nomeExibicao, email, senha });
    if (!res.isSuccess) return res.error;
    setPrecisaOnboarding(true);
    setUsuario(res.value);
    return null;
  }, []);

  const concluirOnboarding = useCallback(() => setPrecisaOnboarding(false), []);

  const logout = useCallback(async () => {
    await DIContainer.logout();
    setUsuario(null);
    setPrecisaOnboarding(false);
  }, []);

  const value = useMemo(
    () => ({ usuario, restaurando, precisaOnboarding, login, cadastrar, concluirOnboarding, logout }),
    [usuario, restaurando, precisaOnboarding, login, cadastrar, concluirOnboarding, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
