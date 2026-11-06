import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText,
  Calendar,
  X,
  Eye,
  EyeOff
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { BottomNavBar } from '../src/components/ui/BottomNavBar';
import { WhatsAppQuickAction } from '../src/components/actions/WhatsAppQuickAction';
import { Colors, getThemeColors } from '../src/theme/colors';
import { CashFlowType, CashFlowCategory } from '../src/types';
import { parseCurrencyInput, formatCurrency } from '../src/utils/formatters';

export default function MaadScreen() {
  const { 
    currentUser, 
    budgets, 
    maadReviewBudget, 
    cashTransactions, 
    addCashTransaction, 
    getCashSummary,
    theme 
  } = useApp();

  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'orcamentos' | 'caixa'>('orcamentos');

  // Modal / Formulário de Novo Lançamento
  const [showNewTx, setShowNewTx] = useState(false);
  const [txType, setTxType] = useState<CashFlowType>('entrada');
  const [txCategory, setTxCategory] = useState<CashFlowCategory>('dizimo');
  const [txDesc, setTxDesc] = useState('');
  const [txAmountStr, setTxAmountStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingBudgetId, setProcessingBudgetId] = useState<string | null>(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const isMaadOrPastor = currentUser?.role === 'maad' || currentUser?.role === 'pastor';
  const summary = getCashSummary();

  // Orçamentos pendentes de aprovação pelo MAAD (já filtrados pelo pastor)
  const pendingBudgets = budgets.filter(b => b.status === 'encaminhado_maad');
  const otherBudgets = budgets.filter(b => b.status !== 'encaminhado_maad');

  const handleReview = async (budgetId: string, action: 'aprovar' | 'rejeitar') => {
    if (processingBudgetId) return; // Trava de concorrência contra clique duplo
    setProcessingBudgetId(budgetId);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await maadReviewBudget(budgetId, action);
      Alert.alert(
        action === 'aprovar' ? 'Orçamento Aprovado!' : 'Orçamento Rejeitado',
        action === 'aprovar' 
          ? 'A verba foi liberada e o lançamento financeiro de saída foi gerado no caixa.'
          : 'O líder e o pastor foram notificados sobre o indeferimento contábil.'
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível processar a avaliação contábil.');
    } finally {
      setProcessingBudgetId(null);
    }
  };

  const handleSaveTransaction = async () => {
    const amount = parseCurrencyInput(txAmountStr);
    if (!txDesc.trim() || amount <= 0) {
      Alert.alert('Dados Inválidos', 'Preencha a descrição e um valor numérico válido.');
      return;
    }

    setLoading(true);
    try {
      await addCashTransaction({
        type: txType,
        category: txCategory,
        description: txDesc,
        amount,
        date: new Date().toISOString().slice(0, 10),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Lançamento Registrado!', `A ${txType} de R$ ${amount.toFixed(2)} foi adicionada ao fluxo de caixa.`);
      setTxDesc('');
      setTxAmountStr('');
      setShowNewTx(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o lançamento.');
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
      {/* Cabeçalho MAAD */}
      <View style={styles.header}>
        <View style={styles.maadBadge}>
          <Landmark size={20} color="#059669" />
          <Text style={styles.maadBadgeText}>MAAD • CONTABILIDADE & TESOURARIA</Text>
        </View>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          Gestão Financeira e Orçamentária
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Aprovação final de verbas dos ministérios e fluxo de caixa da Igreja Metodista Aliado.
        </Text>
      </View>

      {/* Cartão de Resumo Financeiro com Proteção de Privacidade */}
      <View style={[styles.summaryCard, { backgroundColor: '#0F172A' }]}>
        <View style={styles.summaryTopRow}>
          <Text style={styles.summaryLabel}>Saldo Atual da Igreja</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsBalanceVisible(!isBalanceVisible);
            }}
            style={styles.eyeBtn}
            accessibilityLabel={isBalanceVisible ? 'Ocultar Saldo' : 'Mostrar Saldo'}
          >
            {isBalanceVisible ? (
              <Eye size={18} color="#94A3B8" />
            ) : (
              <EyeOff size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.summaryBalance}>
          {isBalanceVisible 
            ? `R$ ${summary.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
            : 'R$ ••••••'}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summarySubItem}>
            <View style={styles.itemIconGreen}>
              <ArrowDownLeft size={16} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.subItemLabel}>Entradas (Mês)</Text>
              <Text style={styles.subItemValGreen}>
                {isBalanceVisible 
                  ? `+ R$ ${summary.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : '+ R$ ••••••'}
              </Text>
            </View>
          </View>

          <View style={styles.summarySubItem}>
            <View style={styles.itemIconRed}>
              <ArrowUpRight size={16} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.subItemLabel}>Saídas (Mês)</Text>
              <Text style={styles.subItemValRed}>
                {isBalanceVisible 
                  ? `- R$ ${summary.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : '- R$ ••••••'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Abas MAAD: Orçamentos vs Fluxo de Caixa */}
      <View style={[styles.tabsRow, { backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('orcamentos')}
          style={[styles.tabBtn, activeTab === 'orcamentos' ? styles.tabBtnActive : null]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'orcamentos' ? styles.tabBtnTextActive : { color: themeColors.textSecondary }]}>
            Orçamentos Pendentes ({pendingBudgets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('caixa')}
          style={[styles.tabBtn, activeTab === 'caixa' ? styles.tabBtnActive : null]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'caixa' ? styles.tabBtnTextActive : { color: themeColors.textSecondary }]}>
            Livro Caixa ({cashTransactions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO DA ABA 1: ORÇAMENTOS PARA AVALIAÇÃO DO MAAD */}
      {activeTab === 'orcamentos' && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Demandas Filtradas pelo Pastor Aguardando Aprovação
          </Text>

          {pendingBudgets.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CheckCircle2 size={36} color="#16A34A" />
              <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>Nenhum orçamento pendente</Text>
              <Text style={[styles.emptySub, { color: themeColors.textSecondary }]}>
                Todos os pedidos de verba encaminhados pelo pastor já foram avaliados pelo MAAD.
              </Text>
            </Card>
          ) : (
            pendingBudgets.map(b => (
              <Card key={b.id} style={styles.budgetCard} accentColor={isDark ? '#4ADE80' : '#059669'}>
                <View style={styles.budgetHeader}>
                  <Badge 
                    label={b.ministry_name} 
                    bgColor={themeColors.priority.media.bg} 
                    textColor={themeColors.priority.media.text} 
                  />
                  <Text style={[styles.budgetAmount, { color: isDark ? '#4ADE80' : '#059669' }]}>
                    R$ {b.amount.toFixed(2)}
                  </Text>
                </View>

                <Text style={[styles.budgetTitle, { color: themeColors.textPrimary }]}>{b.title}</Text>
                <Text style={[styles.budgetDesc, { color: themeColors.textSecondary }]}>{b.description}</Text>

                <View 
                  style={[
                    styles.pastorNoteBox,
                    {
                      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4',
                      borderColor: isDark ? 'rgba(74, 222, 128, 0.35)' : '#BBF7D0',
                      borderWidth: 1,
                    }
                  ]}
                >
                  <Text style={[styles.pastorNoteTitle, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                    Encaminhamento Pastoral:
                  </Text>
                  <Text style={[styles.pastorNoteText, { color: isDark ? '#86EFAC' : '#166534' }]}>
                    {b.pastoral_notes || 'Verba autorizada para avaliação contábil.'}
                  </Text>
                </View>

                {/* Atalho WhatsApp para o Líder do Ministério */}
                {b.requester_phone && (
                  <View style={{ marginTop: 10 }}>
                    <WhatsAppQuickAction
                      phone={b.requester_phone}
                      messageText={`Olá ${b.requester_name}! Aqui é da equipe MAAD (Contabilidade) sobre a solicitação do orçamento de R$ ${b.amount.toFixed(2)} (${b.title}).`}
                      label={`Alinhar com ${b.requester_name.split(' ')[0]} no WhatsApp`}
                    />
                  </View>
                )}

                {/* Ações de Aprovação MAAD */}
                {isMaadOrPastor && (
                  <View style={[styles.maadActionsRow, { borderTopColor: themeColors.cardBorder }]}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={!!processingBudgetId}
                      onPress={() => handleReview(b.id, 'aprovar')}
                      style={[
                        styles.approveBtn, 
                        { 
                          backgroundColor: isDark ? '#059669' : '#16A34A',
                          opacity: processingBudgetId === b.id ? 0.6 : 1
                        }
                      ]}
                    >
                      <CheckCircle2 size={18} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>
                        {processingBudgetId === b.id ? 'Processando...' : 'Aprovar & Liberar Verba'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={!!processingBudgetId}
                      onPress={() => handleReview(b.id, 'rejeitar')}
                      style={[
                        styles.rejectBtn,
                        {
                          backgroundColor: themeColors.actions.destructiveBg,
                          borderColor: themeColors.actions.destructiveBorder,
                          opacity: processingBudgetId === b.id ? 0.6 : 1
                        }
                      ]}
                    >
                      <XCircle size={18} color={themeColors.actions.destructiveText} />
                      <Text style={[styles.rejectBtnText, { color: themeColors.actions.destructiveText }]}>
                        Indeferir
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))
          )}

          {/* Histórico de outros orçamentos */}
          {otherBudgets.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
                Histórico de Solicitações
              </Text>
              {otherBudgets.map(b => (
                <Card key={b.id} style={{ marginBottom: 8, padding: 12 }}>
                  <View style={styles.budgetHeader}>
                    <Text style={[styles.budgetMiniTitle, { color: themeColors.textPrimary }]}>{b.title}</Text>
                    <Text style={[styles.budgetMiniAmount, { color: themeColors.textPrimary }]}>
                      R$ {b.amount.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={[styles.budgetMiniSub, { color: themeColors.textSecondary }]}>
                    {b.ministry_name} • Status: {b.status === 'aprovado_maad' ? 'Aprovado pelo MAAD' : b.status === 'aguardando_pastor' ? 'Aguardando Pastor' : 'Não aprovado'}
                  </Text>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}

      {/* CONTEÚDO DA ABA 2: LIVRO CAIXA & LANÇAMENTOS */}
      {activeTab === 'caixa' && (
        <View style={styles.sectionContainer}>
          <Button
            title={showNewTx ? 'Cancelar Lançamento' : '+ Novo Lançamento de Caixa'}
            onPress={() => setShowNewTx(!showNewTx)}
            variant={showNewTx ? 'outline' : 'secondary'}
            icon={showNewTx ? <X size={18} color={Colors.primary.DEFAULT} /> : <Plus size={18} color="#FFFFFF" />}
            style={{ marginBottom: 16 }}
          />

          {/* Formulário de Novo Lançamento */}
          {showNewTx && (
            <Card style={styles.formCard}>
              <Text style={[styles.formTitle, { color: themeColors.textPrimary }]}>
                Lançamento no Livro Caixa
              </Text>

              {/* Seletor Entrada / Saída */}
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTxType('entrada')}
                  style={[
                    styles.typeBtn, 
                    {
                      backgroundColor: txType === 'entrada' ? '#16A34A' : themeColors.cardBg,
                      borderColor: txType === 'entrada' ? '#16A34A' : themeColors.cardBorder,
                    }
                  ]}
                >
                  <ArrowDownLeft size={16} color={txType === 'entrada' ? '#FFFFFF' : (isDark ? '#4ADE80' : '#16A34A')} />
                  <Text 
                    style={[
                      styles.typeBtnText, 
                      { color: txType === 'entrada' ? '#FFFFFF' : themeColors.textPrimary }
                    ]}
                  >
                    Entrada (+)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTxType('saida')}
                  style={[
                    styles.typeBtn, 
                    {
                      backgroundColor: txType === 'saida' ? '#DC2626' : themeColors.cardBg,
                      borderColor: txType === 'saida' ? '#DC2626' : themeColors.cardBorder,
                    }
                  ]}
                >
                  <ArrowUpRight size={16} color={txType === 'saida' ? '#FFFFFF' : (isDark ? '#F87171' : '#DC2626')} />
                  <Text 
                    style={[
                      styles.typeBtnText, 
                      { color: txType === 'saida' ? '#FFFFFF' : themeColors.textPrimary }
                    ]}
                  >
                    Saída (-)
                  </Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Descrição do Lançamento *"
                placeholder="Ex: Dízimos do culto de domingo ou Manutenção do telhado"
                value={txDesc}
                onChangeText={setTxDesc}
              />

              <Input
                label="Valor (R$) *"
                placeholder="Ex: 1250.00"
                value={txAmountStr}
                onChangeText={setTxAmountStr}
                keyboardType="decimal-pad"
              />

              <Button
                title={`Registrar ${txType.toUpperCase()}`}
                onPress={handleSaveTransaction}
                loading={loading}
                variant={txType === 'entrada' ? 'whatsapp' : 'danger'}
                style={{ marginTop: 8 }}
              />
            </Card>
          )}

          {/* Lista de Transações */}
          {cashTransactions.map(tx => {
            const isEntrada = tx.type === 'entrada';
            return (
              <Card key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View 
                    style={[
                      styles.txIconBox, 
                      { 
                        backgroundColor: isEntrada 
                          ? themeColors.status.successBg 
                          : themeColors.status.dangerBg 
                      }
                    ]}
                  >
                    {isEntrada ? (
                      <ArrowDownLeft size={20} color={themeColors.status.success} />
                    ) : (
                      <ArrowUpRight size={20} color={themeColors.status.danger} />
                    )}
                  </View>

                  <View style={styles.txInfo}>
                    <Text style={[styles.txDesc, { color: themeColors.textPrimary }]}>{tx.description}</Text>
                    <Text style={[styles.txSub, { color: themeColors.textSecondary }]}>
                      {tx.date} • Por: {tx.registered_by_name}
                    </Text>
                  </View>

                  <Text 
                    style={[
                      styles.txAmount, 
                      { color: isEntrada ? themeColors.status.success : themeColors.status.danger }
                    ]}
                  >
                    {isEntrada ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
      </ScrollView>

      {/* Barra de Navegação Inferior Ergonômica Fixa */}
      <BottomNavBar activeTab="maad" />
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
  header: {
    marginBottom: 16,
  },
  maadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  maadBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  summaryBalance: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 14,
  },
  summarySubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemIconGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subItemLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  subItemValGreen: {
    fontSize: 14,
    color: '#4ADE80',
    fontWeight: '800',
    marginTop: 2,
  },
  subItemValRed: {
    fontSize: 14,
    color: '#F87171',
    fontWeight: '800',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    minHeight: 44, // UI/UX Pro Max touch target
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#059669',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionContainer: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  budgetCard: {
    marginBottom: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  budgetDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  pastorNoteBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
  pastorNoteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  pastorNoteText: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
  maadActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  approveBtn: {
    flex: 2,
    minHeight: 48, // Mínimo 48dp de toque ergonômico
    backgroundColor: '#059669',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    minHeight: 48, // Mínimo 48dp de toque ergonômico
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  budgetMiniTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  budgetMiniAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  budgetMiniSub: {
    fontSize: 11,
    marginTop: 2,
  },
  formCard: {
    marginBottom: 16,
    borderColor: '#059669',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  typeBtnActiveGreen: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  typeBtnActiveRed: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  txCard: {
    marginBottom: 8,
    padding: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '700',
  },
  txSub: {
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
});
