import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image 
} from 'react-native';
import { Cake, Sparkles, Calendar } from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { Card } from '../src/components/ui/Card';
import { WhatsAppQuickAction } from '../src/components/actions/WhatsAppQuickAction';
import { WhatsAppMessages } from '../src/services/whatsapp';
import { Colors, getThemeColors } from '../src/theme/colors';

export default function BirthdaysScreen() {
  const { getTodayBirthdays, getMonthBirthdays, theme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const todayBirthdays = getTodayBirthdays();
  const monthBirthdays = getMonthBirthdays();

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>Central de Aniversariantes</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Abençoe a vida dos irmãos e líderes da Igreja Metodista Aliado com uma mensagem pastoral no WhatsApp.
      </Text>

      {/* ANIVERSARIANTES DE HOJE */}
      <View style={styles.todaySection}>
        <View style={styles.sectionHeader}>
          <Sparkles size={20} color="#DC2626" />
          <Text style={[styles.todaySectionTitle, { color: isDark ? '#F87171' : '#DC2626' }]}>
            Comemorando Hoje! 🎉
          </Text>
        </View>

        {todayBirthdays.length === 0 ? (
          <Card style={styles.noTodayCard}>
            <Text style={[styles.noTodayText, { color: themeColors.textSecondary }]}>
              Nenhum membro faz aniversário no dia de hoje.
            </Text>
          </Card>
        ) : (
          todayBirthdays.map(member => (
            <Card 
              key={member.id} 
              style={[
                styles.todayCard,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FFF5F5',
                  borderColor: isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA',
                }
              ]} 
              accentColor={isDark ? '#F87171' : '#DC2626'}
            >
              <View style={styles.memberRow}>
                {member.avatar_url ? (
                  <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Cake size={20} color="#FFFFFF" />
                  </View>
                )}

                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: themeColors.textPrimary }]}>{member.full_name}</Text>
                  <Text style={[styles.memberRole, { color: themeColors.textSecondary }]}>
                    {member.role === 'pastor' ? 'Pastor' : member.ministry_name || 'Líder'}
                  </Text>
                </View>

                {/* Botão de 1 Toque WhatsApp */}
                <WhatsAppQuickAction
                  phone={member.phone}
                  messageText={WhatsAppMessages.birthdayWish(member.full_name)}
                  label="Parabenizar"
                />
              </View>
            </Card>
          ))
        )}
      </View>

      {/* ANIVERSARIANTES DO MÊS */}
      <View style={styles.monthSection}>
        <View style={styles.sectionHeader}>
          <Calendar size={18} color={themeColors.textPrimary} />
          <Text style={[styles.monthSectionTitle, { color: themeColors.textPrimary }]}>
            Todos do Mês de {currentMonthName}
          </Text>
        </View>

        {monthBirthdays.map(member => {
          const day = member.birth_date ? member.birth_date.split('-')[2] : '??';
          return (
            <Card key={member.id} style={styles.monthCard}>
              <View style={styles.monthRow}>
                <View style={[styles.dayBox, { backgroundColor: themeColors.subtleBg }]}>
                  <Text style={[styles.dayNumber, { color: themeColors.textPrimary }]}>{day}</Text>
                  <Text style={[styles.dayLabel, { color: themeColors.textMuted }]}>DIA</Text>
                </View>

                <View style={styles.monthInfo}>
                  <Text style={[styles.memberName, { color: themeColors.textPrimary }]}>{member.full_name}</Text>
                  <Text style={[styles.memberRole, { color: themeColors.textSecondary }]}>
                    {member.ministry_name || 'Membro da Igreja'}
                  </Text>
                </View>

                <WhatsAppQuickAction
                  phone={member.phone}
                  messageText={WhatsAppMessages.birthdayWish(member.full_name)}
                  compact
                />
              </View>
            </Card>
          );
        })}
      </View>
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  todaySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  todaySectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  noTodayCard: {
    padding: 20,
    alignItems: 'center',
  },
  noTodayText: {
    fontSize: 14,
  },
  todayCard: {
    marginBottom: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: 13,
    marginTop: 2,
  },
  monthSection: {
    marginTop: 8,
  },
  monthSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  monthCard: {
    marginBottom: 8,
    padding: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  monthInfo: {
    flex: 1,
  },
});
