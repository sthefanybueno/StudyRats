/** Description: This file (src/application/di/container.ts) contains the implementation for its respective feature. */
import { SecureStoreUsuarioRepository } from '../../infrastructure/repositories/SecureStoreUsuarioRepository';
import { SQLiteDisciplinaRepository } from '../../infrastructure/repositories/SQLiteDisciplinaRepository';
import { SQLiteSessaoEstudoRepository } from '../../infrastructure/repositories/SQLiteSessaoEstudoRepository';
import { SQLiteSyncQueueRepository } from '../../infrastructure/repositories/SQLiteSyncQueueRepository';
import { persistirFotoLocal } from '../../infrastructure/storage/FotoStorage';
import { subscribeTableChanges, type TabelaLocal } from '../../infrastructure/database/schema';
import { InMemoryResumoIARepository } from '../../infrastructure/repositories/InMemoryResumoIARepository';

// Gateways
import { SupabaseAuthGateway } from '../../infrastructure/gateways/SupabaseAuthGateway';
import { SupabaseSyncGateway } from '../../infrastructure/gateways/SupabaseSyncGateway';
import { SupabaseFeedGateway } from '../../infrastructure/gateways/SupabaseFeedGateway';

import { ListarFeedUseCase } from '../use-cases/ListarFeedUseCase';
import { MockAIGateway } from '../../infrastructure/gateways/MockAIGateway';
import { ExpoCameraGateway } from '../../infrastructure/gateways/ExpoCameraGateway';
import { ExpoLocationGateway } from '../../infrastructure/gateways/ExpoLocationGateway';
import { ExpoNotificationGateway } from '../../infrastructure/gateways/ExpoNotificationGateway';

// Use Cases
import { AutenticarUsuarioUseCase } from '../use-cases/AutenticarUsuarioUseCase';
import { CadastrarUsuarioUseCase } from '../use-cases/CadastrarUsuarioUseCase';
import { AtualizarPerfilUseCase } from '../use-cases/AtualizarPerfilUseCase';
import { CadastrarDisciplinaUseCase } from '../use-cases/CadastrarDisciplinaUseCase';
import { DeletarDisciplinaUseCase } from '../use-cases/DeletarDisciplinaUseCase';
import { ListarDisciplinasUseCase } from '../use-cases/ListarDisciplinasUseCase';
import { CadastrarTopicoUseCase } from '../use-cases/CadastrarTopicoUseCase';
import { AtualizarTopicoUseCase } from '../use-cases/AtualizarTopicoUseCase';
import { DeletarTopicoUseCase } from '../use-cases/DeletarTopicoUseCase';
import { GerarResumoUseCase } from '../use-cases/GerarResumoUseCase';
import { RegistrarSessaoUseCase } from '../use-cases/RegistrarSessaoUseCase';
import { ListarSessoesUsuarioUseCase } from '../use-cases/ListarSessoesUsuarioUseCase';
import { ObterEstatisticasPerfilUseCase } from '../use-cases/ObterEstatisticasPerfilUseCase';
import { CapturarEvidenciaFotoUseCase } from '../use-cases/CapturarEvidenciaFotoUseCase';
import { DiagnosticarLocalizacaoUseCase } from '../use-cases/DiagnosticarLocalizacaoUseCase';
import { ConsultarRankingUseCase } from '../use-cases/ConsultarRankingUseCase';
import { SincronizarFilaUseCase } from '../use-cases/SincronizarFilaUseCase';
import { LimparHistoricoLocalizacaoUseCase } from '../use-cases/LimparHistoricoLocalizacaoUseCase';

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
const feedGateway = new SupabaseFeedGateway();

const aiGateway = new MockAIGateway();
const cameraGateway = new ExpoCameraGateway(persistirFotoLocal);
const locationGateway = new ExpoLocationGateway();
const notificationGateway = new ExpoNotificationGateway();

