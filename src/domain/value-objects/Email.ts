export class Email {
  private constructor(private readonly value: string) {}

  public get getValue(): string {
    return this.value;
  }

  public static create(email: string): Email {
    if (!email || email.trim() === '') {
      throw new Error('O email não pode ser vazio');
    }

    // Regex simples para validação de formato de email
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      throw new Error('Formato de email inválido');
    }

    return new Email(email);
  }
}
