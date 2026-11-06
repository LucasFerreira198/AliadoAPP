import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { DollarSign, Send, Landmark } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../src/context/AppContext';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Colors, getThemeColors } from '../../src/theme/colors';
import { parseCurrencyInput } from '../../src/utils/formatters';
import { UUIDS } from '../../src/services/mockData';

export default function NewBudgetScreen() {
  const { currentUser, requestBudget, theme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (loading) return; // Trava contra múltiplos toques rápidos

    const amount = parseCurrencyInput(amountStr);
    if (!title.trim() || !description.trim() || amount <= 0) {
      Alert.alert('Dados Incompletos', 'Preencha o título, justificativa e um valor válido de verba.');
      return;
    }

    setLoading(true);
    try {
      const ministryId = currentUser?.ministry_id || UUIDS.MIN_LOUVOR;
      await requestBudget({
        ministryId,
        title: title.trim(),
        description: description.trim(),
        amount,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Solicitação Enviada ao Pastor!',
        'O Pastor Carlos irá analisar o pedido. Se aprovado na triagem pastoral, será encaminhado ao MAAD para liberação contábil da verba.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível enviar a solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>Solicitar Orçamento / Verba</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Fluxo oficial da Igreja Metodista Aliado: Sua solicitação passará primeiro pela triagem do Pastor e em seguida para a contabilidade do MAAD.
      </Text>

      {/* Box explicativo do fluxo */}
      <Card 
        style={[
          styles.flowCard,
          {
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4',
            borderColor: isDark ? 'rgba(74, 222, 128, 0.35)' : '#BBF7D0',
          }
        ]}
      >
        <View style={styles.flowHeader}>
          <Landmark size={18} color={isDark ? '#4ADE80' : '#059669'} />
          <Text style={[styles.flowTitle, { color: isDark ? '#4ADE80' : '#15803D' }]}>Fluxo de Aprovação Contábil</Text>
        </View>
        <Text style={[styles.flowSteps, { color: isDark ? '#86EFAC' : '#166534' }]}>
          1. Líder solicita → 2. Pastor filtra → 3. MAAD libera verba
        </Text>
      </Card>

      <Input
        label="Título do Orçamento *"
        placeholder="Ex: Aquisição de Cabos e Microfones para o Louvor"
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label="Valor Solicitado (R$) *"
        placeholder="Ex: 850.00"
        value={amountStr}
        onChangeText={setAmountStr}
        keyboardType="decimal-pad"
      />

      <Input
        label="Justificativa e Detalhes da Aplicação *"
        placeholder="Explique para qual evento, culto ou necessidade essa verba será destinada..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Button
        title="Encaminhar Solicitação ao Pastor"
        onPress={handleSend}
        loading={loading}
        variant="primary"
        size="lg"
        icon={<Send size={18} color="#FFFFFF" />}
        style={{ marginTop: 12 }}
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
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  flowCard: {
    marginBottom: 16,
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  flowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  flowSteps: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
