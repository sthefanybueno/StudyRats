import { act, renderHook } from '@testing-library/react-native';

import { useAtividades } from '../useAtividades';
import { InMemoryDisciplinaRepository } from '@/infrastructure/repositories/InMemoryDisciplinaRepository';
import { CadastrarDisciplinaUseCase } from '@/application/use-cases/CadastrarDisciplinaUseCase';
import { CadastrarTopicoUseCase } from '@/application/use-cases/CadastrarTopicoUseCase';
import { RegistrarSessaoUseCase } from '@/application/use-cases/RegistrarSessaoUseCase';
import { InMemorySessaoEstudoRepository } from '@/infrastructure/repositories/InMemorySessaoEstudoRepository';
import { InMemoryUsuarioRepository } from '@/infrastructure/repositories/InMemoryUsuarioRepository';
import { Usuario } from '@/domain/entities/Usuario';
import { Disciplina } from '@/domain/entities/Disciplina';
import { Topico } from '@/domain/entities/Topico';

describe('useAtividades hook', () => {
  let mockContainer: any;
  let disciplinaRepo: InMemoryDisciplinaRepository;
  let sessaoRepo: InMemorySessaoEstudoRepository;
  let usuarioRepo: InMemoryUsuarioRepository;

  beforeEach(() => {
    disciplinaRepo = new InMemoryDisciplinaRepository();
    sessaoRepo = new InMemorySessaoEstudoRepository();
    usuarioRepo = new InMemoryUsuarioRepository();

    mockContainer = {
      cadastrarDisciplina: new CadastrarDisciplinaUseCase(disciplinaRepo),
      cadastrarTopico: new CadastrarTopicoUseCase(disciplinaRepo),
      registrarSessao: new RegistrarSessaoUseCase(
        sessaoRepo,
        usuarioRepo,
        { tirarFoto: jest.fn().mockResolvedValue('http://foto.jpg') } as any
      ),
      repositories: {
        disciplina: disciplinaRepo,
      },
    };
  });

  it('deve carregar disciplinas do usuário', async () => {
    const disc = Disciplina.create({ usuarioId: 'usr-1', nome: 'Matemática', cor: '#FF0000' });
    await disciplinaRepo.salvar(disc);

    const { result } = await renderHook(() => useAtividades('usr-1', mockContainer));

    await act(async () => {
      await result.current.carregarDisciplinas();
    });

    expect(result.current.disciplinas).toHaveLength(1);
    expect(result.current.disciplinas[0].nome).toBe('Matemática');
  });

  it('deve cadastrar uma disciplina e atualizar a lista', async () => {
    const { result } = await renderHook(() => useAtividades('usr-1', mockContainer));

    await act(async () => {
      await result.current.cadastrarDisciplina('Física', '#00FF00');
    });

    expect(result.current.disciplinas).toHaveLength(1);
    expect(result.current.disciplinas[0].nome).toBe('Física');
  });

  it('deve cadastrar um tópico na disciplina', async () => {
    const disc = Disciplina.create({ usuarioId: 'usr-1', nome: 'Química', cor: '#0000FF' });
    await disciplinaRepo.salvar(disc);

    const { result } = await renderHook(() => useAtividades('usr-1', mockContainer));

    await act(async () => {
      await result.current.cadastrarTopico(disc.id, 'Termoquímica');
    });

    expect(result.current.disciplinas[0].topicos).toHaveLength(1);
    expect(result.current.disciplinas[0].topicos[0].nome).toBe('Termoquímica');
  });

  it('deve registrar uma sessão de estudo', async () => {
    const user = Usuario.create({ id: 'usr-1', nomeExibicao: 'Estudante', email: 'e@e.com' });
    await usuarioRepo.salvar(user);
    const disc = Disciplina.create({ usuarioId: 'usr-1', nome: 'História', cor: '#FFFF00' });
    const topico = Topico.create({ disciplinaId: disc.id, nome: 'Brasil Colônia' });
    disc.adicionarTopico(topico);
    await disciplinaRepo.salvar(disc);
    const topicoId = disc.topicos[0].id;

    const { result } = await renderHook(() => useAtividades('usr-1', mockContainer));

    let res: any;
    await act(async () => {
      res = await result.current.registrarSessao(disc.id, topicoId, 50, false);
    });

    expect(res.isSuccess).toBe(true);
  });
});
