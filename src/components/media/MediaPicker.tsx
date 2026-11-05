import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Video, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

interface MediaPickerProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  mediaUrls,
  onChange,
  maxFiles = 5,
}) => {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para anexar ao relatório.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxFiles - mediaUrls.length,
      });

      if (!result.canceled && result.assets) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newUris = result.assets.map(a => a.uri);
        onChange([...mediaUrls, ...newUris].slice(0, maxFiles));
      }
    } catch (err) {
      console.log('Erro ao selecionar mídia:', err);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão da Câmera', 'Precisamos de acesso à câmera para fotografar a atividade da igreja.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange([...mediaUrls, result.assets[0].uri].slice(0, maxFiles));
      }
    } catch (err) {
      console.log('Erro ao abrir câmera:', err);
    }
  };

  const removeMedia = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = mediaUrls.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: themeColors.textPrimary }]}>
        Fotos e Vídeos Comprobatórios ({mediaUrls.length}/{maxFiles})
      </Text>

      {/* Botões de Ação */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={pickFromGallery}
          disabled={mediaUrls.length >= maxFiles}
          style={[
            styles.actionBtn,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.cardBorder,
            },
            mediaUrls.length >= maxFiles ? styles.disabledBtn : null
          ]}
        >
          <ImageIcon size={20} color={mediaUrls.length >= maxFiles ? '#94A3B8' : Colors.primary.DEFAULT} />
          <Text style={[styles.actionText, { color: themeColors.textPrimary }, mediaUrls.length >= maxFiles ? styles.disabledText : null]}>
            Galeria / Vídeo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={takePhoto}
          disabled={mediaUrls.length >= maxFiles}
          style={[
            styles.actionBtn,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.cardBorder,
            },
            mediaUrls.length >= maxFiles ? styles.disabledBtn : null
          ]}
        >
          <Camera size={20} color={mediaUrls.length >= maxFiles ? '#94A3B8' : (isDark ? '#F87171' : Colors.navy.DEFAULT)} />
          <Text style={[styles.actionText, { color: themeColors.textPrimary }, mediaUrls.length >= maxFiles ? styles.disabledText : null]}>
            Tirar Foto
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Mídias Anexadas */}
      {mediaUrls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
          {mediaUrls.map((uri, index) => {
            const isVideo = uri.endsWith('.mp4') || uri.endsWith('.mov');
            return (
              <View 
                key={uri + index} 
                style={[
                  styles.thumbnailContainer, 
                  { borderColor: themeColors.cardBorder }
                ]}
              >
                {isVideo ? (
                  <View style={[styles.videoPlaceholder, { backgroundColor: isDark ? '#1E293B' : Colors.navy.DEFAULT }]}>
                    <Video size={28} color="#FFFFFF" />
                    <Text style={styles.videoLabel}>Vídeo</Text>
                  </View>
                ) : (
                  <Image source={{ uri }} style={styles.thumbnail} />
                )}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => removeMedia(index)}
                  style={styles.removeBtn}
                  accessibilityLabel="Remover mídia"
                >
                  <X size={14} color="#FFFFFF" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  disabledBtn: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  disabledText: {
    color: '#94A3B8',
  },
  previewScroll: {
    marginTop: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.navy.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
