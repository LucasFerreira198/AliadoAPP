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
import { uploadMedia } from '../src/services/mediaUpload';

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
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const isPastor = currentUser?.role === 'pastor' || currentUser?.role === 'admin';
  const totalAmount = expenses.reduce((acc, curr) => acc + (typeof curr.amount === 'number' ? curr.amount : 0), 0);

  const handleSaveExpense = async () => {
    if (loading) return; // Trava de concorrência / duplo clique

    const amount = parseCurrencyInput(amountStr);
    if (!description.trim() || amount <= 0) {
      Alert.alert('Dados Inválidos', 'Preencha a descrição e um valor válido para a despesa.');
      return;
    }

    setLoading(true);
    try {
      let finalReceiptUrl = receiptUrls[0];
      if (finalReceiptUrl && !finalReceiptUrl.startsWith('http')) {
        const uploadRes = await uploadMedia(finalReceiptUrl, 'receipts');
        finalReceiptUrl = uploadRes.url;
      }

      await submitExpense({
        ministryId: selectedMinistryId,
        description: description.trim(),
        amount,
        receiptUrl: finalReceiptUrl,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Comprovante registrado com sucesso e encaminhado para conferência!');
      setDescription('');
      setAmountStr('');
      setReceiptUrls([]);
      setShowNewExpense(false);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar a despesa.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    if (approvingId) return; // Trava de concorrência

    setApprovingId(id);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await approveExpense(id, approve);
      Alert.alert(
        approve ? 'Despesa Aprovada' : 'Ajustes Solicitados',
        approve ? 'O gasto foi validado com sucesso.' : 'O ministério foi informado para corrigir o lançamento.'
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível atualizar o status da despesa.');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>Prestação de Contas dos Ministérios</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Lançamento de recibos, cupons fiscais e controle de verba dos eventos da Igreja Metodista Aliado.
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
                R$ {(typeof exp.amount === 'number' ? exp.amount : 0).toFixed(2)}
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
                    formatCurrency(exp.amount)
                  )}
                  label="Tirar Dúvida WhatsApp"
                />
              )}

              {/* Ações Pastorais */}
              {isPastor && !isApproved && (
                <View style={styles.pastorActionBtns}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleApprove(exp.id, true)}
                    disabled={approvingId === exp.id}
                    style={styles.approveBtn}
                  >
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleApprove(exp.id, false)}
                    disabled={approvingId === exp.id}
                    style={styles.rejectBtn}
                  >
                    <X size={16} color="#FFFFFF" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  totalCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  totalLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    color: '#4ADE80',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  formCard: {
    marginBottom: 20,
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
    fontWeight: '700',
    marginBottom: 6,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  minChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  minChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  minChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  expenseCard: {
    marginBottom: 12,
    padding: 14,
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
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  expenseMinistry: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginBottom: 2,
  },
  expenseAuthor: {
    fontSize: 11,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  receiptContainer: {
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  receiptLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  receiptImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  expenseFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
  },
  pastorActionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
