import { LocalAsyncStorageUsuarioRepository } from '../LocalAsyncStorageUsuarioRepository';
import { InMemoryUsuarioRepository } from '../InMemoryUsuarioRepository';
import { Usuario } from '@/domain/entities/Usuario';

describe('Usuario Repositories (InMemory & LocalAsyncStorage)', () => {
  describe('InMemoryUsuarioRepository', () => {
    it('deve salvar, buscar por id e listar todos os usuários', async () => {
      const repo = new InMemoryUsuarioRepository();
      const user = Usuario.create({ id: 'usr-1', nomeExibicao: 'Estudante 1', email: 'e1@e.com' });

      await repo.salvar(user);
      const achado = await repo.buscarPorId('usr-1');
      const inexistente = await repo.buscarPorId('usr-invalid');
      const todos = await repo.listarTodos();

      expect(achado?.id).toBe('usr-1');
      expect(inexistente).toBeNull();
      expect(todos).toHaveLength(1);
    });
  });

  describe('LocalAsyncStorageUsuarioRepository', () => {
    it('deve persistir no AsyncStorage, buscar e listar usuários', async () => {
      const repo = new LocalAsyncStorageUsuarioRepository();
      const user = Usuario.create({ id: 'usr-2', nomeExibicao: 'Estudante 2', email: 'e2@e.com' });

      await repo.salvar(user);
      const achado = await repo.buscarPorId('usr-2');
      const inexistente = await repo.buscarPorId('usr-invalid');
      const todos = await repo.listarTodos();

      expect(achado?.id).toBe('usr-2');
      expect(inexistente).toBeNull();
      expect(todos.some(u => u.id === 'usr-2')).toBe(true);
    });
  });
});
