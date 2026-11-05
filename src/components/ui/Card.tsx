import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { getThemeColors } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | (ViewStyle | null | undefined | false)[];
  onPress?: () => void;
  accentColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  accentColor,
}) => {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
        },
        accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : {},
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
});
