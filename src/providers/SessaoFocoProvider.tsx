/** Description: This file (src/providers/SessaoFocoProvider.tsx) contains the implementation for its respective feature. */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Disciplina } from '@/domain/entities/Disciplina';
import type { Topico } from '@/domain/entities/Topico';
import { CalculoXpService } from '@/domain/services/CalculoXpService';
import { DIContainer } from '@/application/di/container';

export interface SessaoAtiva {
  disciplina: Disciplina;
  topico: Topico | null;
  duracaoAlvoMinutos: number;
  segundosDecorridos: number;
  emExecucao: boolean;
  anexarGps: boolean;
  enderecoManual?: string | null;
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
  concluindo: boolean;
  iniciarSessao: (dados: {
    disciplina: Disciplina;
    topico: Topico | null;
    duracaoAlvoMinutos: number;
    anexarGps: boolean;
    enderecoManual?: string | null;
    fotoUri: string | null;
  }) => void;
  pausarSessao: () => void;
  retomarSessao: () => void;
  atualizarFoto: (fotoUri: string | null) => void;
  concluirSessao: (usuarioId: string) => Promise<{ isSuccess: boolean; error?: string; xpGanho?: number; avisoGps?: string }>;
  cancelarSessao: () => void;
}

const SessaoFocoContext = createContext<SessaoFocoContextData>({} as SessaoFocoContextData);

interface SessaoFocoProviderProps {
  children: React.ReactNode;
  container?: typeof DIContainer;
}

