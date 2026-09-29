import { RegistrarSessaoUseCase } from './RegistrarSessaoUseCase';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ICameraGateway } from '../../domain/gateways/ICameraGateway';
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { Usuario } from '../../domain/entities/Usuario';

class MockSessaoRepository implements ISessaoEstudoRepository {
  sessoes: SessaoEstudo[] = [];
  async salvar(sessao: SessaoEstudo): Promise<void> { this.sessoes.push(sessao); }
  async buscarPorId(id: string): Promise<SessaoEstudo | null> { return this.sessoes.find(s => s.id === id) || null; }
  async listarPorUsuario(id: string): Promise<SessaoEstudo[]> { return this.sessoes; }
  async listarPorDisciplina(id: string): Promise<SessaoEstudo[]> { return this.sessoes; }
}

class MockUsuarioRepository implements IUsuarioRepository {
  usuarios: Usuario[] = [];
  async salvar(usuario: Usuario): Promise<void> {
    const index = this.usuarios.findIndex(u => u.id === usuario.id);
    if (index >= 0) this.usuarios[index] = usuario;
    else this.usuarios.push(usuario);
  }
  async buscarPorId(id: string): Promise<Usuario | null> { return this.usuarios.find(u => u.id === id) || null; }
}

class MockCameraGateway implements ICameraGateway {
  shouldCancel = false;
  async capturarFoto(): Promise<string | null> {
    if (this.shouldCancel) return null;
    return 'file:///fake/path/foto.jpg';
  }
}

describe('RegistrarSessaoUseCase', () => {
  let sessaoRepo: MockSessaoRepository;
  let usuarioRepo: MockUsuarioRepository;
  let cameraGateway: MockCameraGateway;
  let useCase: RegistrarSessaoUseCase;

  beforeEach(() => {
    sessaoRepo = new MockSessaoRepository();
    usuarioRepo = new MockUsuarioRepository();
    cameraGateway = new MockCameraGateway();
    useCase = new RegistrarSessaoUseCase(sessaoRepo, usuarioRepo, cameraGateway);

    // Setup initial user
    usuarioRepo.usuarios.push(Usuario.create({
      id: 'user-123',
      email: 'teste@test.com',
      nomeExibicao: 'Tester',
      xpTotal: 0
    }));
  });

  it('should register a session without photo and add XP', async () => {
    const response = await useCase.execute({
      usuarioId: 'user-123',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 30,
      comFoto: false
    });

    expect(response.isSuccess).toBe(true);
    expect(sessaoRepo.sessoes).toHaveLength(1);
    expect(sessaoRepo.sessoes[0].foto).toBeUndefined();
    
    // XP check (30 minutes = 30 XP)
    const usuario = await usuarioRepo.buscarPorId('user-123');
    expect(usuario?.xpTotal).toBe(30);
  });

  it('should register a session with photo', async () => {
    const response = await useCase.execute({
      usuarioId: 'user-123',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 45,
      comFoto: true
    });

    expect(response.isSuccess).toBe(true);
    expect(sessaoRepo.sessoes[0].foto).toBeDefined();
    expect(sessaoRepo.sessoes[0].foto?.uriLocal).toBe('file:///fake/path/foto.jpg');
  });

  it('should return error if user does not exist', async () => {
    const response = await useCase.execute({
      usuarioId: 'user-inexistente',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 30,
      comFoto: false
    });

    expect(response.isSuccess).toBe(false);
    if (!response.isSuccess) {
      expect(response.error).toBe('Usuário não encontrado');
    }
  });
});
