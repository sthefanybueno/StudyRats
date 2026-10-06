import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import LoginScreen from '../login';
import { AuthProvider } from '@/providers/AuthProvider';
import { InMemoryUsuarioRepository } from '@/infrastructure/repositories/InMemoryUsuarioRepository';
import { MockAuthGateway } from '@/infrastructure/gateways/MockAuthGateway';
import { AutenticarUsuarioUseCase } from '@/application/use-cases/AutenticarUsuarioUseCase';
import { Usuario } from '@/domain/entities/Usuario';

describe('<LoginScreen /> (RNTL Screen Test)', () => {
  let mockContainer: any;
  let usuarioRepo: InMemoryUsuarioRepository;
  let authGateway: MockAuthGateway;

  beforeEach(() => {
    usuarioRepo = new InMemoryUsuarioRepository();
    authGateway = new MockAuthGateway(0);

    mockContainer = {
      autenticarUsuario: new AutenticarUsuarioUseCase(authGateway, usuarioRepo),
      logout: jest.fn(),
      repositories: { usuario: usuarioRepo },
    };
  });

  const renderWithAuth = async () => {
    return render(
      <AuthProvider container={mockContainer}>
        <LoginScreen />
      </AuthProvider>
    );
  };

  it('deve renderizar a tela de login com os campos desabilitados inicialmente', async () => {
    await renderWithAuth();

    expect(screen.getByText('Entrar na toca')).toBeTruthy();
    expect(screen.getByPlaceholderText('voce@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('Sua senha')).toBeTruthy();
  });

  it('deve permitir preencher as credenciais e acionar o botão entrar', async () => {
    const user = Usuario.create({ id: 'u1', email: 'aluno@estudo.com', nomeExibicao: 'Aluno' });
    await usuarioRepo.salvar(user);
    await authGateway.cadastrar('aluno@estudo.com', '123456', 'Aluno');
    (authGateway as any).usuarioAtual = null;

    await renderWithAuth();

    const inputEmail = screen.getByPlaceholderText('voce@email.com');
    const inputSenha = screen.getByPlaceholderText('Sua senha');

    await act(async () => {
      fireEvent.changeText(inputEmail, 'aluno@estudo.com');
      fireEvent.changeText(inputSenha, '123456');
    });

    const botaoEntrar = screen.getByTestId('login-entrar');

    await act(async () => {
      fireEvent.press(botaoEntrar);
    });

    await waitFor(() => {
      expect(screen.queryByText('Email ou senha incorretos')).toBeNull();
    });
  });

  it('deve exibir mensagem de erro se as credenciais forem incorretas', async () => {
    await renderWithAuth();

    const inputEmail = screen.getByPlaceholderText('voce@email.com');
    const inputSenha = screen.getByPlaceholderText('Sua senha');

    await act(async () => {
      fireEvent.changeText(inputEmail, 'errado@estudo.com');
      fireEvent.changeText(inputSenha, 'senhaerrada');
    });

    const botaoEntrar = screen.getByTestId('login-entrar');

    await act(async () => {
      fireEvent.press(botaoEntrar);
    });

    await waitFor(() => {
      expect(screen.getByText('Email ou senha incorretos')).toBeTruthy();
    });
  });
});
