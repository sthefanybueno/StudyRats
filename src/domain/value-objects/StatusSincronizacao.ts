export type StatusSincronizacaoType = 'pending' | 'synced' | 'error';

export class StatusSincronizacao {
  private constructor(private readonly status: StatusSincronizacaoType) {}

  public get value(): StatusSincronizacaoType {
    return this.status;
  }

  public static pending(): StatusSincronizacao {
    return new StatusSincronizacao('pending');
  }

  public static synced(): StatusSincronizacao {
    return new StatusSincronizacao('synced');
  }

  public static error(): StatusSincronizacao {
    return new StatusSincronizacao('error');
  }

  public static create(status: StatusSincronizacaoType = 'pending'): StatusSincronizacao {
    return new StatusSincronizacao(status);
  }
}
