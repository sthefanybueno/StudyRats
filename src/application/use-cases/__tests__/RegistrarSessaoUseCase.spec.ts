/** Description: This file (src/application/use-cases/__tests__/RegistrarSessaoUseCase.spec.ts) contains the implementation for its respective feature. */
import { RegistrarSessaoUseCase } from '../RegistrarSessaoUseCase';
import { ISessaoEstudoRepository } from '../../../domain/repositories/ISessaoEstudoRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { ICameraGateway } from '../../../domain/gateways/ICameraGateway';
import { ILocationGateway, Coordenadas } from '../../../domain/gateways/ILocationGateway';
import { SessaoEstudo } from '../../../domain/entities/SessaoEstudo';
import { Usuario } from '../../../domain/entities/Usuario';

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
  async listarTodos(): Promise<Usuario[]> { return this.usuarios; }
}

class MockCameraGateway implements ICameraGateway {
  shouldCancel = false;
  chamadas = 0;
  async capturarFoto(): Promise<string | null> {
    this.chamadas++;
    if (this.shouldCancel) return null;
    return 'file:///fake/path/foto.jpg';
  }
}

class MockLocationGateway implements ILocationGateway {
  permissaoNegada = false;
  chamadas = 0;
  async obterLocalizacaoAtual(): Promise<Coordenadas> {
    this.chamadas++;
    if (this.permissaoNegada) throw new Error('Permissão de localização negada');
    return { latitude: -23.5505, longitude: -46.6333 };
  }
}

describe('RegistrarSessaoUseCase', () => {
  let sessaoRepo: MockSessaoRepository;
  let usuarioRepo: MockUsuarioRepository;
  let cameraGateway: MockCameraGateway;
  let locationGateway: MockLocationGateway;
  let useCase: RegistrarSessaoUseCase;

  beforeEach(() => {
    sessaoRepo = new MockSessaoRepository();
    usuarioRepo = new MockUsuarioRepository();
    cameraGateway = new MockCameraGateway();
    locationGateway = new MockLocationGateway();
    useCase = new RegistrarSessaoUseCase(sessaoRepo, usuarioRepo, cameraGateway, locationGateway);

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

  it('should reuse the photo already captured by the UI without opening the camera again', async () => {
    const response = await useCase.execute({
      usuarioId: 'user-123',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 20,
      comFoto: true,
      fotoUri: 'file:///ja/capturada.jpg'
    });

    expect(response.isSuccess).toBe(true);
    expect(cameraGateway.chamadas).toBe(0);
    expect(sessaoRepo.sessoes[0].foto?.uriLocal).toBe('file:///ja/capturada.jpg');
  });

  it('should capture and save the coordinate when GPS is requested', async () => {
    const response = await useCase.execute({
      usuarioId: 'user-123',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 30,
      comFoto: false,
      anexarGps: true
    });

    expect(response.isSuccess).toBe(true);
    expect(locationGateway.chamadas).toBe(1);
    expect(sessaoRepo.sessoes[0].coordenada?.latitude).toBe(-23.5505);
    expect(sessaoRepo.sessoes[0].coordenada?.longitude).toBe(-46.6333);
  });

  it('should not query the location gateway when GPS is not requested', async () => {
    await useCase.execute({
      usuarioId: 'user-123',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 30,
      comFoto: false
    });

    expect(locationGateway.chamadas).toBe(0);
    expect(sessaoRepo.sessoes[0].coordenada).toBeUndefined();
  });

  it('should still register the session without coordinate when GPS permission is denied', async () => {
    locationGateway.permissaoNegada = true;

    const response = await useCase.execute({
      usuarioId: 'user-123',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 30,
      comFoto: false,
      anexarGps: true
    });

    expect(response.isSuccess).toBe(true);
    expect(sessaoRepo.sessoes).toHaveLength(1);
    expect(sessaoRepo.sessoes[0].coordenada).toBeUndefined();
  });

  it('should save photo and coordinate together in the same session', async () => {
    await useCase.execute({
      usuarioId: 'user-123',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 25,
      comFoto: true,
      fotoUri: 'file:///foto.jpg',
      anexarGps: true
    });

    const sessao = sessaoRepo.sessoes[0];
    expect(sessao.foto?.uriLocal).toBe('file:///foto.jpg');
    expect(sessao.coordenada).toBeDefined();
  });
});
