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
import { Plus, Receipt, Check, X, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { MediaPicker } from '../src/components/media/MediaPicker';
import { WhatsAppQuickAction } from '../src/components/actions/WhatsAppQuickAction';
import { WhatsAppMessages } from '../src/services/whatsapp';
import { Colors, getThemeColors } from '../src/theme/colors';
import { parseCurrencyInput, formatCurrency } from '../src/utils/formatters';

export default function ExpensesScreen() {
  const { 
    currentUser, 
    expenses, 
    ministries, 
    submitExpense, 
    approveExpense,
    theme 
  } = useApp();

  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [showNewExpense, setShowNewExpense] = useState(false);
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [selectedMinistryId, setSelectedMinistryId] = useState(
    currentUser?.ministry_id || ministries[0]?.id || ''
  );
  const [receiptUrls, setReceiptUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isPastor = currentUser?.role === 'pastor' || currentUser?.role === 'admin';

  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleSaveExpense = async () => {
    const amount = parseCurrencyInput(amountStr);
    if (!description.trim() || amount <= 0) {
      Alert.alert('Dados Inválidos', 'Preencha a descrição e um valor válido para a despesa.');
      return;
    }

    setLoading(true);
    try {
      await submitExpense({
        ministryId: selectedMinistryId,
        description,
        amount,
        receiptUrl: receiptUrls[0],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Comprovante enviado com sucesso para a conferência pastoral!');
      setDescription('');
      setAmountStr('');
      setReceiptUrls([]);
      setShowNewExpense(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a despesa.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await approveExpense(id, approve);
    Alert.alert(
      approve ? 'Despesa Aprovada' : 'Ajustes Solicitados',
      approve ? 'O gasto foi validado com sucesso.' : 'O ministério foi informado para corrigir o lançamento.'
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>Prestação de Contas dos Ministérios</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Lançamento de recibos, notas fiscais e controle de verba dos eventos da Igreja Metodista Aliado.
      </Text>

      {/* Card de Total Acumulado */}
      <View 
        style={[
          styles.totalCard, 
          { 
            backgroundColor: isDark ? '#1E293B' : '#0F172A',
            borderColor: themeColors.cardBorder,
            borderWidth: isDark ? 1 : 0
          }
        ]}
      >
        <Text style={styles.totalLabel}>Total em Despesas Lançadas</Text>
        <Text style={styles.totalValue}>R$ {totalAmount.toFixed(2)}</Text>
      </View>

      {/* Botão de Novo Lançamento */}
      <Button
        title={showNewExpense ? 'Cancelar Novo Lançamento' : '+ Lançar Recibo ou Cupom Fiscal'}
        onPress={() => setShowNewExpense(!showNewExpense)}
        variant={showNewExpense ? 'outline' : 'primary'}
        icon={showNewExpense ? <X size={18} color={Colors.primary.DEFAULT} /> : <Plus size={18} color="#FFFFFF" />}
        style={{ marginBottom: 16 }}
      />

      {/* Formulário de Lançamento */}
      {showNewExpense && (
        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: themeColors.textPrimary }]}>Novo Comprovante de Gasto</Text>

          <Input
            label="Descrição do Gasto *"
            placeholder="Ex: Compra de materiais para a EBD infantil"
            value={description}
            onChangeText={setDescription}
          />

          <Input
            label="Valor Total (R$) *"
            placeholder="Ex: 145.50"
            value={amountStr}
            onChangeText={setAmountStr}
            keyboardType="decimal-pad"
          />

          {isPastor && (
            <View style={styles.ministrySelectContainer}>
              <Text style={[styles.selectLabel, { color: themeColors.textPrimary }]}>Ministério Responsável</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {ministries.map(min => {
                  const isSelected = selectedMinistryId === min.id;
                  return (
                    <TouchableOpacity
                      key={min.id}
                      activeOpacity={0.7}
                      onPress={() => setSelectedMinistryId(min.id)}
                      style={[
                        styles.minChip, 
                        { backgroundColor: themeColors.subtleBg, borderColor: themeColors.chipBorder },
                        isSelected ? { backgroundColor: Colors.primary.DEFAULT, borderColor: Colors.primary.DEFAULT } : null
                      ]}
                    >
                      <Text 
                        style={[
                          styles.minChipText, 
                          { color: isSelected ? '#FFFFFF' : themeColors.textPrimary },
                          isSelected ? styles.minChipTextSelected : null
                        ]}
                      >
                        {min.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <MediaPicker
            mediaUrls={receiptUrls}
            onChange={setReceiptUrls}
            maxFiles={1}
          />

          <Button
            title="Enviar Comprovante ao Pastor"
            onPress={handleSaveExpense}
            loading={loading}
            variant="primary"
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      {/* Lista de Gastos */}
      <Text style={[styles.listTitle, { color: themeColors.textPrimary }]}>Histórico de Despesas ({expenses.length})</Text>

      {expenses.map(exp => {
        const isApproved = exp.status === 'aprovado';
        const isRejected = exp.status === 'rejeitado';

        return (
          <Card key={exp.id} style={styles.expenseCard}>
            <View style={styles.expenseTopRow}>
              <View style={styles.expenseInfo}>
                <Text style={[styles.expenseDesc, { color: themeColors.textPrimary }]}>{exp.description}</Text>
                <Text style={styles.expenseMinistry}>{exp.ministry_name || 'Ministério'}</Text>
                <Text style={[styles.expenseAuthor, { color: themeColors.textSecondary }]}>
                  Por: {exp.reporter_name} em {exp.expense_date}
                </Text>
              </View>

              <Text style={[styles.expenseAmount, { color: isDark ? '#4ADE80' : '#16A34A' }]}>
                R$ {exp.amount.toFixed(2)}
              </Text>
            </View>

            {/* Imagem do Recibo (se anexado) */}
            {exp.receipt_url && (
              <View style={[styles.receiptContainer, { backgroundColor: themeColors.subtleBg }]}>
                <Text style={[styles.receiptLabel, { color: themeColors.textSecondary }]}>
                  Foto do Comprovante / Cupom:
                </Text>
                <Image source={{ uri: exp.receipt_url }} style={styles.receiptImage} />
              </View>
            )}

            {/* Rodapé com Status e Ações */}
            <View style={[styles.expenseFooterRow, { borderTopColor: themeColors.cardBorder }]}>
              <Badge
                label={isApproved ? 'Aprovado' : isRejected ? 'Rejeitado' : 'Pendente'}
                bgColor={
                  isApproved 
                    ? themeColors.status.successBg 
                    : isRejected 
                    ? themeColors.status.dangerBg 
                    : themeColors.status.warningBg
                }
                textColor={
                  isApproved 
                    ? themeColors.status.success 
                    : isRejected 
                    ? themeColors.status.danger 
                    : themeColors.status.warning
                }
              />

              {/* Botão de WhatsApp direto com o Líder para tirar dúvida do recibo */}
              {exp.reporter_phone && (
                <WhatsAppQuickAction
                  phone={exp.reporter_phone}
                  messageText={WhatsAppMessages.expenseReview(
                    exp.reporter_name || 'Líder',
                    exp.description,
                    `R$ ${exp.amount.toFixed(2)}`
                  )}
                  label="Dúvida Recibo"
                />
              )}
            </View>

            {/* Ações Pastorais de Aprovação */}
            {isPastor && !isApproved && (
              <View style={[styles.pastorActionsRow, { borderTopColor: themeColors.cardBorder }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleApprove(exp.id, true)}
                  style={[styles.approveBtn, { backgroundColor: isDark ? '#059669' : '#16A34A' }]}
                >
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  <Text style={styles.approveBtnText}>Aprovar Despesa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleApprove(exp.id, false)}
                  style={[
                    styles.rejectBtn, 
                    { 
                      backgroundColor: themeColors.actions.destructiveBg, 
                      borderColor: themeColors.actions.destructiveBorder 
                    }
                  ]}
                >
                  <X size={16} color={themeColors.actions.destructiveText} strokeWidth={3} />
                  <Text style={[styles.rejectBtnText, { color: themeColors.actions.destructiveText }]}>
                    Pedir Ajuste
                  </Text>
                </TouchableOpacity>
              </View>
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
    marginBottom: 16,
    lineHeight: 20,
  },
  totalCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  formCard: {
    marginBottom: 20,
    borderColor: '#DC2626',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  ministrySelectContainer: {
    marginBottom: 12,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  minChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  minChipSelected: {},
  minChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  minChipTextSelected: {
    fontWeight: '700',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  expenseCard: {
    marginBottom: 12,
  },
  expenseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  expenseInfo: {
    flex: 1,
    paddingRight: 10,
  },
  expenseDesc: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  expenseMinistry: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 2,
  },
  expenseAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  receiptContainer: {
    marginVertical: 10,
    padding: 8,
    borderRadius: 10,
  },
  receiptLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  receiptImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
  },
  expenseFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  pastorActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  approveBtn: {
    flex: 1,
    minHeight: 44, // UI/UX Pro Max touch target
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  rejectBtn: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
  },
  rejectBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
});
