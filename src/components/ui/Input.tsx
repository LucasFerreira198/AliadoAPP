import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TextStyle } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Colors, getThemeColors } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  inputStyle,
  ...props
}) => {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: themeColors.textPrimary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.inputBorder,
            color: themeColors.textPrimary,
          },
          error ? styles.inputError : null,
          props.multiline ? styles.multiline : null,
          inputStyle,
        ]}
        placeholderTextColor={themeColors.textMuted}
        {...props}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: themeColors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputError: {
    borderColor: Colors.status.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    color: Colors.status.danger,
    marginTop: 4,
    fontWeight: '600',
  },
  helper: {
    fontSize: 12,
    marginTop: 4,
  },
});
