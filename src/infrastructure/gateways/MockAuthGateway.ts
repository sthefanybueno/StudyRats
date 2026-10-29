/** Description: This file (src/infrastructure/gateways/MockAuthGateway.ts) contains the implementation for its respective feature. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IAuthGateway } from '../../domain/gateways/IAuthGateway';
import { Usuario } from '../../domain/entities/Usuario';

interface ContaArmazenada {
  id: string;
  email: string;
  nomeExibicao: string;
  senha: string;
  xpTotal?: number;
  xpSemanal?: number;
  streakAtual?: number;
}

const STORAGE_KEY_CONTAS = 'studyrats.auth_contas';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Adaptador de Autenticação Offline-first (persistido em AsyncStorage).
 * Permite cadastro e login persistentes no dispositivo mesmo sem conexão externa.
 */
export class MockAuthGateway implements IAuthGateway {
  private usuarioAtual: Usuario | null = null;

  constructor(private readonly delayMs: number = 0) {}

  private async carregarContas(): Promise<Record<string, ContaArmazenada>> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CONTAS);
      const map: Record<string, ContaArmazenada> = raw ? JSON.parse(raw) : {};
      
      // Conta demo padrão sempre disponível
      if (!map['demo@studyrats.app']) {
        map['demo@studyrats.app'] = {
          id: 'mock-demo',
          email: 'demo@studyrats.app',
          nomeExibicao: 'Rato Demo',
          senha: '123456',
        };
      }
      return map;
    } catch {
      return {
        'demo@studyrats.app': {
          id: 'mock-demo',
          email: 'demo@studyrats.app',
          nomeExibicao: 'Rato Demo',
          senha: '123456',
        },
      };
    }
  }

  private async salvarContas(map: Record<string, ContaArmazenada>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY_CONTAS, JSON.stringify(map));
  }

  async obterUsuarioLogado(): Promise<Usuario | null> {
    return this.usuarioAtual;
  }

  async login(email: string, senha: string): Promise<Usuario> {
    if (this.delayMs > 0) await delay(this.delayMs);
    const contas = await this.carregarContas();
    const chave = email.trim().toLowerCase();
    const conta = contas[chave];

    if (!conta || conta.senha !== senha) {
      throw new Error('Email ou senha incorretos');
    }

    const usuario = Usuario.create({
      id: conta.id,
      email: conta.email,
      nomeExibicao: conta.nomeExibicao,
      xpTotal: conta.xpTotal || 0,
      xpSemanal: conta.xpSemanal || 0,
      streakAtual: conta.streakAtual || 0,
    });

    this.usuarioAtual = usuario;
    return usuario;
  }

  async cadastrar(email: string, senha: string, nomeExibicao: string): Promise<Usuario> {
    if (this.delayMs > 0) await delay(this.delayMs);
    const contas = await this.carregarContas();
    const chave = email.trim().toLowerCase();

    if (contas[chave]) {
      throw new Error('Este email já está em uso');
    }

    const novoId = 'user-' + Date.now();
    const usuario = Usuario.create({ id: novoId, email: email.trim(), nomeExibicao: nomeExibicao.trim() });

    contas[chave] = {
      id: novoId,
      email: email.trim(),
      nomeExibicao: nomeExibicao.trim(),
      senha,
    };

    await this.salvarContas(contas);
    this.usuarioAtual = usuario;
    return usuario;
  }

  async logout(): Promise<void> {
    this.usuarioAtual = null;
  }
}
