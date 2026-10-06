import { LocalAsyncStorageDisciplinaRepository } from '../LocalAsyncStorageDisciplinaRepository';
import { InMemoryDisciplinaRepository } from '../InMemoryDisciplinaRepository';
import { Disciplina } from '@/domain/entities/Disciplina';
import { Topico } from '@/domain/entities/Topico';

describe('Disciplina Repositories (InMemory & LocalAsyncStorage)', () => {
  describe('InMemoryDisciplinaRepository', () => {
    it('deve salvar, buscar, listar por usuário e deletar disciplina', async () => {
      const repo = new InMemoryDisciplinaRepository();
      const disc = Disciplina.create({ usuarioId: 'usr-1', nome: 'História', cor: '#FFF' });
      const topico = Topico.create({ disciplinaId: disc.id, nome: 'Idade Média' });
      disc.adicionarTopico(topico);

      await repo.salvar(disc);
      const achado = await repo.buscarPorId(disc.id);
      const doUsuario = await repo.listarPorUsuario('usr-1');

      expect(achado?.nome).toBe('História');
      expect(achado?.topicos).toHaveLength(1);
      expect(doUsuario).toHaveLength(1);

      await repo.deletar(disc.id);
      const deletado = await repo.buscarPorId(disc.id);
      expect(deletado).toBeNull();
    });
  });

  describe('LocalAsyncStorageDisciplinaRepository', () => {
    it('deve persistir no AsyncStorage, buscar, listar por usuário e deletar disciplina', async () => {
      const repo = new LocalAsyncStorageDisciplinaRepository();
      const disc = Disciplina.create({ usuarioId: 'usr-2', nome: 'Geografia', cor: '#00F' });
      const topico = Topico.create({ disciplinaId: disc.id, nome: 'Relevo' });
      disc.adicionarTopico(topico);

      await repo.salvar(disc);
      const achado = await repo.buscarPorId(disc.id);
      const doUsuario = await repo.listarPorUsuario('usr-2');

      expect(achado?.nome).toBe('Geografia');
      expect(achado?.topicos).toHaveLength(1);
      expect(doUsuario.some(d => d.id === disc.id)).toBe(true);

      await repo.deletar(disc.id);
      const deletado = await repo.buscarPorId(disc.id);
      expect(deletado).toBeNull();
    });
  });
});
