import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'whatsapp' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#334155' : '#CBD5E1';
    switch (variant) {
      case 'primary':
        return Colors.primary.DEFAULT;
      case 'secondary':
        return isDark ? '#334155' : Colors.navy.DEFAULT;
      case 'whatsapp':
        return Colors.whatsapp.DEFAULT;
      case 'danger':
        return Colors.status.danger;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return Colors.primary.DEFAULT;
    }
  };

  const getTextColor = () => {
    if (disabled) return isDark ? '#64748B' : '#94A3B8';
    switch (variant) {
      case 'outline':
        return isDark ? '#F87171' : Colors.primary.DEFAULT;
      case 'ghost':
        return themeColors.textSecondary;
      default:
        return '#FFFFFF';
    }
  };

  const getMinHeight = () => {
    switch (size) {
      case 'sm':
        return 44; // Critério UI/UX Pro Max: mínimo absoluto 44px
      case 'lg':
        return 54;
      case 'md':
      default:
        return 48;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          minHeight: getMinHeight(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? Colors.primary.DEFAULT : 'transparent',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? 14 : 16,
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
