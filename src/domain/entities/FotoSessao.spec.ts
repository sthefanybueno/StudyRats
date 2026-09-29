import { FotoSessao } from './FotoSessao';

describe('FotoSessao Entity', () => {
  it('should create a new FotoSessao with valid attributes', () => {
    const props = {
      sessaoId: 'sessao-123',
      uriLocal: 'file:///data/user/0/com.app/cache/foto.jpg',
    };

    const foto = FotoSessao.create(props);

    expect(foto.id).toBeDefined();
    expect(foto.sessaoId).toBe('sessao-123');
    expect(foto.uriLocal).toBe('file:///data/user/0/com.app/cache/foto.jpg');
    expect(foto.uploadStatus).toBe('pending');
  });

  it('should throw an error if sessaoId is empty', () => {
    expect(() => {
      FotoSessao.create({ sessaoId: '', uriLocal: 'file:///path/foto.jpg' });
    }).toThrow('O ID da sessão é obrigatório');
  });

  it('should throw an error if uriLocal is empty', () => {
    expect(() => {
      FotoSessao.create({ sessaoId: 'sessao-123', uriLocal: '' });
    }).toThrow('A URI local da foto é obrigatória');
  });

  it('should mark upload as completed', () => {
    const foto = FotoSessao.create({
      sessaoId: 'sessao-123',
      uriLocal: 'file:///path/foto.jpg',
    });

    foto.marcarComoUploadConcluido('https://supabase.com/storage/foto.jpg');

    expect(foto.uploadStatus).toBe('completed');
    expect(foto.urlRemota).toBe('https://supabase.com/storage/foto.jpg');
  });
});
