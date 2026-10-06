import { render, screen } from '@testing-library/react-native';

import { Screen } from '../Screen';
import { AppText } from '../AppText';

describe('<Screen />', () => {
  it('renderiza os filhos e o rodapé da tela', async () => {
    await render(
      <Screen footer={<AppText>Rodapé da Tela</AppText>}>
        <AppText>Conteúdo Principal</AppText>
      </Screen>
    );

    expect(screen.getByText('Conteúdo Principal')).toBeTruthy();
    expect(screen.getByText('Rodapé da Tela')).toBeTruthy();
  });
});
