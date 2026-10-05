import { Text, type TextProps, type TextStyle } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'overline';

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: Fonts.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: Fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  heading: { fontFamily: Fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: Fonts.medium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: Fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({ variant = 'body', color = Colors.text, style, ...rest }: AppTextProps) {
  return <Text style={[variants[variant], { color }, style]} {...rest} />;
}
