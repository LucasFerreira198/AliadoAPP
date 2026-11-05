import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { openWhatsAppMessage } from '../../services/whatsapp';
import { Colors, getThemeColors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

interface WhatsAppQuickActionProps {
  phone: string;
  messageText: string;
  label?: string;
  compact?: boolean;
}

export const WhatsAppQuickAction: React.FC<WhatsAppQuickActionProps> = ({
  phone,
  messageText,
  label = 'WhatsApp',
  compact = false,
}) => {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await openWhatsAppMessage(phone, messageText);
  };

  if (compact) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={styles.compactButton}
        accessibilityLabel="Enviar mensagem no WhatsApp"
      >
        <MessageCircle size={20} color="#FFFFFF" strokeWidth={2.2} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[
        styles.button,
        {
          backgroundColor: themeColors.whatsapp.bg,
          borderColor: themeColors.whatsapp.border,
        },
      ]}
      accessibilityLabel={`Enviar WhatsApp: ${label}`}
    >
      <View style={[styles.iconCircle, { backgroundColor: themeColors.whatsapp.iconCircle }]}>
        <MessageCircle size={18} color="#FFFFFF" strokeWidth={2.4} />
      </View>
      <Text style={[styles.text, { color: themeColors.whatsapp.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 44, // UI/UX Pro Max: área mínima de toque
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.whatsapp.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.whatsapp.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});
