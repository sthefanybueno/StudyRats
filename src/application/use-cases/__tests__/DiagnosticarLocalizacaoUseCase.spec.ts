/** Description: Unit tests for DiagnosticarLocalizacaoUseCase. */
import { DiagnosticarLocalizacaoUseCase } from '../DiagnosticarLocalizacaoUseCase';

describe('DiagnosticarLocalizacaoUseCase', () => {
  it('deve delegar diagnóstico, leitura atual e monitoramento em foreground', async () => {
    const remove = jest.fn();
    const gateway = {
      diagnosticarPermissao: jest.fn().mockResolvedValue({ servicosAtivos: true, permissaoConcedida: true, canAskAgain: true }),
      obterLocalizacaoAtual: jest.fn().mockResolvedValue({ latitude: -21.5, longitude: -45.4, accuracy: 10 }),
      monitorarPosicao: jest.fn().mockResolvedValue({ remove }),
    };

    const uc = new DiagnosticarLocalizacaoUseCase(gateway);
    expect(await uc.diagnosticarPermissao()).toEqual({ servicosAtivos: true, permissaoConcedida: true, canAskAgain: true });
    expect(await uc.obterLocalizacaoAtual()).toEqual({ latitude: -21.5, longitude: -45.4, accuracy: 10 });
    const sub = await uc.monitorarPosicao(jest.fn(), { distanceInterval: 10 });
    expect(sub).toBeTruthy();
    sub?.remove();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

