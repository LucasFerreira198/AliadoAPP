import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Bell, Plus, AlertCircle, X, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { BottomNavBar } from '../src/components/ui/BottomNavBar';
import { Colors, getThemeColors } from '../src/theme/colors';

export default function AnnouncementsScreen() {
  const { currentUser, announcements, createAnnouncement, theme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPastor = currentUser?.role === 'pastor' || currentUser?.role === 'admin';

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Aviso', 'Preencha o título e o conteúdo do comunicado.');
      return;
    }

    setLoading(true);
    try {
      await createAnnouncement(title, content, isUrgent ? 'urgente' : 'normal');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Comunicado Publicado!', 'O aviso foi divulgado e a notificação enviada à igreja.');
      setTitle('');
      setContent('');
      setIsUrgent(false);
      setShowNew(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar o aviso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView 
        style={styles.scrollArea} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>Mural de Avisos Pastorais</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Comunicados oficiais da liderança pastoral para todos os ministérios da Igreja Metodista Aliado.
      </Text>

      {isPastor && (
        <Button
          title={showNew ? 'Cancelar' : '+ Publicar Novo Comunicado'}
          onPress={() => setShowNew(!showNew)}
          variant={showNew ? 'outline' : 'primary'}
          icon={showNew ? <X size={18} color={Colors.primary.DEFAULT} /> : <Plus size={18} color="#FFFFFF" />}
          style={{ marginBottom: 16 }}
        />
      )}

      {showNew && (
        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: themeColors.textPrimary }]}>Novo Comunicado Oficial</Text>

          <Input
            label="Título do Comunicado *"
            placeholder="Ex: Reunião Geral de Obreiros e Liderança"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Mensagem *"
            placeholder="Escreva a mensagem pastoral detalhada..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsUrgent(!isUrgent)}
            style={[
              styles.urgentCheckRow,
              { backgroundColor: isUrgent ? themeColors.priority.urgente.bg : themeColors.subtleBg },
              isUrgent ? { borderColor: themeColors.priority.urgente.text, borderWidth: 1 } : null
            ]}
          >
            <AlertCircle size={18} color={isUrgent ? themeColors.priority.urgente.text : themeColors.textSecondary} />
            <Text 
              style={[
                styles.urgentCheckText, 
                { color: isUrgent ? themeColors.priority.urgente.text : themeColors.textSecondary },
                isUrgent ? { fontWeight: '700' } : null
              ]}
            >
              Marcar como Urgente (Push com som prioritário)
            </Text>
          </TouchableOpacity>

          <Button
            title="Divulgar Comunicado com Push"
            onPress={handlePublish}
            loading={loading}
            variant="primary"
            icon={<Send size={16} color="#FFFFFF" />}
            style={{ marginTop: 12 }}
          />
        </Card>
      )}

      <View style={styles.list}>
        {announcements.map(anc => {
          const isUrgentMsg = anc.priority === 'urgente';
          return (
            <Card
              key={anc.id}
              accentColor={isUrgentMsg ? themeColors.status.danger : Colors.primary.DEFAULT}
              style={styles.announcementCard}
            >
              <View style={styles.ancHeader}>
                <Badge
                  label={isUrgentMsg ? 'URGENTE' : 'COMUNICADO'}
                  bgColor={isUrgentMsg ? themeColors.priority.urgente.bg : themeColors.priority.baixa.bg}
                  textColor={isUrgentMsg ? themeColors.priority.urgente.text : themeColors.priority.baixa.text}
                />
                <Text style={[styles.ancDate, { color: themeColors.textMuted }]}>
                  {new Date(anc.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>
              </View>

              <Text style={[styles.ancTitle, { color: themeColors.textPrimary }]}>{anc.title}</Text>
              <Text style={[styles.ancContent, { color: themeColors.textSecondary }]}>{anc.content}</Text>
              <Text style={[styles.ancAuthor, { color: themeColors.textMuted, borderTopColor: themeColors.cardBorder }]}>
                Publicado por: {anc.author_name}
              </Text>
            </Card>
          );
        })}
      </View>
      </ScrollView>

      {/* Barra de Navegação Inferior Ergonômica Fixa */}
      <BottomNavBar activeTab="mural" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  formCard: {
    marginBottom: 20,
    borderColor: Colors.primary.DEFAULT,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  urgentCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    minHeight: 44, // UI/UX Pro Max: touch target
  },
  urgentCheckText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  announcementCard: {
    marginBottom: 10,
  },
  ancHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ancDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  ancTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 22,
  },
  ancContent: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  ancAuthor: {
    fontSize: 12,
    fontWeight: '600',
    borderTopWidth: 1,
    paddingTop: 8,
  },
});
