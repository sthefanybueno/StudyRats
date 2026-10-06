import { render, screen } from '@testing-library/react-native';

import { AppText } from '../AppText';

describe('<AppText />', () => {
  it('renderiza o texto passado como children', async () => {
    await render(<AppText>Texto de teste</AppText>);
    expect(screen.getByText('Texto de teste')).toBeTruthy();
  });

  it('aplica a variante solicitada', async () => {
    await render(<AppText variant="display">Título Grande</AppText>);
    expect(screen.getByText('Título Grande')).toBeTruthy();
  });
});
