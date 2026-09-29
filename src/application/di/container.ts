// Repositórios
import { InMemoryUsuarioRepository } from '../../infrastructure/repositories/InMemoryUsuarioRepository';
import { InMemoryDisciplinaRepository } from '../../infrastructure/repositories/InMemoryDisciplinaRepository';
import { InMemorySessaoEstudoRepository } from '../../infrastructure/repositories/InMemorySessaoEstudoRepository';
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
import { CadastrarDisciplinaUseCase } from '../use-cases/CadastrarDisciplinaUseCase';
import { CadastrarTopicoUseCase } from '../use-cases/CadastrarTopicoUseCase';
import { GerarResumoUseCase } from '../use-cases/GerarResumoUseCase';
import { RegistrarSessaoUseCase } from '../use-cases/RegistrarSessaoUseCase';
import { ConsultarRankingUseCase } from '../use-cases/ConsultarRankingUseCase';
import { SincronizarFilaUseCase } from '../use-cases/SincronizarFilaUseCase';

// 1. Instanciar Adapters (Singletons)
const usuarioRepository = new InMemoryUsuarioRepository();
const disciplinaRepository = new InMemoryDisciplinaRepository();
const sessaoEstudoRepository = new InMemorySessaoEstudoRepository();
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
  cadastrarDisciplina: new CadastrarDisciplinaUseCase(disciplinaRepository),
  cadastrarTopico: new CadastrarTopicoUseCase(disciplinaRepository),
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
