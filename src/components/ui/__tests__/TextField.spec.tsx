import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from '../TextField';

describe('<TextField />', () => {
  it('renderiza o rótulo e aceita entrada de texto', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Email" icon="mail-outline" placeholder="seu@email.com" onChangeText={onChangeText} />);

    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy();
  });

  it('exibe a mensagem de erro quando informada', async () => {
    await render(<TextField label="Senha" icon="lock-closed-outline" error="Senha é obrigatória" />);
    expect(screen.getByText('Senha é obrigatória')).toBeTruthy();
  });

  it('exibe a dica quando informada e sem erro', async () => {
    await render(<TextField label="Nome" icon="person-outline" hint="Mínimo 3 caracteres" />);
    expect(screen.getByText('Mínimo 3 caracteres')).toBeTruthy();
  });

  it('permite alternar visibilidade de campo seguro', async () => {
    await render(<TextField label="Senha" icon="lock-closed-outline" secure value="123456" />);

    const toggleBtn = screen.getByRole('button', { name: 'Mostrar senha' });
    expect(toggleBtn).toBeTruthy();

    await fireEvent.press(toggleBtn);
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeTruthy();
  });
});
