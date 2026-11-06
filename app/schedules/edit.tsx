import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  Calendar, 
  UserPlus, 
  Trash2, 
  Save, 
  Clock, 
  Users 
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../src/context/AppContext';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { BottomNavBar } from '../../src/components/ui/BottomNavBar';
import { Colors, getThemeColors } from '../../src/theme/colors';
import { isValidISODate } from '../../src/utils/formatters';
import { UUIDS } from '../../src/services/mockData';

export default function ScheduleEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { 
    currentUser, 
    schedules, 
    createSchedule, 
    updateSchedule, 
    theme,
    profiles 
  } = useApp();

  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const existingSchedule = schedules.find(s => s.id === id);

  const [title, setTitle] = useState(existingSchedule?.title || 'Escala: Culto de Domingo (19h)');
  const [eventDate, setEventDate] = useState(
    existingSchedule?.event_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(existingSchedule?.notes || '');
  
  // Lista de Voluntários e Funções
  const [members, setMembers] = useState<Array<{ user_id?: string; user_name: string; role_in_service: string }>>(
    existingSchedule?.members.map(m => ({ user_id: m.user_id, user_name: m.user_name, role_in_service: m.role_in_service })) || [
      { user_id: currentUser?.id, user_name: currentUser?.full_name || 'Líder', role_in_service: 'Coordenação' },
    ]
  );

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [loading, setLoading] = useState(false);

  const AVATAR_COLORS = ['#C5221F', '#2563EB', '#D97706', '#059669', '#7C3AED', '#DB2777', '#0891B2'];
  const getAvatarColor = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

  const getNextDayOfWeek = (targetDay: number): string => {
    const d = new Date();
    const currentDay = d.getDay();
    let diff = (targetDay - currentDay + 7) % 7;
    if (diff === 0) diff = 7;
    const target = new Date(d.getTime() + diff * 24 * 60 * 60 * 1000);
    return target.toISOString().slice(0, 10);
  };

  const getUserIdForMember = (userName: string): string => {
    const matched = profiles.find(p => p.full_name.toLowerCase() === userName.toLowerCase());
    return matched ? matched.id : `00000000-0008-4000-8000-${Date.now().toString(16).slice(-12).padStart(12, '0')}`;
  };

  const handleAddMember = (name?: string, role?: string) => {
    const memberName = name || newMemberName;
    const memberRole = role || newMemberRole;

    if (!memberName.trim() || !memberRole.trim()) {
      Alert.alert('Dados Incompletos', 'Informe o nome do voluntário e a função no culto.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMembers([...members, { 
      user_id: getUserIdForMember(memberName.trim()), 
      user_name: memberName.trim(), 
      role_in_service: memberRole.trim() 
    }]);
    setNewMemberName('');
    setNewMemberRole('');
  };

  const handleRemoveMember = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (loading) return; // Trava contra duplo clique

    if (!title.trim()) {
      Alert.alert('Título Obrigatório', 'Dê um título para a escala.');
      return;
    }

    // Validação estrita de formato de data
    const cleanDate = eventDate.trim();
    if (!isValidISODate(cleanDate)) {
      Alert.alert('Data Inválida', 'A data do culto deve estar estritamente no formato AAAA-MM-DD (exemplo: 2026-11-20).');
      return;
    }

    if (members.length === 0) {
      Alert.alert('Escala Vazia', 'Adicione pelo menos um voluntário escalado.');
      return;
    }

    setLoading(true);
    try {
      if (existingSchedule) {
        await updateSchedule(existingSchedule.id, {
          title: title.trim(),
          event_date: cleanDate,
          notes: notes.trim(),
          members: members.map((m, idx) => ({
            id: existingSchedule.members[idx]?.id || `00000000-0008-4000-8000-${Date.now().toString(16).slice(-8)}${idx.toString().padStart(4, '0')}`,
            schedule_id: existingSchedule.id,
            user_id: m.user_id || getUserIdForMember(m.user_name),
            user_name: m.user_name,
            role_in_service: m.role_in_service,
            status: 'pendente',
          })),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Escala Atualizada!', 'As alterações foram salvas com sucesso.');
      } else {
        const ministryId = currentUser?.ministry_id || UUIDS.MIN_LOUVOR;
        await createSchedule({
          ministryId,
          title: title.trim(),
          eventDate: cleanDate,
          notes: notes.trim(),
          members: members.map(m => ({
            user_id: m.user_id || getUserIdForMember(m.user_name),
            user_name: m.user_name,
            role_in_service: m.role_in_service,
          })),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Nova Escala Criada!', 'A escala do ministério foi publicada com sucesso.');
      }

      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar a escala.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView 
        style={styles.scrollArea} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          {existingSchedule ? 'Editar Escala do Ministério' : 'Criar Nova Escala'}
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {currentUser?.ministry_name || 'Ministério'}: Defina os voluntários e suas funções no culto.
        </Text>

        <Input
          label="Título da Escala *"
          placeholder="Ex: Culto da Família - Louvor"
          value={title}
          onChangeText={setTitle}
        />

        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.inputLabel, { color: themeColors.textPrimary }]}>Data do Culto *</Text>
          <View style={styles.quickChipsRow}>
            {[
              { label: 'Próx. Domingo', val: getNextDayOfWeek(0) },
              { label: 'Próx. Terça', val: getNextDayOfWeek(2) },
              { label: 'Hoje', val: new Date().toISOString().slice(0, 10) },
            ].map(chip => (
              <TouchableOpacity
                key={chip.label}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEventDate(chip.val);
                }}
                style={[
                  styles.quickChipBtn,
                  {
                    backgroundColor: eventDate === chip.val ? Colors.primary.DEFAULT : (isDark ? '#1E293B' : '#F1F5F9'),
                    borderColor: eventDate === chip.val ? Colors.primary.DEFAULT : themeColors.border,
                  }
                ]}
              >
                <Text style={[styles.quickChipText, { color: eventDate === chip.val ? '#FFFFFF' : themeColors.textPrimary }]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Ou confirme o formato (AAAA-MM-DD) *"
            placeholder="2026-11-20"
            value={eventDate}
            onChangeText={setEventDate}
          />
        </View>

        <Input
          label="Orientações e Horário de Passagem"
          placeholder="Ex: Chegar às 17h30 para ensaio e oração. Traje: Preto."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {/* Adicionar Voluntário */}
        <Card style={styles.addMemberCard}>
          <Text style={[styles.addMemberTitle, { color: themeColors.textPrimary }]}>
            + Escalar Voluntário
          </Text>

          <View style={styles.addInputsRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Nome do Voluntário"
                placeholder="Ex: João Silva"
                value={newMemberName}
                onChangeText={setNewMemberName}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Função no Culto"
                placeholder="Ex: Vocal / Bateria / Som"
                value={newMemberRole}
                onChangeText={setNewMemberRole}
              />
            </View>
          </View>

          {/* Sugestões de Funções Rápidas */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleChipsRow}>
            {['Vocal', 'Violão', 'Teclado', 'Bateria', 'Baixo', 'Recepção', 'Mídia / Som', 'Infantil', 'Intercessão'].map(role => (
              <TouchableOpacity
                key={role}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewMemberRole(role);
                }}
                style={[styles.roleChip, { backgroundColor: themeColors.subtleBg, borderColor: themeColors.border }]}
              >
                <Text style={[styles.roleChipText, { color: themeColors.textPrimary }]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button
            title="+ Adicionar à Lista de Escala"
            onPress={() => handleAddMember()}
            variant="secondary"
            size="sm"
            icon={<UserPlus size={16} color="#FFFFFF" />}
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* Lista de Escalados */}
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
          Voluntários Escalados ({members.length})
        </Text>

        {members.map((m, idx) => {
          const initials = m.user_name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(p => p[0].toUpperCase())
            .join('') || 'V';

          return (
            <Card key={idx} style={styles.memberCard}>
              <View style={styles.memberRow}>
                <View style={styles.memberLeft}>
                  <View style={[styles.avatarCircle, { backgroundColor: getAvatarColor(idx) }]}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                  <View>
                    <Text style={[styles.memberName, { color: themeColors.textPrimary }]}>{m.user_name}</Text>
                    <Text style={styles.memberRole}>{m.role_in_service}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleRemoveMember(idx)}
                  style={styles.removeBtn}
                  accessibilityLabel="Remover voluntário da escala"
                >
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}

        <Button
          title={existingSchedule ? 'Salvar Alterações na Escala' : 'Publicar Escala do Ministério'}
          onPress={handleSave}
          loading={loading}
          variant="primary"
          size="lg"
          icon={<Save size={18} color="#FFFFFF" />}
          style={{ marginTop: 16 }}
        />
      </ScrollView>

      <BottomNavBar activeTab="escalas" />
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addMemberCard: {
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
  },
  addMemberTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  addInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 6,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  memberCard: {
    marginBottom: 8,
    padding: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  removeBtn: {
    padding: 8,
  },
});
