import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  HelpCircle, 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  Camera, 
  AlertTriangle 
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../src/context/AppContext';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { WhatsAppQuickAction } from '../../src/components/actions/WhatsAppQuickAction';
import { WhatsAppMessages } from '../../src/services/whatsapp';
import { Colors, getThemeColors } from '../../src/theme/colors';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    goals, 
    ministries, 
    currentUser, 
    approveReport, 
    addGoalComment,
    theme
  } = useApp();

  const themeColors = getThemeColors(theme);
  const [doubtText, setDoubtText] = useState('');
  const [isDoubt, setIsDoubt] = useState(true);

  const goal = goals.find(g => g.id === id);

  if (!goal) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.notFoundText, { color: themeColors.textSecondary }]}>Meta não encontrada.</Text>
      </View>
    );
  }

  const isPastor = currentUser?.role === 'pastor' || currentUser?.role === 'admin';
  const dueDate = new Date(goal.due_date);
  const isOverdue = dueDate < new Date();
  const formattedDueDate = dueDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleSendComment = async (assignmentId: string) => {
    if (!doubtText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addGoalComment(assignmentId, doubtText, isDoubt);
    setDoubtText('');
    Alert.alert('Mensagem Enviada', isDoubt ? 'Sua dúvida foi enviada ao Pastor Carlos.' : 'Comentário adicionado.');
  };

  const handleApprove = async (assignmentId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await approveReport(assignmentId, 'Aprovado com louvor pelo Pastor Carlos!');
    Alert.alert('Relatório Aprovado!', 'O ministério foi parabenizado e a meta concluída com sucesso.');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      {/* Cabeçalho da Meta */}
      <View style={[styles.header, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
        <View style={styles.badgeRow}>
          <Badge label={goal.priority} priority={goal.priority} variant="priority" />
          <View style={styles.dueDateBadge}>
            <Calendar size={14} color={isOverdue ? themeColors.status.danger : themeColors.textSecondary} />
            <Text style={[styles.dueDateText, { color: isOverdue ? themeColors.status.danger : themeColors.textSecondary }]}>
              {isOverdue ? `Atrasada desde ${formattedDueDate}` : `Prazo: ${formattedDueDate}`}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: themeColors.textPrimary }]}>{goal.title}</Text>
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>{goal.description}</Text>
      </View>

      {/* Acompanhamento por Ministério */}
      <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
        Progresso dos Ministérios ({goal.assignments?.length || 0})
      </Text>

      {goal.assignments?.map(asg => {
        const ministry = ministries.find(m => m.id === asg.ministry_id);
        const isMyMinistry = asg.ministry_id === currentUser?.ministry_id;
        const leaderPhone = ministry?.leader_phone || '11999999999';
        const leaderName = ministry?.leader_name || 'Líder';

        return (
          <Card key={asg.id} style={styles.assignmentCard}>
            {/* Topo do Ministério */}
            <View style={styles.ministryHeaderRow}>
              <View style={styles.ministryLeft}>
                <View style={[styles.ministryColorDot, { backgroundColor: ministry?.color_hex || '#DC2626' }]} />
                <View>
                  <Text style={[styles.ministryName, { color: themeColors.textPrimary }]}>{ministry?.name}</Text>
                  <Text style={[styles.leaderName, { color: themeColors.textSecondary }]}>Líder: {leaderName}</Text>
                </View>
              </View>

              <Badge label={asg.status} status={asg.status} variant="status" />
            </View>

            {/* Ação Rápida WhatsApp Pastor -> Líder */}
            <View style={styles.whatsAppRow}>
              <WhatsAppQuickAction
                phone={leaderPhone}
                messageText={WhatsAppMessages.goalAlignment(leaderName, goal.title, formattedDueDate)}
                label={`Falar com ${leaderName.split(' ')[0]} no WhatsApp`}
              />
            </View>

            {/* Relatórios Enviados */}
            {asg.reports && asg.reports.length > 0 && (
              <View style={styles.reportsSection}>
                <Text style={[styles.subSectionTitle, { color: themeColors.textPrimary }]}>Relatório de Conclusão</Text>
                {asg.reports.map(rep => (
                  <View key={rep.id} style={[styles.reportBox, { backgroundColor: themeColors.subtleBg, borderColor: themeColors.cardBorder }]}>
                    <Text style={[styles.reportNotes, { color: themeColors.textPrimary }]}>"{rep.notes}"</Text>
                    <Text style={[styles.reportAuthor, { color: themeColors.textSecondary }]}>Enviado por {rep.author_name}</Text>

                    {/* Galeria de Fotos / Vídeos */}
                    {rep.media && rep.media.length > 0 && (
                      <View style={styles.mediaGallery}>
                        {rep.media.map((med, idx) => (
                          <Image key={idx} source={{ uri: med.file_url }} style={styles.mediaThumbnail} />
                        ))}
                      </View>
                    )}

                    {rep.pastoral_feedback ? (
                      <View style={styles.feedbackBox}>
                        <CheckCircle2 size={16} color={Colors.status.success} />
                        <Text style={styles.feedbackText}>{rep.pastoral_feedback}</Text>
                      </View>
                    ) : isPastor ? (
                      <Button
                        title="Aprovar com Louvor"
                        onPress={() => handleApprove(asg.id)}
                        variant="primary"
                        size="sm"
                        icon={<ThumbsUp size={16} color="#FFFFFF" />}
                        style={{ marginTop: 10 }}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {/* Dúvidas e Conversas da Tarefa */}
            <View style={styles.commentsSection}>
              <Text style={[styles.subSectionTitle, { color: themeColors.textPrimary }]}>Dúvidas & Alinhamento Pastoral</Text>

              {asg.comments && asg.comments.length > 0 ? (
                asg.comments.map(c => (
                  <View key={c.id} style={[styles.commentBubble, { backgroundColor: themeColors.subtleBg }, c.is_doubt ? styles.doubtBubble : null]}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentUser, { color: themeColors.textPrimary }]}>{c.user_name} ({c.user_role === 'pastor' ? 'Pastor' : 'Líder'})</Text>
                      {c.is_doubt && (
                        <View style={styles.doubtBadge}>
                          <HelpCircle size={12} color="#D97706" />
                          <Text style={styles.doubtBadgeText}>DÚVIDA</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.commentMessage, { color: themeColors.textSecondary }]}>{c.message}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noCommentsText, { color: themeColors.textMuted }]}>Nenhuma dúvida registrada.</Text>
              )}

              {/* Formulário para Tirar Dúvida ou Responder */}
              <View style={styles.addCommentBox}>
                <Input
                  label={isPastor ? 'Responder ao líder' : 'Tirar dúvida com o Pastor Carlos'}
                  placeholder="Digite sua mensagem aqui..."
                  value={doubtText}
                  onChangeText={setDoubtText}
                />
                <Button
                  title={isPastor ? 'Enviar Resposta' : 'Enviar Dúvida'}
                  onPress={() => handleSendComment(asg.id)}
                  size="sm"
                  variant="secondary"
                  icon={<Send size={14} color="#FFFFFF" />}
                />
              </View>
            </View>

            {/* Botão de Entregar Relatório (para o Líder deste Ministério) */}
            {(isMyMinistry || isPastor) && asg.status !== 'concluida' && (
              <Button
                title="Entregar Relatório (Anexar Fotos e Vídeos)"
                onPress={() => router.push(`/report/${asg.id}`)}
                variant="primary"
                icon={<Camera size={18} color="#FFFFFF" />}
                style={{ marginTop: 14 }}
              />
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  overdueText: {
    color: Colors.status.danger,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.textPrimary,
    lineHeight: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.textPrimary,
    marginBottom: 12,
  },
  assignmentCard: {
    marginBottom: 16,
  },
  ministryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ministryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ministryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ministryName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.textPrimary,
  },
  leaderName: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  whatsAppRow: {
    marginBottom: 14,
  },
  reportsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginBottom: 14,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: 8,
  },
  reportBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportNotes: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  reportAuthor: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 6,
  },
  mediaGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  mediaThumbnail: {
    width: 75,
    height: 75,
    borderRadius: 8,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  feedbackText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '700',
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  commentBubble: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  doubtBubble: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  doubtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  doubtBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  commentMessage: {
    fontSize: 13,
    color: Colors.light.textPrimary,
  },
  noCommentsText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  addCommentBox: {
    marginTop: 6,
  },
});
