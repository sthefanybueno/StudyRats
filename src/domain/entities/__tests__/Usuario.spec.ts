import { Usuario } from '../Usuario';

describe('Usuario Entity', () => {
  it('should create a new Usuario with valid attributes and default XP', () => {
    const props = {
      id: 'auth-uid-123',
      email: 'estudante@test.com',
      nomeExibicao: 'Estudante Dedicado',
    };

    const usuario = Usuario.create(props);

    expect(usuario.id).toBe('auth-uid-123');
    expect(usuario.email.getValue).toBe('estudante@test.com');
    expect(usuario.nomeExibicao).toBe('Estudante Dedicado');
    expect(usuario.xpTotal).toBe(0);
    expect(usuario.xpSemanal).toBe(0);
    expect(usuario.streakAtual).toBe(0);
  });

  it('should throw an error if email is invalid', () => {
    expect(() => {
      Usuario.create({ id: '123', email: 'email_invalido', nomeExibicao: 'Nome' });
    }).toThrow('Formato de email inválido');
  });

  it('should throw an error if nomeExibicao is empty', () => {
    expect(() => {
      Usuario.create({ id: '123', email: 'test@test.com', nomeExibicao: '' });
    }).toThrow('O nome de exibição é obrigatório');
  });

  it('should add XP correctly', () => {
    const usuario = Usuario.create({
      id: '123',
      email: 'test@test.com',
      nomeExibicao: 'Nome',
    });

    usuario.adicionarXP(50);

    expect(usuario.xpTotal).toBe(50);
    expect(usuario.xpSemanal).toBe(50);
  });

  it('should manage streak correctly', () => {
    const usuario = Usuario.create({
      id: '123',
      email: 'test@test.com',
      nomeExibicao: 'Nome',
      streakAtual: 5,
    });

    usuario.incrementarStreak();
    expect(usuario.streakAtual).toBe(6);

    usuario.resetarStreak();
    expect(usuario.streakAtual).toBe(0);
  });

  it('should update nomeExibicao correctly', () => {
    const usuario = Usuario.create({
      id: '123',
      email: 'test@test.com',
      nomeExibicao: 'Nome Antigo',
    });

    usuario.atualizarNomeExibicao('Novo Nome');
    expect(usuario.nomeExibicao).toBe('Novo Nome');
  });

  it('should throw error when updating nomeExibicao to empty string', () => {
    const usuario = Usuario.create({
      id: '123',
      email: 'test@test.com',
      nomeExibicao: 'Nome Antigo',
    });

    expect(() => usuario.atualizarNomeExibicao('')).toThrow('O nome de exibição é obrigatório');
  });

  it('should update nomeUsuario and fotoUrl correctly', () => {
    const usuario = Usuario.create({
      id: '123',
      email: 'test@test.com',
      nomeExibicao: 'Nome',
    });

    usuario.atualizarNomeUsuario('joao_dev');
    expect(usuario.nomeUsuario).toBe('@joao_dev');

    usuario.atualizarFotoUrl('file:///path/to/avatar.jpg');
    expect(usuario.fotoUrl).toBe('file:///path/to/avatar.jpg');
  });

  it('should throw error for invalid username format', () => {
    const usuario = Usuario.create({
      id: '123',
      email: 'test@test.com',
      nomeExibicao: 'Nome',
    });

    expect(() => usuario.atualizarNomeUsuario('ab')).toThrow(
      'O username deve ter de 3 a 30 caracteres (letras, números, . ou _)'
    );
  });
});
