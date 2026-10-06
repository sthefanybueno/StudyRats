import { Email } from '../Email';

describe('Email Value Object', () => {
  it('deve criar um email válido', () => {
    const email = Email.create('aluno@estudo.com');
    expect(email.getValue).toBe('aluno@estudo.com');
  });

  it('deve lançar erro se o email for vazio ou nulo', () => {
    expect(() => Email.create('')).toThrow('O email não pode ser vazio');
    expect(() => Email.create('   ')).toThrow('O email não pode ser vazio');
  });

  it('deve lançar erro para formato inválido', () => {
    expect(() => Email.create('emailinvalido')).toThrow('Formato de email inválido');
    expect(() => Email.create('usuario@com')).toThrow('Formato de email inválido');
    expect(() => Email.create('@dominio.com')).toThrow('Formato de email inválido');
  });
});