export function SessaoFocoProvider({ children, container = DIContainer }: SessaoFocoProviderProps) {
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoAtiva | null>(null);
  const [concluindo, setConcluindo] = useState(false);
  const concluindoRef = useRef(false);
  // Controle por relógio real (Date.now) para continuar contando mesmo em background / tela bloqueada
  const acumuladoSegundosRef = useRef(0);
  const retomadoEmMsRef = useRef<number | null>(null);

  const emExecucao = (sessaoAtiva?.emExecucao ?? false) && !concluindo;

  const sincronizarTempoDecorrido = useCallback(() => {
    setSessaoAtiva(prev => {
      if (!prev || !prev.emExecucao || retomadoEmMsRef.current === null) return prev;
      const segundosTotais = prev.duracaoAlvoMinutos * 60;
      const deltaSegundos = Math.max(0, Math.floor((Date.now() - retomadoEmMsRef.current) / 1000));
      const novosSegundos = Math.min(segundosTotais, acumuladoSegundosRef.current + deltaSegundos);

      if (novosSegundos >= segundosTotais) {
        acumuladoSegundosRef.current = segundosTotais;
        retomadoEmMsRef.current = null;
        return {
          ...prev,
          segundosDecorridos: segundosTotais,
          emExecucao: false,
        };
      }

      if (novosSegundos === prev.segundosDecorridos) return prev;

      return {
        ...prev,
        segundosDecorridos: novosSegundos,
      };
    });
  }, []);

  // Timer ticker + listener de AppState para atualizar imediatamente ao voltar do background
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (emExecucao) {
      sincronizarTempoDecorrido();
      interval = setInterval(sincronizarTempoDecorrido, 1000);
    }

    const appSub =
      typeof AppState?.addEventListener === 'function'
        ? AppState.addEventListener('change', nextState => {
            if (nextState === 'active' && emExecucao) {
              sincronizarTempoDecorrido();
            }
          })
        : null;

    return () => {
      if (interval) clearInterval(interval);
      appSub?.remove?.();
    };
  }, [emExecucao, sincronizarTempoDecorrido]);

  const iniciarSessao = (dados: {
    disciplina: Disciplina;
    topico: Topico | null;
    duracaoAlvoMinutos: number;
    anexarGps: boolean;
    enderecoManual?: string | null;
    fotoUri: string | null;
  }) => {
    acumuladoSegundosRef.current = 0;
    retomadoEmMsRef.current = Date.now();
    setSessaoAtiva({
      disciplina: dados.disciplina,
      topico: dados.topico,
      duracaoAlvoMinutos: dados.duracaoAlvoMinutos,
      segundosDecorridos: 0,
      emExecucao: true,
      anexarGps: dados.anexarGps,
      enderecoManual: dados.enderecoManual ?? null,
      fotoUri: dados.fotoUri,
      dataInicio: new Date(),
    });
  };

  const pausarSessao = () => {
    if (concluindoRef.current) return;
    setSessaoAtiva(prev => {
      if (!prev || !prev.emExecucao) return prev;
      const deltaSegundos =
        retomadoEmMsRef.current !== null
          ? Math.max(0, Math.floor((Date.now() - retomadoEmMsRef.current) / 1000))
          : 0;
      const segundosTotais = prev.duracaoAlvoMinutos * 60;
      const atual = Math.min(segundosTotais, acumuladoSegundosRef.current + deltaSegundos);
      acumuladoSegundosRef.current = atual;
      retomadoEmMsRef.current = null;
      return { ...prev, segundosDecorridos: atual, emExecucao: false };
    });
  };

  const retomarSessao = () => {
    if (concluindoRef.current) return;
    setSessaoAtiva(prev => {
      if (!prev || prev.emExecucao) return prev;
      const segundosTotais = prev.duracaoAlvoMinutos * 60;
      if (acumuladoSegundosRef.current >= segundosTotais) return prev;
      retomadoEmMsRef.current = Date.now();
      return { ...prev, emExecucao: true };
    });
  };

  const atualizarFoto = (fotoUri: string | null) => {
    if (concluindoRef.current) return;
    setSessaoAtiva(prev => (prev ? { ...prev, fotoUri } : null));
  };

  const concluirSessao = async (usuarioId: string) => {
    if (!sessaoAtiva) return { isSuccess: false, error: 'Nenhuma sessão ativa' };
    if (concluindoRef.current) return { isSuccess: false, error: 'Sessão já está sendo concluída' };

    concluindoRef.current = true;
    setConcluindo(true);
    try {
      const segundosTotais = sessaoAtiva.duracaoAlvoMinutos * 60;
      const deltaSegundos =
        sessaoAtiva.emExecucao && retomadoEmMsRef.current !== null
          ? Math.max(0, Math.floor((Date.now() - retomadoEmMsRef.current) / 1000))
          : 0;
      const segundosReais = Math.min(segundosTotais, acumuladoSegundosRef.current + deltaSegundos);

      const minutosCalculados = Math.max(1, Math.round(segundosReais / 60));
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
        fotoUri: sessaoAtiva.fotoUri,
        anexarGps: sessaoAtiva.anexarGps,
        enderecoManual: sessaoAtiva.enderecoManual,
      });

      if (res.isSuccess) {
        const xpGanho = res.value
          ? CalculoXpService.calcular({
              duracaoMinutos: duracaoFinal,
              comFoto: !!res.value.foto,
              comGps: !!res.value.coordenada,
            })
          : duracaoFinal;
        acumuladoSegundosRef.current = 0;
        retomadoEmMsRef.current = null;
        setSessaoAtiva(null);
        return { isSuccess: true, xpGanho, avisoGps: res.avisoGps };
      } else {
        return { isSuccess: false, error: res.error };
      }
    } finally {
      concluindoRef.current = false;
      setConcluindo(false);
    }
  };

  const cancelarSessao = () => {
    if (concluindoRef.current) return;
    acumuladoSegundosRef.current = 0;
    retomadoEmMsRef.current = null;
    setSessaoAtiva(null);
  };

  return (
    <SessaoFocoContext.Provider
      value={{
        sessaoAtiva,
        concluindo,
        iniciarSessao,
        pausarSessao,
        retomarSessao,
        atualizarFoto,
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
