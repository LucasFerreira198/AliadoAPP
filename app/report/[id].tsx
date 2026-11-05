import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Send, CheckCircle2, WifiOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../src/context/AppContext';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { MediaPicker } from '../../src/components/media/MediaPicker';
import { Colors, getThemeColors } from '../../src/theme/colors';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { submitReport, isOffline, theme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [notes, setNotes] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert('Relatório', 'Por favor, escreva um resumo das ações realizadas.');
      return;
    }

    setLoading(true);
    try {
      await submitReport(id as string, notes, mediaUrls);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (isOffline) {
        Alert.alert(
          'Salvo Offline! 📶',
          'Você está sem conexão no momento. Seu relatório com fotos/vídeos foi salvo localmente no aparelho e será enviado automaticamente assim que a internet voltar.',
          [{ text: 'Entendido', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          'Relatório Enviado!',
          'O Pastor Carlos foi notificado sobre a conclusão da demanda com suas fotos e vídeos anexados.',
          [{ text: 'Concluir', onPress: () => router.back() }]
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o relatório.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>Entrega de Relatório da Meta</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Descreva o resultado das atividades e anexe fotos ou vídeos comprovando a execução do trabalho ministerial.
      </Text>

      {isOffline && (
        <View 
          style={[
            styles.offlineWarning,
            {
              backgroundColor: themeColors.status.warningBg,
              borderColor: themeColors.status.warning,
            }
          ]}
        >
          <WifiOff size={16} color={themeColors.status.warning} />
          <Text style={[styles.offlineWarningText, { color: themeColors.status.warning }]}>
            Você está operando offline. O relatório será salvo no aparelho e sincronizado depois.
          </Text>
        </View>
      )}

      <Input
        label="Descrição das Ações Realizadas *"
        placeholder="Relate como foi a realização da tarefa, pessoas alcançadas, detalhes do evento ou culto..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={5}
      />

      <MediaPicker
        mediaUrls={mediaUrls}
        onChange={setMediaUrls}
        maxFiles={6}
      />

      <Button
        title={isOffline ? 'Salvar Relatório Offline' : 'Finalizar e Notificar o Pastor'}
        onPress={handleSubmit}
        loading={loading}
        variant="primary"
        size="lg"
        icon={<Send size={18} color="#FFFFFF" />}
        style={{ marginTop: 20 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  offlineWarningText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
