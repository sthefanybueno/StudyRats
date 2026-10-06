import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../Button';

describe('<Button />', () => {
  it('renderiza o label e dispara onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(screen.getByText('Entrar')).toBeTruthy();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não dispara onPress quando desabilitado', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('esconde o label enquanto carrega', async () => {
    await render(<Button label="Entrar" onPress={jest.fn()} loading />);

    expect(screen.queryByText('Entrar')).toBeNull();
  });
});
