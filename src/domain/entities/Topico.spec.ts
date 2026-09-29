import { Topico } from './Topico';

describe('Topico Entity', () => {
  it('should create a new Topico with valid attributes', () => {
    const props = {
      disciplinaId: 'disciplina-123',
      nome: 'Álgebra Linear',
    };

    const topico = Topico.create(props);

    expect(topico.id).toBeDefined();
    expect(topico.disciplinaId).toBe('disciplina-123');
    expect(topico.nome).toBe('Álgebra Linear');
    expect(topico.createdAt).toBeInstanceOf(Date);
    expect(topico.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw an error if name is empty', () => {
    expect(() => {
      Topico.create({ disciplinaId: 'disciplina-123', nome: '' });
    }).toThrow('O nome do tópico não pode ser vazio');
  });

  it('should throw an error if disciplinaId is empty', () => {
    expect(() => {
      Topico.create({ disciplinaId: '', nome: 'Álgebra' });
    }).toThrow('O ID da disciplina é obrigatório');
  });
});
