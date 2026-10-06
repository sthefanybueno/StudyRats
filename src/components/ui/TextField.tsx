import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from './AppText';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from "@/providers/ThemeProvider";
import { Colors as GlobalColors } from "@/constants/theme";

interface TextFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  hint?: string;
  secure?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, icon, error, hint, secure, style, onFocus, onBlur, ...rest },
  ref
) {
  const { colors: Colors } = useAppTheme();
  const styles = useStyles(Colors);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? GlobalColors.danger : focused ? GlobalColors.primary : GlobalColors.border;

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={GlobalColors.textSecondary}>
        {label}
      </AppText>
      <View style={[styles.field, { borderColor }]}>
        <Ionicons name={icon} size={18} color={focused ? GlobalColors.primary : GlobalColors.textMuted} />
        <TextInput
          ref={ref}
          placeholderTextColor={GlobalColors.textMuted}
          selectionColor={GlobalColors.primary}
          secureTextEntry={secure && hidden}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...rest}
        />
        {secure && (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            onPress={() => setHidden(h => !h)}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={GlobalColors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <AppText variant="caption" color={GlobalColors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={GlobalColors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const useStyles = (Colors: any) => StyleSheet.create({
  wrapper: { gap: Spacing.two },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: Colors.surfaceInput,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontFamily: Fonts.medium,
    fontSize: 15,
    paddingVertical: Spacing.three - 2,
  },
});
