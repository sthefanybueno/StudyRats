import { SessaoEstudo } from '../SessaoEstudo';
import { FotoSessao } from '../FotoSessao';
import { Coordenada } from '../../value-objects/Coordenada';

describe('SessaoEstudo Entity', () => {
  it('should create a new SessaoEstudo with valid attributes', () => {
    const props = {
      usuarioId: 'user-1',
      disciplinaId: 'disc-1',
      topicoId: 'topico-1',
      duracaoMinutos: 45,
      coordenada: Coordenada.create({ latitude: -23.5, longitude: -46.6 }),
    };

    const sessao = SessaoEstudo.create(props);

    expect(sessao.id).toBeDefined();
    expect(sessao.usuarioId).toBe('user-1');
    expect(sessao.duracaoMinutos).toBe(45);
    expect(sessao.syncStatus.value).toBe('pending');
    expect(sessao.createdAt).toBeInstanceOf(Date);
    expect(sessao.coordenada?.latitude).toBe(-23.5);
  });

  it('should throw an error if duracaoMinutos is negative', () => {
    expect(() => {
      SessaoEstudo.create({
        usuarioId: 'user-1',
        disciplinaId: 'disc-1',
        topicoId: 'topico-1',
        duracaoMinutos: -10,
      });
    }).toThrow('A duração da sessão não pode ser negativa');
  });

  it('should allow attaching a FotoSessao', () => {
    const sessao = SessaoEstudo.create({
      usuarioId: 'user-1',
      disciplinaId: 'disc-1',
      topicoId: 'topico-1',
      duracaoMinutos: 45,
    });

    const foto = FotoSessao.create({
      sessaoId: sessao.id,
      uriLocal: 'file:///path/foto.jpg',
    });

    sessao.anexarFoto(foto);

    expect(sessao.foto).toBeDefined();
  });
});