// 2. Instanciar Use Cases injetando as dependências
export const DIContainer = {
  autenticarUsuario: new AutenticarUsuarioUseCase(authGateway, usuarioRepository, sessionStorage),
  cadastrarUsuario: new CadastrarUsuarioUseCase(authGateway, usuarioRepository, sessionStorage, syncQueueRepository),
  atualizarPerfil: new AtualizarPerfilUseCase(usuarioRepository, syncQueueRepository),
  logout: async () => {
    await sessionStorage.removerSessionToken();
    await authGateway.logout();
  },
  resetarDadosLocais: async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
    await sessaoEstudoRepository.limparTudo();
    await AsyncStorage.clear();
    await sessionStorage.removerSessionToken();
    await authGateway.logout();
  },
  limparHistoricoLocalizacao: new LimparHistoricoLocalizacaoUseCase(sessaoEstudoRepository, syncQueueRepository, usuarioRepository, syncGateway),
  cadastrarDisciplina: new CadastrarDisciplinaUseCase(disciplinaRepository, syncQueueRepository),
  deletarDisciplina: new DeletarDisciplinaUseCase(disciplinaRepository, syncQueueRepository),
  listarDisciplinas: new ListarDisciplinasUseCase(disciplinaRepository),
  cadastrarTopico: new CadastrarTopicoUseCase(disciplinaRepository, syncQueueRepository),
  atualizarTopico: new AtualizarTopicoUseCase(disciplinaRepository, syncQueueRepository),
  deletarTopico: new DeletarTopicoUseCase(disciplinaRepository, syncQueueRepository),
  gerarResumo: new GerarResumoUseCase(aiGateway, resumoRepository),
  registrarSessao: new RegistrarSessaoUseCase(sessaoEstudoRepository, usuarioRepository, cameraGateway, locationGateway, syncQueueRepository),
  listarSessoesUsuario: new ListarSessoesUsuarioUseCase(sessaoEstudoRepository),
  obterEstatisticasPerfil: new ObterEstatisticasPerfilUseCase(sessaoEstudoRepository, usuarioRepository, syncQueueRepository, syncGateway),
  capturarEvidenciaFoto: new CapturarEvidenciaFotoUseCase(cameraGateway),
  diagnosticarLocalizacao: new DiagnosticarLocalizacaoUseCase(locationGateway),
  consultarRanking: new ConsultarRankingUseCase(syncGateway, usuarioRepository),
  listarFeed: new ListarFeedUseCase(sessaoEstudoRepository, usuarioRepository, disciplinaRepository, feedGateway, locationGateway),
  sincronizarFila: new SincronizarFilaUseCase(syncQueueRepository, syncGateway, sessaoEstudoRepository, usuarioRepository, disciplinaRepository),
  buscarUsuarioPorId: (id: string) => usuarioRepository.buscarPorId(id),
  escutarMudancasAuth: (callback: (evento: string, usuario: any) => void) =>
    authGateway.onAuthStateChange(callback),
  resetarFalhasSincronizacao: () => syncQueueRepository.resetarFalhas(),
  inscreverMudancasTabela: (tabelas: TabelaLocal[], callback: () => void) => subscribeTableChanges(tabelas, callback),
  agendarLembreteStreak: (streakAtual: number) =>
    notificationGateway.agendarLembreteDiarioStreak({ streakAtual }),
  cancelarLembreteStreak: () => notificationGateway.cancelarLembreteDiarioStreak(),

  // Gateways expostos para consumo direto pela camada de apresentação (ex.: captura de GPS na sessão e eventos de Auth)
  gateways: {
    auth: authGateway,
    camera: cameraGateway,
    location: locationGateway,
    notifications: notificationGateway,
    sync: syncGateway,
  },

  // Repositórios
  repositories: {
    usuario: usuarioRepository,
    disciplina: disciplinaRepository,
    sessao: sessaoEstudoRepository,
    syncQueue: syncQueueRepository,
  }
};

// Dispara sincronização em background imediatamente ao enfileirar qualquer item na Outbox (online-first + fallback periódico)
syncQueueRepository.definirCallbackAoEnfileirar(() => {
  if (process.env.NODE_ENV === 'test') return;
  void DIContainer.sincronizarFila.execute().catch(() => {});
});
