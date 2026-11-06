import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';
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
  EyeOff,
  AlertTriangle
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

  // RBAC Guard: Restrito a MAAD, Pastor e Admin
  const isAuthorized = currentUser?.role === 'maad' || currentUser?.role === 'pastor' || currentUser?.role === 'admin';

  useEffect(() => {
    if (currentUser && !isAuthorized) {
      Alert.alert('Acesso Restrito', 'Apenas a equipe do MAAD, Tesouraria e Pastoral possuem acesso à gestão financeira.');
      router.replace('/');
    }
  }, [currentUser, isAuthorized]);

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

  if (!isAuthorized) {
    return (
      <View style={[styles.deniedContainer, { backgroundColor: themeColors.background }]}>
        <AlertTriangle size={48} color="#DC2626" />
        <Text style={[styles.deniedTitle, { color: themeColors.textPrimary }]}>Acesso Restrito ao MAAD</Text>
        <Text style={[styles.deniedSub, { color: themeColors.textSecondary }]}>
          Você não possui privilégios para visualizar as finanças e o livro caixa da igreja.
        </Text>
      </View>
    );
  }

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
          ? 'A verba foi liberada e o lançamento financeiro de saída foi gerado no caixa com sucesso.'
          : 'O líder e o pastor foram notificados sobre o indeferimento contábil.'
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível processar a avaliação contábil.');
    } finally {
      setProcessingBudgetId(null);
    }
  };

  const handleSaveTransaction = async () => {
    if (loading) return; // Trava de duplo clique

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
        description: txDesc.trim(),
        amount,
        date: new Date().toISOString().slice(0, 10),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Lançamento Registrado!', `A ${txType} de R$ ${amount.toFixed(2)} foi adicionada ao fluxo de caixa.`);
      setTxDesc('');
      setTxAmountStr('');
      setShowNewTx(false);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível registrar o lançamento.');
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
            Aprovação de verbas dos ministérios e fluxo de caixa da Igreja Metodista Aliado.
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

                  {b.pastoral_notes && (
                    <View style={[styles.pastoralNoteBox, { backgroundColor: themeColors.subtleBg, borderColor: themeColors.border }]}>
                      <Text style={[styles.pastoralNoteLabel, { color: themeColors.textPrimary }]}>Parecer Pastoral:</Text>
                      <Text style={[styles.pastoralNoteText, { color: themeColors.textSecondary }]}>"{b.pastoral_notes}"</Text>
                    </View>
                  )}

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleReview(b.id, 'aprovar')}
                      disabled={processingBudgetId === b.id}
                      style={[styles.approveBtn, processingBudgetId === b.id ? { opacity: 0.6 } : null]}
                    >
                      <CheckCircle2 size={16} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>
                        {processingBudgetId === b.id ? 'Processando...' : 'Aprovar & Liberar Verba'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleReview(b.id, 'rejeitar')}
                      disabled={processingBudgetId === b.id}
                      style={[styles.rejectBtn, processingBudgetId === b.id ? { opacity: 0.6 } : null]}
                    >
                      <XCircle size={16} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Indeferir</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}

            {/* Histórico Geral de Orçamentos */}
            {otherBudgets.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
                  Histórico de Solicitações ({otherBudgets.length})
                </Text>

                {otherBudgets.map(b => (
                  <Card key={b.id} style={styles.budgetMiniCard}>
                    <View style={styles.budgetMiniRow}>
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
                            ? (isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7') 
                            : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2') 
                        }
                      ]}
                    >
                      {isEntrada ? (
                        <ArrowDownLeft size={20} color="#16A34A" />
                      ) : (
                        <ArrowUpRight size={20} color="#DC2626" />
                      )}
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={[styles.txDesc, { color: themeColors.textPrimary }]}>{tx.description}</Text>
                      <Text style={[styles.txDate, { color: themeColors.textSecondary }]}>
                        {tx.date} • {tx.category.toUpperCase()} • Registrado por: {tx.registered_by_name || 'MAAD'}
                      </Text>
                    </View>

                    <Text style={[styles.txAmount, { color: isEntrada ? '#16A34A' : '#DC2626' }]}>
                      {isEntrada ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

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
  deniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
  },
  deniedSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eyeBtn: {
    padding: 4,
  },
  summaryBalance: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
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
    gap: 8,
  },
  itemIconGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subItemLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  subItemValGreen: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '800',
  },
  subItemValRed: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#059669',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  sectionContainer: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  budgetCard: {
    marginBottom: 12,
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  budgetDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  pastoralNoteBox: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  pastoralNoteLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  pastoralNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 10,
    minHeight: 46,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 10,
    minHeight: 46,
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  budgetMiniCard: {
    marginBottom: 8,
    padding: 12,
  },
  budgetMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    fontSize: 12,
  },
  formCard: {
    marginBottom: 16,
    padding: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 44,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  txCard: {
    marginBottom: 8,
    padding: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
});
