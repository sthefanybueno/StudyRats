import { Disciplina } from '../Disciplina';
import { Topico } from '../Topico';

describe('Disciplina Entity', () => {
  it('should create a new Disciplina with valid attributes', () => {
    const props = {
      usuarioId: 'user-123',
      nome: 'Matemática',
      cor: '#FF0000',
    };

    const disciplina = Disciplina.create(props);

    expect(disciplina.id).toBeDefined();
    expect(disciplina.usuarioId).toBe('user-123');
    expect(disciplina.nome).toBe('Matemática');
    expect(disciplina.cor).toBe('#FF0000');
    expect(disciplina.createdAt).toBeInstanceOf(Date);
    expect(disciplina.updatedAt).toBeInstanceOf(Date);
    expect(disciplina.syncStatus.value).toBe('pending');
  });

  it('should throw an error if name is empty', () => {
    expect(() => {
      Disciplina.create({ usuarioId: 'user-123', nome: '', cor: '#FF0000' });
    }).toThrow('O nome da disciplina não pode ser vazio');
  });

  it('should throw an error if usuarioId is empty', () => {
    expect(() => {
      Disciplina.create({ usuarioId: '', nome: 'Física', cor: '#FF0000' });
    }).toThrow('O ID do usuário é obrigatório');
  });

  it('should allow adding a Topico to a Disciplina', () => {
    const disciplina = Disciplina.create({ usuarioId: 'user-123', nome: 'Física', cor: '#00FF00' });
    const topico = Topico.create({ disciplinaId: disciplina.id, nome: 'Cinemática' });
    
    disciplina.adicionarTopico(topico);

    expect(disciplina.topicos).toHaveLength(1);
    expect(disciplina.topicos[0].nome).toBe('Cinemática');
  });

  it('should not allow adding a Topico from another Disciplina', () => {
    const disciplina = Disciplina.create({ usuarioId: 'user-123', nome: 'Física', cor: '#00FF00' });
    const topicoDeOutraDisciplina = Topico.create({ disciplinaId: 'outro-id', nome: 'História' });
    
    expect(() => {
      disciplina.adicionarTopico(topicoDeOutraDisciplina);
    }).toThrow('O tópico não pertence a esta disciplina');
  });

  it('should cascade soft delete to Topicos', () => {
    const disciplina = Disciplina.create({ usuarioId: 'user-123', nome: 'Física', cor: '#00FF00' });
    const topico = Topico.create({ disciplinaId: disciplina.id, nome: 'Cinemática' });
    disciplina.adicionarTopico(topico);

    disciplina.marcarComoDeletada();

    expect(disciplina.deletedAt).toBeDefined();
    expect(disciplina.topicos).toHaveLength(0); // Getter filters out deleted topicos
  });
});
