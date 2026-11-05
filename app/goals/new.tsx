import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { Check, Calendar, Users, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../src/context/AppContext';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { GoalPriority } from '../../src/types';
import { Colors, getThemeColors } from '../../src/theme/colors';

export default function NewGoalScreen() {
  const { ministries, createGoal, theme } = useApp();
  const themeColors = getThemeColors(theme);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('media');
  const [daysOffset, setDaysOffset] = useState<number>(7);
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Selecionar ou desmarcar todos os ministérios
  const toggleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedMinistries.length === ministries.length) {
      setSelectedMinistries([]);
    } else {
      setSelectedMinistries(ministries.map(m => m.id));
    }
  };

  const toggleMinistry = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedMinistries.includes(id)) {
      setSelectedMinistries(selectedMinistries.filter(mId => mId !== id));
    } else {
      setSelectedMinistries([...selectedMinistries, id]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o título da meta.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe a descrição e instruções da meta.');
      return;
    }
    if (selectedMinistries.length === 0) {
      Alert.alert('Ministérios', 'Selecione ao menos um ministério para receber esta demanda.');
      return;
    }

    setLoading(true);
    try {
      const dueDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString();
      await createGoal({
        title,
        description,
        priority,
        dueDate,
        ministryIds: selectedMinistries,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Meta Atribuída!',
        `A demanda foi distribuída para ${selectedMinistries.length} ministério(s) com sucesso. Todos os líderes foram notificados.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a meta no momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.pageTitle, { color: themeColors.textPrimary }]}>Definir Objetivo ou Meta</Text>
      <Text style={[styles.pageSubtitle, { color: themeColors.textSecondary }]}>
        Como pastor, você pode distribuir esta mesma tarefa para múltiplos ministérios simultaneamente.
      </Text>

      {/* Formulário */}
      <Input
        label="Título da Meta ou Tarefa *"
        placeholder="Ex: Planejamento e Organização do Retiro 2026"
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label="Orientações e Descrição Pastoral *"
        placeholder="Descreva detalhadamente o que cada ministério precisa entregar, prazos parciais e objetivos espirituais..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      {/* Seletor de Prioridade */}
      <Text style={[styles.sectionLabel, { color: themeColors.textPrimary }]}>Prioridade da Demanda</Text>
      <View style={styles.priorityRow}>
        {(['baixa', 'media', 'alta', 'urgente'] as GoalPriority[]).map(p => {
          const isSelected = priority === p;
          return (
            <TouchableOpacity
              key={p}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPriority(p);
              }}
              style={[
                styles.priorityBtn,
                { backgroundColor: themeColors.chipBg, borderColor: themeColors.chipBorder },
                isSelected ? styles.priorityBtnSelected : null,
                isSelected && p === 'urgente' ? { backgroundColor: '#DC2626', borderColor: '#DC2626' } : null,
              ]}
            >
              <Text style={[styles.priorityText, isSelected ? styles.priorityTextSelected : { color: themeColors.textSecondary }]}>
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Seletor de Prazo */}
      <Text style={[styles.sectionLabel, { color: themeColors.textPrimary }]}>Prazo para Conclusão</Text>
      <View style={styles.dueDateRow}>
        {[
          { label: '3 Dias', days: 3 },
          { label: '7 Dias', days: 7 },
          { label: '15 Dias', days: 15 },
          { label: '30 Dias', days: 30 },
        ].map(item => {
          const isSelected = daysOffset === item.days;
          return (
            <TouchableOpacity
              key={item.days}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDaysOffset(item.days);
              }}
              style={[
                styles.dueBtn, 
                { backgroundColor: themeColors.chipBg, borderColor: themeColors.chipBorder },
                isSelected ? styles.dueBtnSelected : null
              ]}
            >
              <Calendar size={14} color={isSelected ? '#FFFFFF' : themeColors.textSecondary} />
              <Text style={[styles.dueText, isSelected ? styles.dueTextSelected : { color: themeColors.textSecondary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Seletor Multi-Ministérios */}
      <View style={styles.ministriesHeader}>
        <View style={styles.ministriesTitleBox}>
          <Users size={18} color={Colors.primary.DEFAULT} />
          <Text style={[styles.sectionLabel, { color: themeColors.textPrimary }]}>Ministérios Envolvidos ({selectedMinistries.length})</Text>
        </View>

        <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllBtn}>
          <Text style={styles.selectAllText}>
            {selectedMinistries.length === ministries.length ? 'Desmarcar Todos' : 'Marcar Todos'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ministryChecklist}>
        {ministries.map(min => {
          const isSelected = selectedMinistries.includes(min.id);
          return (
            <TouchableOpacity
              key={min.id}
              activeOpacity={0.7}
              onPress={() => toggleMinistry(min.id)}
              style={[
                styles.ministryCheckItem, 
                { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder },
                isSelected ? styles.ministryCheckItemSelected : null
              ]}
            >
              <View style={styles.checkboxInfo}>
                <View style={[styles.colorBar, { backgroundColor: min.color_hex }]} />
                <View>
                  <Text style={[styles.ministryName, { color: themeColors.textPrimary }]}>{min.name}</Text>
                  {min.leader_name && (
                    <Text style={[styles.ministryLeader, { color: themeColors.textSecondary }]}>Líder: {min.leader_name}</Text>
                  )}
                </View>
              </View>

              <View style={[styles.checkboxCircle, isSelected ? styles.checkboxCircleSelected : null]}>
                {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botão de Envio */}
      <Button
        title="Distribuir Meta aos Ministérios"
        onPress={handleSave}
        loading={loading}
        variant="primary"
        size="lg"
        style={styles.submitBtn}
      />
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
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  priorityBtn: {
    flex: 1,
    minHeight: 44, // UI/UX Pro Max
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBtnSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  priorityTextSelected: {
    color: '#FFFFFF',
  },
  dueDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dueBtn: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueBtnSelected: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  dueTextSelected: {
    color: '#FFFFFF',
  },
  ministriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ministriesTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  ministryChecklist: {
    gap: 8,
    marginBottom: 24,
  },
  ministryCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 48,
  },
  ministryCheckItemSelected: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: '#FFF5F5',
  },
  checkboxInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  colorBar: {
    width: 6,
    height: 32,
    borderRadius: 3,
  },
  ministryName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  ministryLeader: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  submitBtn: {
    marginTop: 10,
    minHeight: 52,
  },
});
