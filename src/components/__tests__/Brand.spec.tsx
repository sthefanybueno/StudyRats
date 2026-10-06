import { render, screen } from '@testing-library/react-native';

import { BrandMark, OnboardingHeader } from '../Brand';

describe('Brand components (BrandMark, OnboardingHeader)', () => {
  describe('<BrandMark />', () => {
    it('renderiza o título da marca e subtítulo', async () => {
      await render(<BrandMark subtitle="Seu diário de estudos" size="lg" />);

      expect(screen.getByText('StudyRats')).toBeTruthy();
      expect(screen.getByText('Seu diário de estudos')).toBeTruthy();
    });
  });

  describe('<OnboardingHeader />', () => {
    it('renderiza a indicação do passo do onboarding', async () => {
      await render(<OnboardingHeader step={2} total={3} />);

      expect(screen.getByText('Passo 2 de 3')).toBeTruthy();
    });
  });
});
