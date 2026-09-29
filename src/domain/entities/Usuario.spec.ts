import { Usuario } from './Usuario';
import { Email } from '../value-objects/Email';

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
});
