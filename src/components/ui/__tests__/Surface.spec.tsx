import { render, screen } from '@testing-library/react-native';

import { Card, Pill, ProgressBar } from '../Surface';
import { AppText } from '../AppText';

describe('Surface components (Card, Pill, ProgressBar)', () => {
  describe('<Card />', () => {
    it('renderiza o conteúdo interno do Card', async () => {
      await render(
        <Card accent="#FF0000">
          <AppText>Conteúdo Card</AppText>
        </Card>
      );
      expect(screen.getByText('Conteúdo Card')).toBeTruthy();
    });
  });

  describe('<Pill />', () => {
    it('renderiza o rótulo e o ponto indicador da Pill', async () => {
      await render(<Pill label="Sincronizado" tone="success" dot />);
      expect(screen.getByText('Sincronizado')).toBeTruthy();
    });
  });

  describe('<ProgressBar />', () => {
    it('renderiza o indicador de progresso sem quebrar', async () => {
      const { toJSON } = await render(<ProgressBar progress={0.75} />);
      expect(toJSON()).toBeTruthy();
    });
  });
});
