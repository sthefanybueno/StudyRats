/** Description: This file (src/infrastructure/repositories/__tests__/SessaoEstudoRepository.spec.ts) contains the implementation for its respective feature. */
import { InMemorySessaoEstudoRepository } from '../InMemorySessaoEstudoRepository';
import { SessaoEstudo } from '@/domain/entities/SessaoEstudo';

// A persistência real (SQLite) é coberta em SQLiteSessaoEstudoRepository.spec.ts
describe('SessaoEstudo Repositories (InMemory)', () => {
  describe('InMemorySessaoEstudoRepository', () => {
    it('deve salvar, buscar por id, listar por usuario e por disciplina', async () => {
      const repo = new InMemorySessaoEstudoRepository();
      const sessao = SessaoEstudo.create({
        usuarioId: 'usr-1',
        disciplinaId: 'disc-1',
        topicoId: 'top-1',
        duracaoMinutos: 45,
      });

      await repo.salvar(sessao);
      const achado = await repo.buscarPorId(sessao.id);
      const doUsuario = await repo.listarPorUsuario('usr-1');
      const daDisciplina = await repo.listarPorDisciplina('disc-1');

      expect(achado?.id).toBe(sessao.id);
      expect(doUsuario).toHaveLength(1);
      expect(daDisciplina).toHaveLength(1);
    });
  });
});
