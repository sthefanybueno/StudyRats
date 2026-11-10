/** Description: This file (src/application/di/container.ts) contains the implementation for its respective feature. */
import { SecureStoreUsuarioRepository } from '../../infrastructure/repositories/SecureStoreUsuarioRepository';
import { SQLiteDisciplinaRepository } from '../../infrastructure/repositories/SQLiteDisciplinaRepository';
import { SQLiteSessaoEstudoRepository } from '../../infrastructure/repositories/SQLiteSessaoEstudoRepository';
import { SQLiteSyncQueueRepository } from '../../infrastructure/repositories/SQLiteSyncQueueRepository';
import { persistirFotoLocal } from '../../infrastructure/storage/FotoStorage';
import { InMemoryResumoIARepository } from '../../infrastructure/repositories/InMemoryResumoIARepository';

// Gateways
import { SupabaseAuthGateway } from '../../infrastructure/gateways/SupabaseAuthGateway';
import { SupabaseSyncGateway } from '../../infrastructure/gateways/SupabaseSyncGateway';

import { ListarFeedUseCase } from '../use-cases/ListarFeedUseCase';
import { MockAIGateway } from '../../infrastructure/gateways/MockAIGateway';
import { ExpoCameraGateway } from '../../infrastructure/gateways/ExpoCameraGateway';
import { ExpoLocationGateway } from '../../infrastructure/gateways/ExpoLocationGateway';

// Use Cases
import { AutenticarUsuarioUseCase } from '../use-cases/AutenticarUsuarioUseCase';
import { CadastrarUsuarioUseCase } from '../use-cases/CadastrarUsuarioUseCase';
import { AtualizarPerfilUseCase } from '../use-cases/AtualizarPerfilUseCase';
import { CadastrarDisciplinaUseCase } from '../use-cases/CadastrarDisciplinaUseCase';
import { CadastrarTopicoUseCase } from '../use-cases/CadastrarTopicoUseCase';
import { AtualizarTopicoUseCase } from '../use-cases/AtualizarTopicoUseCase';
import { DeletarTopicoUseCase } from '../use-cases/DeletarTopicoUseCase';
import { GerarResumoUseCase } from '../use-cases/GerarResumoUseCase';
import { RegistrarSessaoUseCase } from '../use-cases/RegistrarSessaoUseCase';
import { ConsultarRankingUseCase } from '../use-cases/ConsultarRankingUseCase';
import { SincronizarFilaUseCase } from '../use-cases/SincronizarFilaUseCase';

import { SessionStorageSecureStore } from '../../infrastructure/storage/SessionStorageSecureStore';

// 1. Instanciar Adapters (Persistência SQLite para Sessões, Fotos, Disciplinas, Tópicos e Fila Outbox)
const usuarioRepository = new SecureStoreUsuarioRepository();
const disciplinaRepository = new SQLiteDisciplinaRepository();
const sessaoEstudoRepository = new SQLiteSessaoEstudoRepository();
const syncQueueRepository = new SQLiteSyncQueueRepository();
const resumoRepository = new InMemoryResumoIARepository();
const sessionStorage = new SessionStorageSecureStore();

const authGateway = new SupabaseAuthGateway();
const syncGateway = new SupabaseSyncGateway();

const aiGateway = new MockAIGateway();
const cameraGateway = new ExpoCameraGateway(persistirFotoLocal);
const locationGateway = new ExpoLocationGateway();

// 2. Instanciar Use Cases injetando as dependências
export const DIContainer = {
  autenticarUsuario: new AutenticarUsuarioUseCase(authGateway, usuarioRepository, sessionStorage),
  cadastrarUsuario: new CadastrarUsuarioUseCase(authGateway, usuarioRepository),
  atualizarPerfil: new AtualizarPerfilUseCase(usuarioRepository),
  logout: async () => {
    await sessionStorage.removerSessionToken();
    await authGateway.logout();
  },
  resetarDadosLocais: async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
    await AsyncStorage.clear();
    await sessionStorage.removerSessionToken();
    await authGateway.logout();
  },
  cadastrarDisciplina: new CadastrarDisciplinaUseCase(disciplinaRepository, syncQueueRepository),
  cadastrarTopico: new CadastrarTopicoUseCase(disciplinaRepository, syncQueueRepository),
  atualizarTopico: new AtualizarTopicoUseCase(disciplinaRepository, syncQueueRepository),
  deletarTopico: new DeletarTopicoUseCase(disciplinaRepository, syncQueueRepository),
  gerarResumo: new GerarResumoUseCase(aiGateway, resumoRepository),
  registrarSessao: new RegistrarSessaoUseCase(sessaoEstudoRepository, usuarioRepository, cameraGateway, locationGateway, syncQueueRepository),
  consultarRanking: new ConsultarRankingUseCase(syncGateway),
  listarFeed: new ListarFeedUseCase(sessaoEstudoRepository, usuarioRepository, disciplinaRepository),
  sincronizarFila: new SincronizarFilaUseCase(syncQueueRepository, syncGateway),

  // Gateways expostos para consumo direto pela camada de apresentação (ex.: captura de GPS na sessão)
  gateways: {
    camera: cameraGateway,
    location: locationGateway,
  },

  // Repositórios
  repositories: {
    usuario: usuarioRepository,
    disciplina: disciplinaRepository,
    sessao: sessaoEstudoRepository,
    syncQueue: syncQueueRepository,
  }
};
