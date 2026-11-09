import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GoalPriority, GoalStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { getThemeColors } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'status' | 'priority' | 'role' | 'custom';
  status?: GoalStatus;
  priority?: GoalPriority;
  bgColor?: string;
  textColor?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'custom',
  status,
  priority,
  bgColor,
  textColor,
  icon,
  size = 'md',
}) => {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);

  const getColors = () => {
    if (variant === 'status' && status) {
      switch (status) {
        case 'concluida':
          return { bg: themeColors.status.successBg, text: themeColors.status.success };
        case 'em_andamento':
          return { bg: themeColors.status.infoBg, text: themeColors.status.info };
        case 'duvida':
          return { bg: themeColors.status.warningBg, text: themeColors.status.warning };
        case 'em_atraso':
          return { bg: themeColors.status.dangerBg, text: themeColors.status.danger };
        case 'pendente':
        default:
          return { bg: themeColors.status.pendingBg, text: themeColors.status.pending };
      }
    }

    if (variant === 'priority' && priority) {
      const pColor = themeColors.priority[priority];
      if (pColor) return pColor;
    }

    return {
      bg: bgColor || themeColors.subtleBg,
      text: textColor || themeColors.textSecondary,
    };
  };

  const { bg, text } = getColors();
  const isSm = size === 'sm';

  return (
    <View 
      style={[
        styles.badge, 
        { backgroundColor: bg },
        isSm ? { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 } : null
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.label, { color: text }, isSm ? { fontSize: 9, letterSpacing: 0.3 } : null]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
