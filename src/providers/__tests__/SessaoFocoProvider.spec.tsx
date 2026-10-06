import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import { formatarTempoRegressivo, SessaoFocoProvider, useSessaoFoco } from '../SessaoFocoProvider';
import { Disciplina } from '@/domain/entities/Disciplina';
import { Topico } from '@/domain/entities/Topico';

describe('SessaoFocoProvider & formatarTempoRegressivo', () => {
  let mockContainer: any;

  beforeEach(() => {
    mockContainer = {
      registrarSessao: {
        execute: jest.fn().mockResolvedValue({ isSuccess: true }),
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessaoFocoProvider container={mockContainer}>{children}</SessaoFocoProvider>
  );

  describe('formatarTempoRegressivo', () => {
    it('deve formatar 0 segundos decorridos de 25 minutos como 25:00', () => {
      expect(formatarTempoRegressivo(0, 25)).toBe('25:00');
    });

    it('deve formatar 30 segundos decorridos de 1 minuto como 00:30', () => {
      expect(formatarTempoRegressivo(30, 1)).toBe('00:30');
    });

    it('não deve retornar tempo negativo quando decorridos ultrapassarem alvo', () => {
      expect(formatarTempoRegressivo(70, 1)).toBe('00:00');
    });
  });

  describe('useSessaoFoco hook', () => {
    it('deve iniciar uma sessão de foco', async () => {
      const { result } = await renderHook(() => useSessaoFoco(), { wrapper });
      const disc = Disciplina.create({ usuarioId: 'usr-1', nome: 'Matemática', cor: '#FFF' });
      const topico = Topico.create({ disciplinaId: disc.id, nome: 'Álgebra' });

      await act(async () => {
        result.current.iniciarSessao({
          disciplina: disc,
          topico,
          duracaoAlvoMinutos: 25,
          anexarGps: false,
          fotoUri: null,
        });
      });

      expect(result.current.sessaoAtiva).not.toBeNull();
      expect(result.current.sessaoAtiva?.duracaoAlvoMinutos).toBe(25);
      expect(result.current.sessaoAtiva?.emExecucao).toBe(true);
    });

    it('deve pausar e retomar sessão', async () => {
      const { result } = await renderHook(() => useSessaoFoco(), { wrapper });
      const disc = Disciplina.create({ usuarioId: 'usr-1', nome: 'História', cor: '#FFF' });

      await act(async () => {
        result.current.iniciarSessao({
          disciplina: disc,
          topico: null,
          duracaoAlvoMinutos: 30,
          anexarGps: false,
          fotoUri: null,
        });
      });

      await act(async () => {
        result.current.pausarSessao();
      });
      expect(result.current.sessaoAtiva?.emExecucao).toBe(false);

      await act(async () => {
        result.current.retomarSessao();
      });
      expect(result.current.sessaoAtiva?.emExecucao).toBe(true);
    });

    it('deve cancelar sessão', async () => {
      const { result } = await renderHook(() => useSessaoFoco(), { wrapper });
      const disc = Disciplina.create({ usuarioId: 'usr-1', nome: 'Geografia', cor: '#FFF' });

      await act(async () => {
        result.current.iniciarSessao({
          disciplina: disc,
          topico: null,
          duracaoAlvoMinutos: 15,
          anexarGps: false,
          fotoUri: null,
        });
      });

      await act(async () => {
        result.current.cancelarSessao();
      });

      expect(result.current.sessaoAtiva).toBeNull();
    });

    it('deve concluir a sessão ativa com sucesso', async () => {
      const { result } = await renderHook(() => useSessaoFoco(), { wrapper });
      const disc = Disciplina.create({ usuarioId: 'usr-1', nome: 'Física', cor: '#FFF' });

      await act(async () => {
        result.current.iniciarSessao({
          disciplina: disc,
          topico: null,
          duracaoAlvoMinutos: 20,
          anexarGps: false,
          fotoUri: null,
        });
      });

      let res: any;
      await act(async () => {
        res = await result.current.concluirSessao('usr-1');
      });

      expect(res.isSuccess).toBe(true);
      expect(result.current.sessaoAtiva).toBeNull();
      expect(mockContainer.registrarSessao.execute).toHaveBeenCalled();
    });

    it('deve retornar erro ao concluir quando não houver sessão ativa', async () => {
      const { result } = await renderHook(() => useSessaoFoco(), { wrapper });

      let res: any;
      await act(async () => {
        res = await result.current.concluirSessao('usr-1');
      });

      expect(res.isSuccess).toBe(false);
      expect(res.error).toBe('Nenhuma sessão ativa');
    });
  });
});
