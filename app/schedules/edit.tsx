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
import { Colors, getThemeColors } from '../../src/theme/colors';

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
  const existingSchedule = schedules.find(s => s.id === id);

  const [title, setTitle] = useState(existingSchedule?.title || 'Escala: Culto de Domingo (19h)');
  const [eventDate, setEventDate] = useState(
    existingSchedule?.event_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(existingSchedule?.notes || '');
  
  // Lista de Voluntários e Funções vinculados a perfis reais
  const [members, setMembers] = useState<Array<{ user_id?: string; user_name: string; role_in_service: string }>>(
    existingSchedule?.members.map(m => ({ user_id: m.user_id, user_name: m.user_name, role_in_service: m.role_in_service })) || [
      { user_id: currentUser?.id, user_name: currentUser?.full_name || 'Líder', role_in_service: 'Coordenação' },
    ]
  );

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [loading, setLoading] = useState(false);

  const getUserIdForMember = (userName: string): string => {
    const matched = profiles.find(p => p.full_name.toLowerCase() === userName.toLowerCase());
    return matched ? matched.id : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
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
    if (!title.trim()) {
      Alert.alert('Título Obrigatório', 'Dê um título para a escala.');
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
          title,
          event_date: eventDate,
          notes,
          members: members.map((m, idx) => ({
            id: existingSchedule.members[idx]?.id || `00000000-0008-4000-8000-${Date.now().toString(16).slice(-8)}${idx.toString().padStart(4, '0')}`,
            schedule_id: existingSchedule.id,
            user_id: m.user_id || getUserIdForMember(m.user_name),
            user_name: m.user_name,
            role_in_service: m.role_in_service,
            status: 'pendente',
          })),
        });
        Alert.alert('Escala Atualizada!', 'As alterações foram salvas e os voluntários notificados.');
      } else {
        await createSchedule({
          ministryId: currentUser?.ministry_id || 'a0000001-0000-0000-0000-000000000001',
          title,
          eventDate,
          notes,
          members: members.map(m => ({
            user_id: m.user_id || getUserIdForMember(m.user_name),
            user_name: m.user_name,
            role_in_service: m.role_in_service,
          })),
        });
        Alert.alert('Nova Escala Criada!', 'A escala do seu ministério foi publicada com sucesso.');
      }

      router.back();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a escala.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
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

      <Input
        label="Data do Culto (YYYY-MM-DD) *"
        placeholder="2026-11-08"
        value={eventDate}
        onChangeText={setEventDate}
      />

      <Input
        label="Orientações e Horário de Passagem *"
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
              placeholder="Ex: Vocal / Bateria / Porta"
              value={newMemberRole}
              onChangeText={setNewMemberRole}
            />
          </View>
        </View>

        <Button
          title="Adicionar à Escala"
          onPress={handleAddMember}
          variant="secondary"
          size="sm"
          icon={<UserPlus size={16} color="#FFFFFF" />}
        />
      </Card>

      {/* Lista de Membros Escalados */}
      <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
        Voluntários Escalados ({members.length})
      </Text>

      {members.map((m, index) => (
        <Card key={index} style={styles.memberCard}>
          <View style={styles.memberRow}>
            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, { color: themeColors.textPrimary }]}>{m.user_name}</Text>
              <Text style={styles.memberRole}>{m.role_in_service}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleRemoveMember(index)}
              style={styles.deleteBtn}
              accessibilityLabel="Remover voluntário"
            >
              <Trash2 size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      <Button
        title="Salvar e Publicar Escala"
        onPress={handleSave}
        loading={loading}
        variant="primary"
        size="lg"
        icon={<Save size={18} color="#FFFFFF" />}
        style={{ marginTop: 16 }}
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
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  addMemberCard: {
    marginBottom: 16,
    borderColor: '#0F172A',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: 13,
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
    marginTop: 2,
  },
  deleteBtn: {
    width: 44, // UI/UX Pro Max touch area
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
