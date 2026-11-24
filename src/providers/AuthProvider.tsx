/** Description: This file (src/providers/AuthProvider.tsx) contains the implementation for its respective feature. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DIContainer } from '@/application/di/container';
import type { Usuario } from '@/domain/entities/Usuario';

export interface AtualizarPerfilPayload {
  nomeExibicao?: string;
  nomeUsuario?: string;
  fotoUrl?: string;
  metaDiariaMinutos?: number;
}

interface AuthContextValue {
  usuario: Usuario | null;
  restaurando: boolean;
  /** true logo após o cadastro, até o onboarding (RF02) ser concluído. */
  precisaOnboarding: boolean;
  login: (email: string, senha: string) => Promise<string | null>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<string | null>;
  atualizarPerfil: (payload: AtualizarPerfilPayload) => Promise<string | null>;
  /** Relê o usuário do repositório local (ex.: após ganhar XP numa sessão) e atualiza a UI. */
  recarregarUsuario: () => Promise<void>;
  concluirOnboarding: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Adapter de UI que conecta o React aos use cases de autenticação.
 * Retorna mensagens de erro (string) em vez de lançar, para as telas exibirem.
 */
interface AuthProviderProps {
  children: ReactNode;
  container?: typeof DIContainer;
}

/**
 * Adapter de UI que conecta o React aos use cases de autenticação.
 * Retorna mensagens de erro (string) em vez de lançar, para as telas exibirem.
 */
export function AuthProvider({ children, container = DIContainer }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [restaurando, setRestaurando] = useState(true);
  const [precisaOnboarding, setPrecisaOnboarding] = useState(false);

  useEffect(() => {
    container.autenticarUsuario
      .execute({ email: '', isLogin: false })
      .then(res => {
        if (res.isSuccess) setUsuario(res.value);
      })
      .finally(() => setRestaurando(false));

    // Escuta mudanças de sessão (SIGNED_OUT, TOKEN_REFRESHED - PDF 03, slides 14 e 43)
    const escutarAuth = container.escutarMudancasAuth ?? ((cb: any) => container.gateways?.auth?.onAuthStateChange?.(cb));
    const sub = escutarAuth((evento, usuarioSessao) => {
      if (evento === 'SIGNED_OUT') {
        setUsuario(null);
        setPrecisaOnboarding(false);
      } else if (evento === 'SIGNED_IN' && usuarioSessao) {
        setUsuario(atual => atual ?? usuarioSessao);
      }
    });

    return () => {
      sub?.unsubscribe();
    };
  }, [container]);

  const login = useCallback(async (email: string, senha: string) => {
    const res = await container.autenticarUsuario.execute({ email: email.trim(), senha, isLogin: true });
    if (!res.isSuccess) return res.error;
    setUsuario(res.value);
    return null;
  }, [container]);

  const cadastrar = useCallback(async (nomeExibicao: string, email: string, senha: string) => {
    const res = await container.cadastrarUsuario.execute({ nomeExibicao, email, senha });
    if (!res.isSuccess) return res.error;
    setPrecisaOnboarding(true);
    setUsuario(res.value);
    return null;
  }, [container]);

  const atualizarPerfil = useCallback(async (payload: AtualizarPerfilPayload) => {
    if (!usuario) return 'Usuário não autenticado';
    const res = await container.atualizarPerfil.execute({ usuarioId: usuario.id, ...payload });
    if (!res.isSuccess) return res.error;
    const atualizado = container.buscarUsuarioPorId
      ? await container.buscarUsuarioPorId(usuario.id)
      : await container.repositories.usuario.buscarPorId(usuario.id);
    if (atualizado) setUsuario(atualizado);
    return null;
  }, [usuario, container]);

  const recarregarUsuario = useCallback(async () => {
    if (!usuario) return;
    const atualizado = container.buscarUsuarioPorId
      ? await container.buscarUsuarioPorId(usuario.id)
      : await container.repositories.usuario.buscarPorId(usuario.id);
    if (atualizado) setUsuario(atualizado);
  }, [usuario, container]);

  const concluirOnboarding = useCallback(() => setPrecisaOnboarding(false), []);

  const logout = useCallback(async () => {
    await container.logout();
    setUsuario(null);
    setPrecisaOnboarding(false);
  }, [container]);

  const value = useMemo(
    () => ({ usuario, restaurando, precisaOnboarding, login, cadastrar, atualizarPerfil, recarregarUsuario, concluirOnboarding, logout }),
    [usuario, restaurando, precisaOnboarding, login, cadastrar, atualizarPerfil, recarregarUsuario, concluirOnboarding, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
