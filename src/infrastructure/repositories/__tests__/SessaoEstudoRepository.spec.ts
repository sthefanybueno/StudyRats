/** Description: This file (src/infrastructure/repositories/__tests__/SessaoEstudoRepository.spec.ts) contains the implementation for its respective feature. */
import { SecureStoreSessaoEstudoRepository } from '../SecureStoreSessaoEstudoRepository';
import { InMemorySessaoEstudoRepository } from '../InMemorySessaoEstudoRepository';
import { SessaoEstudo } from '@/domain/entities/SessaoEstudo';

describe('SessaoEstudo Repositories (InMemory & SecureStore)', () => {
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

  describe('SecureStoreSessaoEstudoRepository', () => {
    it('deve persistir no SecureStore, buscar e listar por usuario e disciplina', async () => {
      const repo = new SecureStoreSessaoEstudoRepository();
      const sessao = SessaoEstudo.create({
        usuarioId: 'usr-2',
        disciplinaId: 'disc-2',
        topicoId: 'top-2',
        duracaoMinutos: 60,
      });

      await repo.salvar(sessao);
      const achado = await repo.buscarPorId(sessao.id);
      const doUsuario = await repo.listarPorUsuario('usr-2');
      const daDisciplina = await repo.listarPorDisciplina('disc-2');

      expect(achado?.id).toBe(sessao.id);
      expect(doUsuario.some(s => s.id === sessao.id)).toBe(true);
      expect(daDisciplina.some(s => s.id === sessao.id)).toBe(true);
    });
  });
});
