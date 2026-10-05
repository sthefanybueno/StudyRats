import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from './AppText';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

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
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? Colors.danger : focused ? Colors.primary : Colors.border;

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={Colors.textSecondary}>
        {label}
      </AppText>
      <View style={[styles.field, { borderColor }]}>
        <Ionicons name={icon} size={18} color={focused ? Colors.primary : Colors.textMuted} />
        <TextInput
          ref={ref}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
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
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <AppText variant="caption" color={Colors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={Colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
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
