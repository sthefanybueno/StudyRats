/** Description: This file (src/application/use-cases/__tests__/ListarFeedUseCase.spec.ts) contains the implementation for its respective feature. */
import { ListarFeedUseCase, LIMITE_FEED } from '../ListarFeedUseCase';
import { SessaoEstudo } from '../../../domain/entities/SessaoEstudo';
import { Usuario } from '../../../domain/entities/Usuario';
import { Disciplina } from '../../../domain/entities/Disciplina';
import { Topico } from '../../../domain/entities/Topico';
import { FotoSessao } from '../../../domain/entities/FotoSessao';
import { Coordenada } from '../../../domain/value-objects/Coordenada';
import { InMemorySessaoEstudoRepository } from '../../../infrastructure/repositories/InMemorySessaoEstudoRepository';
import { InMemoryUsuarioRepository } from '../../../infrastructure/repositories/InMemoryUsuarioRepository';
import { InMemoryDisciplinaRepository } from '../../../infrastructure/repositories/InMemoryDisciplinaRepository';

describe('ListarFeedUseCase', () => {
  let sessaoRepo: InMemorySessaoEstudoRepository;
  let usuarioRepo: InMemoryUsuarioRepository;
  let disciplinaRepo: InMemoryDisciplinaRepository;

  beforeEach(async () => {
    sessaoRepo = new InMemorySessaoEstudoRepository();
    usuarioRepo = new InMemoryUsuarioRepository();
    disciplinaRepo = new InMemoryDisciplinaRepository();

    const user = Usuario.create({
      id: 'usr-1',
      email: 'user1@teste.com',
      nomeExibicao: 'Estudante 1',
      xpTotal: 250,
    });
    await usuarioRepo.salvar(user);

    const disc = Disciplina.create({
      id: 'disc-1',
      usuarioId: 'usr-1',
      nome: 'Cálculo',
      cor: '#FF0000',
    });
    disc.adicionarTopico(Topico.create({ id: 'top-1', disciplinaId: 'disc-1', nome: 'Derivadas' }));
    await disciplinaRepo.salvar(disc);
  });

  it('lista as sessões manuais e reais salvas no repositório', async () => {
    const s1 = SessaoEstudo.create({
      id: 'sess-1',
      usuarioId: 'usr-1',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 45,
      createdAt: new Date('2026-02-01T10:00:00Z'),
    });
    await sessaoRepo.salvar(s1);

    const useCase = new ListarFeedUseCase(sessaoRepo, usuarioRepo, disciplinaRepo);
    const r = await useCase.execute();

    expect(r.isSuccess).toBe(true);
    if (r.isSuccess) {
      expect(r.value.itens).toHaveLength(1);
      expect(r.value.itens[0].id).toBe('sess-1');
      expect(r.value.itens[0].disciplina).toBe('Cálculo');
      expect(r.value.itens[0].topico).toBe('Derivadas');
      expect(r.value.itens[0].autor.nome).toBe('Estudante 1');
    }
  });

  it('ordena as sessões reais da mais recente para a mais antiga', async () => {
    const sAntiga = SessaoEstudo.create({
      id: 'sess-antiga',
      usuarioId: 'usr-1',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 30,
      createdAt: new Date('2026-01-01T10:00:00Z'),
    });
    const sNova = SessaoEstudo.create({
      id: 'sess-nova',
      usuarioId: 'usr-1',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 30,
      createdAt: new Date('2026-01-05T10:00:00Z'),
    });

    await sessaoRepo.salvar(sAntiga);
    await sessaoRepo.salvar(sNova);

    const useCase = new ListarFeedUseCase(sessaoRepo, usuarioRepo, disciplinaRepo);
    const r = await useCase.execute();

    expect(r.isSuccess).toBe(true);
    if (r.isSuccess) {
      expect(r.value.itens.map(i => i.id)).toEqual(['sess-nova', 'sess-antiga']);
    }
  });

  it('mapeia foto, coordenada GPS e syncStatus das sessões manuais', async () => {
    const s = SessaoEstudo.create({
      id: 'sess-completa',
      usuarioId: 'usr-1',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 50,
      coordenada: Coordenada.create({ latitude: -19.9191, longitude: -43.9386 }),
    });
    s.anexarFoto(FotoSessao.create({ sessaoId: 'sess-completa', uriLocal: 'file://foto.jpg' }));
    await sessaoRepo.salvar(s);

    const useCase = new ListarFeedUseCase(sessaoRepo, usuarioRepo, disciplinaRepo);
    const r = await useCase.execute();

    expect(r.isSuccess).toBe(true);
    if (r.isSuccess) {
      const item = r.value.itens[0];
      expect(item.fotoUri).toBe('file://foto.jpg');
      expect(item.latitude).toBeCloseTo(-19.9191);
      expect(item.longitude).toBeCloseTo(-43.9386);
      expect(item.syncStatus).toBe('pending');
    }
  });

  it('limita cada página ao limite configurado (50 itens)', async () => {
    expect(LIMITE_FEED).toBe(50);
    for (let i = 0; i < 55; i++) {
      const s = SessaoEstudo.create({
        id: `sess-${i}`,
        usuarioId: 'usr-1',
        disciplinaId: 'disc-1',
        topicoId: 'top-1',
        duracaoMinutos: 15,
        createdAt: new Date(2026, 0, 1, 0, i),
      });
      await sessaoRepo.salvar(s);
    }

    const useCase = new ListarFeedUseCase(sessaoRepo, usuarioRepo, disciplinaRepo);
    const r = await useCase.execute();

    expect(r.isSuccess).toBe(true);
    if (r.isSuccess) {
      expect(r.value.itens).toHaveLength(50);
      expect(r.value.proximoCursor).toBe('50');
    }
  });
});
