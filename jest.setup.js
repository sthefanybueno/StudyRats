/** Description: This file (jest.setup.js) contains the implementation for its respective feature. */
// Mock oficial do AsyncStorage em memória para testes.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Reanimated 4 + Worklets não têm runtime nativo no Jest: usar os mocks oficiais.
jest.mock('react-native-reanimated/src/css/native', () => ({
  setCSSEventHandler: jest.fn(),
  setViewStyle: jest.fn(),
  markNodeAsRemovable: jest.fn(),
  unmarkNodeAsRemovable: jest.fn(),
  registerCSSKeyframes: jest.fn(),
  unregisterCSSKeyframes: jest.fn(),
  applyCSSAnimations: jest.fn(),
  unregisterCSSAnimations: jest.fn(),
  runCSSTransition: jest.fn(),
  unregisterCSSTransition: jest.fn(),
  registerPseudoStyles: jest.fn(),
  unregisterPseudoStyles: jest.fn(),
  cssCallbacksRegistry: { dispatch: jest.fn() },
}));

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock do expo-font e vector-icons
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock do Expo Router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useFocusEffect: (cb: any) => {
    const React = require('react');
    React.useEffect(() => {
      return cb();
    }, [cb]);
  },
  useSegments: () => ['(app)'],
  Link: ({ children }: any) => children,
}));

// Mock do expo-secure-store
jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

