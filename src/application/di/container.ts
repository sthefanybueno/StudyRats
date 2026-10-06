import { LocalAsyncStorageUsuarioRepository } from '../../infrastructure/repositories/LocalAsyncStorageUsuarioRepository';
import { LocalAsyncStorageDisciplinaRepository } from '../../infrastructure/repositories/LocalAsyncStorageDisciplinaRepository';
import { LocalAsyncStorageSessaoEstudoRepository } from '../../infrastructure/repositories/LocalAsyncStorageSessaoEstudoRepository';
import { InMemoryResumoIARepository } from '../../infrastructure/repositories/InMemoryResumoIARepository';
import { InMemorySyncQueueRepository } from '../../infrastructure/repositories/InMemorySyncQueueRepository';

// Gateways
import { MockAuthGateway } from '../../infrastructure/gateways/MockAuthGateway';
import { MockSyncGateway } from '../../infrastructure/gateways/MockSyncGateway';
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

// 1. Instanciar Adapters (Singletons com armazenamento local persistente em AsyncStorage)
const usuarioRepository = new LocalAsyncStorageUsuarioRepository();
const disciplinaRepository = new LocalAsyncStorageDisciplinaRepository();
const sessaoEstudoRepository = new LocalAsyncStorageSessaoEstudoRepository();
const resumoRepository = new InMemoryResumoIARepository();
const syncQueueRepository = new InMemorySyncQueueRepository();

const authGateway = new MockAuthGateway();
const syncGateway = new MockSyncGateway();
const aiGateway = new MockAIGateway();
const cameraGateway = new ExpoCameraGateway();
const locationGateway = new ExpoLocationGateway();

// 2. Instanciar Use Cases injetando as dependências
export const DIContainer = {
  autenticarUsuario: new AutenticarUsuarioUseCase(authGateway, usuarioRepository),
  cadastrarUsuario: new CadastrarUsuarioUseCase(authGateway, usuarioRepository),
  atualizarPerfil: new AtualizarPerfilUseCase(usuarioRepository),
  logout: () => authGateway.logout(),
  cadastrarDisciplina: new CadastrarDisciplinaUseCase(disciplinaRepository),
  cadastrarTopico: new CadastrarTopicoUseCase(disciplinaRepository),
  atualizarTopico: new AtualizarTopicoUseCase(disciplinaRepository),
  deletarTopico: new DeletarTopicoUseCase(disciplinaRepository),
  gerarResumo: new GerarResumoUseCase(aiGateway, resumoRepository),
  registrarSessao: new RegistrarSessaoUseCase(sessaoEstudoRepository, usuarioRepository, cameraGateway), // Passar os Gateways reais
  consultarRanking: new ConsultarRankingUseCase(syncGateway),
  sincronizarFila: new SincronizarFilaUseCase(syncQueueRepository, syncGateway),

  // Expondo repositórios apenas para uso temporário nos Hooks (até termos Stores globais como Zustand)
  repositories: {
    usuario: usuarioRepository,
    disciplina: disciplinaRepository,
    sessao: sessaoEstudoRepository,
  }
};
