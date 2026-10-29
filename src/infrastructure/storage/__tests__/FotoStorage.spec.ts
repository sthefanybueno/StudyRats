/** Description: Specs for FotoStorage, which moves camera photos out of volatile cache into permanent app storage. */
import { persistirFotoLocal } from '../FotoStorage';

const mockCopy = jest.fn();
const mockCreate = jest.fn();
let mockDirExists = false;

jest.mock('expo-file-system', () => {
  const join = (parts: any[]) => parts.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
  return {
    Paths: { document: { uri: 'file:///documents' } },
    Directory: class {
      uri: string;
      constructor(...parts: any[]) {
        this.uri = join(parts);
      }
      get exists() {
        return mockDirExists;
      }
      create(...args: any[]) {
        return mockCreate(...args);
      }
    },
    File: class {
      uri: string;
      constructor(...parts: any[]) {
        this.uri = join(parts);
      }
      get extension() {
        const match = /\.[a-zA-Z0-9]+$/.exec(this.uri);
        return match ? match[0] : '';
      }
      copy(destination: any) {
        return mockCopy(this.uri, destination.uri);
      }
    },
  };
});

describe('persistirFotoLocal', () => {
  beforeEach(() => {
    mockCopy.mockReset().mockResolvedValue(undefined);
    mockCreate.mockReset();
    mockDirExists = false;
  });

  it('deve copiar a foto do cache para o diretório permanente de documentos e devolver a nova URI', async () => {
    const novaUri = await persistirFotoLocal('file:///cache/ImagePicker/abc.jpg');

    expect(mockCopy).toHaveBeenCalledTimes(1);
    const [origem, destino] = mockCopy.mock.calls[0];
    expect(origem).toBe('file:///cache/ImagePicker/abc.jpg');
    expect(destino).toBe(novaUri);
    expect(novaUri.startsWith('file:///documents/fotos_sessao/')).toBe(true);
    expect(novaUri.endsWith('.jpg')).toBe(true);
    expect(novaUri).not.toContain('/cache/');
  });

  it('deve criar o diretório de fotos quando ele ainda não existir', async () => {
    await persistirFotoLocal('file:///cache/a.jpg');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('não deve recriar o diretório de fotos quando ele já existir', async () => {
    mockDirExists = true;
    await persistirFotoLocal('file:///cache/a.jpg');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('deve preservar a extensão original e usar .jpg quando não houver extensão', async () => {
    const png = await persistirFotoLocal('file:///cache/foto.png');
    const semExtensao = await persistirFotoLocal('file:///cache/foto');

    expect(png.endsWith('.png')).toBe(true);
    expect(semExtensao.endsWith('.jpg')).toBe(true);
  });

  it('deve gerar nomes de arquivo únicos a cada cópia', async () => {
    const a = await persistirFotoLocal('file:///cache/foto.jpg');
    const b = await persistirFotoLocal('file:///cache/foto.jpg');
    expect(a).not.toBe(b);
  });

  it('deve propagar o erro quando a cópia falhar (não esconder perda de foto)', async () => {
    mockCopy.mockRejectedValueOnce(new Error('sem espaço'));
    await expect(persistirFotoLocal('file:///cache/a.jpg')).rejects.toThrow('sem espaço');
  });
});
