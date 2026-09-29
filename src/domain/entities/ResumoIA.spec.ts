import { ResumoIA } from './ResumoIA';

describe('ResumoIA Entity', () => {
  it('should create a new ResumoIA with valid attributes', () => {
    const props = {
      topicoId: 'topico-1',
      conteudo: 'Este é um resumo gerado pela IA.',
    };

    const resumo = ResumoIA.create(props);

    expect(resumo.id).toBeDefined();
    expect(resumo.topicoId).toBe('topico-1');
    expect(resumo.conteudo).toBe('Este é um resumo gerado pela IA.');
    expect(resumo.geradoEm).toBeInstanceOf(Date);
    expect(resumo.syncStatus.value).toBe('pending');
  });

  it('should throw an error if conteudo is empty', () => {
    expect(() => {
      ResumoIA.create({ topicoId: 'topico-1', conteudo: '' });
    }).toThrow('O conteúdo do resumo não pode ser vazio');
  });

  it('should throw an error if topicoId is empty', () => {
    expect(() => {
      ResumoIA.create({ topicoId: '', conteudo: 'Resumo teste' });
    }).toThrow('O ID do tópico é obrigatório para gerar um resumo');
  });
});
