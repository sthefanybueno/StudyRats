import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { AuthProvider, useAuth } from '../AuthProvider';
import { InMemoryUsuarioRepository } from '@/infrastructure/repositories/InMemoryUsuarioRepository';
import { MockAuthGateway } from '@/infrastructure/gateways/MockAuthGateway';
import { AutenticarUsuarioUseCase } from '@/application/use-cases/AutenticarUsuarioUseCase';
import { CadastrarUsuarioUseCase } from '@/application/use-cases/CadastrarUsuarioUseCase';
import { AtualizarPerfilUseCase } from '@/application/use-cases/AtualizarPerfilUseCase';
import { Usuario } from '@/domain/entities/Usuario';

describe('AuthProvider & useAuth', () => {
  let mockContainer: any;
  let usuarioRepo: InMemoryUsuarioRepository;
  let authGateway: MockAuthGateway;

  beforeEach(() => {
    usuarioRepo = new InMemoryUsuarioRepository();
    authGateway = new MockAuthGateway(0); // 0ms delay for fast unit tests

    mockContainer = {
      autenticarUsuario: new AutenticarUsuarioUseCase(authGateway, usuarioRepo),
      cadastrarUsuario: new CadastrarUsuarioUseCase(authGateway, usuarioRepo),
      atualizarPerfil: new AtualizarPerfilUseCase(usuarioRepo),
      logout: jest.fn().mockImplementation(async () => {
        await authGateway.logout();
      }),
      repositories: {
        usuario: usuarioRepo,
      },
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider container={mockContainer}>{children}</AuthProvider>
  );

  it('deve lançar erro se useAuth for usado fora de AuthProvider', async () => {
    await expect(renderHook(() => useAuth())).rejects.toThrow('useAuth deve ser usado dentro de <AuthProvider>');
  });

  it('deve iniciar restaurando e finalizar sem usuário se a sessão não existir', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.restaurando).toBe(false));

    expect(result.current.usuario).toBeNull();
    expect(result.current.precisaOnboarding).toBe(false);
  });

  it('deve restaurar a sessão se o gateway já tiver sessão', async () => {
    const user = Usuario.create({
      id: 'usr-1',
      nomeExibicao: 'Estudante Teste',
      email: 'teste@estudo.com',
    });
    await usuarioRepo.salvar(user);
    (authGateway as any).usuarioAtual = user;

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.restaurando).toBe(false));

    expect(result.current.usuario?.id).toBe('usr-1');
  });

  it('deve realizar login com sucesso', async () => {
    const user = Usuario.create({
      id: 'usr-1',
      nomeExibicao: 'Estudante Teste',
      email: 'teste@estudo.com',
    });
    await usuarioRepo.salvar(user);
    await authGateway.cadastrar('teste@estudo.com', '123456', 'Estudante Teste');
    (authGateway as any).usuarioAtual = null;

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.restaurando).toBe(false));

    let err: string | null = null;
    await act(async () => {
      err = await result.current.login('teste@estudo.com', '123456');
    });

    expect(err).toBeNull();
    expect(result.current.usuario?.email.getValue).toBe('teste@estudo.com');
  });

  it('deve retornar erro no login com credenciais incorretas', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.restaurando).toBe(false));

    let err: string | null = null;
    await act(async () => {
      err = await result.current.login('inexistente@estudo.com', '123456');
    });

    expect(err).toBe('Email ou senha incorretos');
    expect(result.current.usuario).toBeNull();
  });

  it('deve cadastrar usuário e marcar precisaOnboarding como true', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.restaurando).toBe(false));

    let err: string | null = null;
    await act(async () => {
      err = await result.current.cadastrar('Novo Aluno', 'novo@estudo.com', '123456');
    });

    expect(err).toBeNull();
    expect(result.current.usuario?.nomeExibicao).toBe('Novo Aluno');
    expect(result.current.precisaOnboarding).toBe(true);

    await act(async () => {
      result.current.concluirOnboarding();
    });

    expect(result.current.precisaOnboarding).toBe(false);
  });

  it('deve atualizar o perfil do usuario logado', async () => {
    const user = Usuario.create({
      id: 'usr-1',
      nomeExibicao: 'Nome Antigo',
      email: 'teste@estudo.com',
    });
    await usuarioRepo.salvar(user);
    (authGateway as any).usuarioAtual = user;

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.restaurando).toBe(false));
    expect(result.current.usuario?.id).toBe('usr-1');

    await act(async () => {
      await result.current.atualizarPerfil({ nomeExibicao: 'Nome Novo' });
    });

    expect(result.current.usuario?.nomeExibicao).toBe('Nome Novo');
  });

  it('deve realizar logout', async () => {
    const user = Usuario.create({
      id: 'usr-1',
      nomeExibicao: 'Estudante Teste',
      email: 'teste@estudo.com',
    });
    await usuarioRepo.salvar(user);
    (authGateway as any).usuarioAtual = user;

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.restaurando).toBe(false));
    expect(result.current.usuario?.id).toBe('usr-1');

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.usuario).toBeNull();
    expect(mockContainer.logout).toHaveBeenCalled();
  });
});
