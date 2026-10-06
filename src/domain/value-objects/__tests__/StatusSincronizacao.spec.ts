import { StatusSincronizacao } from '../StatusSincronizacao';

describe('StatusSincronizacao Value Object', () => {
  it('deve criar os status através dos métodos estáticos', () => {
    expect(StatusSincronizacao.pending().value).toBe('pending');
    expect(StatusSincronizacao.synced().value).toBe('synced');
    expect(StatusSincronizacao.error().value).toBe('error');
  });

  it('deve criar com valor padrao pending via create()', () => {
    const status = StatusSincronizacao.create();
    expect(status.value).toBe('pending');
  });

  it('deve criar com valor especificado via create()', () => {
    const status = StatusSincronizacao.create('synced');
    expect(status.value).toBe('synced');
  });
});
