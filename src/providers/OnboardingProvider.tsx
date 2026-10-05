import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Meta diária escolhida no onboarding (RF02).
 * Ainda não existe campo de meta no domínio (Usuario), então o valor
 * vive apenas durante o onboarding até o domínio ser estendido.
 */
interface OnboardingState {
  metaMinutos: number;
  setMetaMinutos: (m: number) => void;
}

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [metaMinutos, setMetaMinutos] = useState(60);
  return <OnboardingContext.Provider value={{ metaMinutos, setMetaMinutos }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding fora do fluxo de onboarding');
  return ctx;
}
