import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, AlertCircle, HelpCircle, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { Goal, GoalAssignment, Ministry } from '../../types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { WhatsAppQuickAction } from '../actions/WhatsAppQuickAction';
import { WhatsAppMessages } from '../../services/whatsapp';
import { Colors, getThemeColors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

interface GoalCardProps {
  goal: Goal;
  assignment?: GoalAssignment;
  ministries: Ministry[];
  onPress: () => void;
  isPastorView?: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  assignment,
  ministries,
  onPress,
}) => {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);

  const dueDate = new Date(goal.due_date);
  const now = new Date();
  const isOverdue = dueDate < now && assignment?.status !== 'concluida';
  const hasDoubt = assignment?.status === 'duvida' || assignment?.comments?.some(c => c.is_doubt && !c.resolved);
  const isCompleted = assignment?.status === 'concluida';

  const formattedDueDate = dueDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  const assignedMinistries = (goal.assignments || []).map(asg => {
    return ministries.find(m => m.id === asg.ministry_id);
  }).filter(Boolean) as Ministry[];

  const contactMinistry = assignment ? ministries.find(m => m.id === assignment.ministry_id) : assignedMinistries[0];
  const leaderPhone = contactMinistry?.leader_phone || '11999999999';
  const leaderName = contactMinistry?.leader_name || 'Líder';

  return (
    <Card
      onPress={onPress}
      accentColor={isOverdue ? themeColors.status.danger : isCompleted ? themeColors.status.success : undefined}
    >
      {/* Cabeçalho do Card */}
      <View style={styles.headerRow}>
        <Badge label={goal.priority} priority={goal.priority} variant="priority" />
        
        <View style={styles.dueDateBox}>
          <Calendar size={14} color={isOverdue ? themeColors.status.danger : themeColors.textSecondary} />
          <Text style={[styles.dueDateText, { color: isOverdue ? themeColors.status.danger : themeColors.textSecondary }]}>
            {isOverdue ? `Atrasada (${formattedDueDate})` : formattedDueDate}
          </Text>
        </View>
      </View>

      {/* Título e Descrição */}
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>{goal.title}</Text>
      <Text style={[styles.description, { color: themeColors.textSecondary }]} numberOfLines={2}>
        {goal.description}
      </Text>

      {/* Tags dos Ministérios Atribuídos */}
      <View style={styles.ministryTagsRow}>
        {assignedMinistries.map(min => (
          <View 
            key={min.id} 
            style={[
              styles.ministryTag, 
              { 
                borderColor: min.color_hex, 
                backgroundColor: themeColors.chipBg 
              }
            ]}
          >
            <View style={[styles.ministryDot, { backgroundColor: min.color_hex }]} />
            <Text style={[styles.ministryTagName, { color: themeColors.textPrimary }]}>{min.name}</Text>
          </View>
        ))}
      </View>

      {/* Alerta de Dúvida Pendente do Líder */}
      {hasDoubt && (
        <View style={[styles.doubtAlertBox, { backgroundColor: themeColors.status.warningBg, borderColor: themeColors.status.warning }]}>
          <HelpCircle size={16} color={themeColors.status.warning} />
          <Text style={[styles.doubtAlertText, { color: themeColors.status.warning }]}>
            Líder enviou uma dúvida nesta meta
          </Text>
        </View>
      )}

      {/* Rodapé com Status e Ação Rápida WhatsApp */}
      <View style={[styles.footerRow, { borderTopColor: themeColors.cardBorder }]}>
        <View style={styles.statusContainer}>
          {isCompleted ? (
            <View style={styles.completedBadge}>
              <CheckCircle2 size={16} color={themeColors.status.success} />
              <Text style={[styles.completedText, { color: themeColors.status.success }]}>Relatório Entregue</Text>
            </View>
          ) : isOverdue ? (
            <View style={styles.overdueBadge}>
              <AlertCircle size={16} color={themeColors.status.danger} />
              <Text style={[styles.overdueBadgeText, { color: themeColors.status.danger }]}>Em Atraso</Text>
            </View>
          ) : (
            <Text style={[styles.inProgressText, { color: themeColors.textSecondary }]}>Em Andamento</Text>
          )}
        </View>

        {/* Atalho WhatsApp Contextualizado */}
        <View style={styles.actionsContainer}>
          <WhatsAppQuickAction
            phone={leaderPhone}
            messageText={WhatsAppMessages.goalAlignment(leaderName, goal.title, formattedDueDate)}
            compact
          />
          <ChevronRight size={20} color={themeColors.textMuted} />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dueDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  ministryTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  ministryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  ministryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ministryTagName: {
    fontSize: 11,
    fontWeight: '700',
  },
  doubtAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  doubtAlertText: {
    fontSize: 12,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '800',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overdueBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  inProgressText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
