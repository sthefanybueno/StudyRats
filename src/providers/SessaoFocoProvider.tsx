import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Disciplina } from '@/domain/entities/Disciplina';
import type { Topico } from '@/domain/entities/Topico';
import { DIContainer } from '@/application/di/container';

export interface SessaoAtiva {
  disciplina: Disciplina;
  topico: Topico | null;
  duracaoAlvoMinutos: number;
  segundosDecorridos: number;
  emExecucao: boolean;
  anexarGps: boolean;
  fotoUri: string | null;
  dataInicio: Date;
}

export const formatarTempoRegressivo = (segundosDecorridos: number, duracaoAlvoMinutos: number) => {
  const segundosTotais = duracaoAlvoMinutos * 60;
  const segundosRestantes = Math.max(0, segundosTotais - segundosDecorridos);
  const mins = Math.floor(segundosRestantes / 60);
  const secs = segundosRestantes % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface SessaoFocoContextData {
  sessaoAtiva: SessaoAtiva | null;
  iniciarSessao: (dados: {
    disciplina: Disciplina;
    topico: Topico | null;
    duracaoAlvoMinutos: number;
    anexarGps: boolean;
    fotoUri: string | null;
  }) => void;
  pausarSessao: () => void;
  retomarSessao: () => void;
  concluirSessao: (usuarioId: string) => Promise<{ isSuccess: boolean; error?: string; xpGanho?: number }>;
  cancelarSessao: () => void;
}

const SessaoFocoContext = createContext<SessaoFocoContextData>({} as SessaoFocoContextData);

interface SessaoFocoProviderProps {
  children: React.ReactNode;
  container?: typeof DIContainer;
}

export function SessaoFocoProvider({ children, container = DIContainer }: SessaoFocoProviderProps) {
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoAtiva | null>(null);

  // Timer ticker para cronômetro regressivo em tempo real
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (sessaoAtiva && sessaoAtiva.emExecucao) {
      interval = setInterval(() => {
        setSessaoAtiva(prev => {
          if (!prev || !prev.emExecucao) return prev;
          const novosSegundos = prev.segundosDecorridos + 1;
          const segundosTotais = prev.duracaoAlvoMinutos * 60;

          // Se atingiu 00:00, pausar automaticamente
          if (novosSegundos >= segundosTotais) {
            return {
              ...prev,
              segundosDecorridos: segundosTotais,
              emExecucao: false,
            };
          }

          return {
            ...prev,
            segundosDecorridos: novosSegundos,
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessaoAtiva?.emExecucao]);

  const iniciarSessao = (dados: {
    disciplina: Disciplina;
    topico: Topico | null;
    duracaoAlvoMinutos: number;
    anexarGps: boolean;
    fotoUri: string | null;
  }) => {
    setSessaoAtiva({
      disciplina: dados.disciplina,
      topico: dados.topico,
      duracaoAlvoMinutos: dados.duracaoAlvoMinutos,
      segundosDecorridos: 0,
      emExecucao: true,
      anexarGps: dados.anexarGps,
      fotoUri: dados.fotoUri,
      dataInicio: new Date(),
    });
  };

  const pausarSessao = () => {
    setSessaoAtiva(prev => (prev ? { ...prev, emExecucao: false } : null));
  };

  const retomarSessao = () => {
    setSessaoAtiva(prev => (prev ? { ...prev, emExecucao: true } : null));
  };

  const concluirSessao = async (usuarioId: string) => {
    if (!sessaoAtiva) return { isSuccess: false, error: 'Nenhuma sessão ativa' };

    const minutosCalculados = Math.max(1, Math.round(sessaoAtiva.segundosDecorridos / 60));
    const duracaoFinal = minutosCalculados > 0 ? minutosCalculados : sessaoAtiva.duracaoAlvoMinutos;

    const topicoIdFinal = sessaoAtiva.topico
      ? sessaoAtiva.topico.id
      : sessaoAtiva.disciplina.topicos[0]?.id || 'topico-generico';

    const res = await container.registrarSessao.execute({
      usuarioId,
      disciplinaId: sessaoAtiva.disciplina.id,
      topicoId: topicoIdFinal,
      duracaoMinutos: duracaoFinal,
      comFoto: !!sessaoAtiva.fotoUri,
    });

    if (res.isSuccess) {
      setSessaoAtiva(null);
      return { isSuccess: true, xpGanho: duracaoFinal };
    } else {
      return { isSuccess: false, error: res.error };
    }
  };

  const cancelarSessao = () => {
    setSessaoAtiva(null);
  };

  return (
    <SessaoFocoContext.Provider
      value={{
        sessaoAtiva,
        iniciarSessao,
        pausarSessao,
        retomarSessao,
        concluirSessao,
        cancelarSessao,
      }}>
      {children}
    </SessaoFocoContext.Provider>
  );
}

export function useSessaoFoco() {
  return useContext(SessaoFocoContext);
}
