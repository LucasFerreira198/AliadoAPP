import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { 
  Flame,
  Plus, 
  Cake, 
  Receipt, 
  Calendar, 
  Bell, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Music,
  Check,
  RefreshCw,
  Send,
  ShieldCheck,
  Landmark,
  Edit,
  DollarSign,
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Header } from '../src/components/ui/Header';
import { GoalCard } from '../src/components/goals/GoalCard';
import { UpdateBanner } from '../src/components/updates/UpdateBanner';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { Colors, getThemeColors } from '../src/theme/colors';
import { formatCurrency, formatDateBR } from '../src/utils/formatters';
import LoginScreen from './login';

export default function HomeScreen() {
  const { 
    currentUser, 
    goals, 
    ministries, 
    schedules, 
    expenses, 
    budgets,
    pastorReviewBudget,
    getCashSummary,
    getTodayBirthdays,
    confirmScheduleAttendance,
    requestScheduleSwap,
    theme
  } = useApp();

  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'todas' | 'abertas' | 'duvidas' | 'atrasadas' | 'concluidas'>('todas');
  const [selectedMinistryFilter, setSelectedMinistryFilter] = useState<string | null>(null);
  const [leaderTab, setLeaderTab] = useState<'metas' | 'escalas' | 'orcamentos' | 'gastos'>('metas');

  // Se o usuário não estiver autenticado, exibe a tela de login
  if (!currentUser) {
    return <LoginScreen />;
  }

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const isPastor = currentUser.role === 'pastor';
  const isAdmin = currentUser.role === 'admin';
  const isSecretaria = currentUser.role === 'secretaria';
  const isMaad = currentUser.role === 'maad';
  const isLeader = currentUser.role === 'leader';

  const todayBirthdays = getTodayBirthdays();
  const cashSummary = getCashSummary();

  // Orçamentos pendentes de triagem pelo pastor
  const budgetsPendingPastor = budgets.filter(b => b.status === 'aguardando_pastor');

  // Cálculos de KPIs Pastorais
  const totalGoals = goals.length;
  const overdueGoals = goals.filter(g => {
    return new Date(g.due_date) < new Date() && g.assignments?.some(a => a.status !== 'concluida');
  }).length;
  const doubtGoals = goals.filter(g => {
    return g.assignments?.some(a => a.status === 'duvida' || a.comments?.some(c => c.is_doubt && !c.resolved));
  }).length;
  const completedGoals = goals.filter(g => {
    return g.assignments?.every(a => a.status === 'concluida');
  }).length;

  // Filtragem para o Pastor
  const filteredGoals = goals.filter(g => {
    if (selectedMinistryFilter) {
      const hasMin = g.assignments?.some(a => a.ministry_id === selectedMinistryFilter);
      if (!hasMin) return false;
    }
    if (selectedFilter === 'atrasadas') {
      return new Date(g.due_date) < new Date() && g.assignments?.some(a => a.status !== 'concluida');
    }
    if (selectedFilter === 'duvidas') {
      return g.assignments?.some(a => a.status === 'duvida' || a.comments?.some(c => c.is_doubt && !c.resolved));
    }
    if (selectedFilter === 'concluidas') {
      return g.assignments?.every(a => a.status === 'concluida');
    }
    if (selectedFilter === 'abertas') {
      return g.assignments?.some(a => a.status !== 'concluida');
    }
    return true;
  });

  // Metas e dados do Líder
  const leaderMinistryId = currentUser.ministry_id;
  const leaderGoals = goals.filter(g => {
    return g.assignments?.some(a => a.ministry_id === leaderMinistryId);
  });
  const mySchedules = schedules.filter(s => {
    return s.ministry_id === leaderMinistryId || s.members.some(m => m.user_id === currentUser.id);
  });
  const myBudgets = budgets.filter(b => b.ministry_id === leaderMinistryId);
  const myExpenses = expenses.filter(e => e.ministry_id === leaderMinistryId);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary.DEFAULT} />}
      >
        {/* Banner de Atualização In-App (GitHub Release / OTA) */}
        <UpdateBanner />

        {/* ======================================================== */}
        {/* ATALHO SUPER ADMIN */}
        {/* ======================================================== */}
        {isAdmin && (
          <Card style={styles.adminSpecialCard} accentColor="#F59E0B">
            <View style={styles.adminCardRow}>
              <View style={styles.adminIconBox}>
                <ShieldCheck size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.adminCardTitle, { color: themeColors.textPrimary }]}>Painel do Administrador</Text>
                <Text style={[styles.adminCardSub, { color: themeColors.textSecondary }]}>
                  Cadastrar e gerenciar contas do Pastor, Líderes, Secretaria e MAAD.
                </Text>
              </View>
            </View>
            <Button
              title="Acessar Gestão de Contas"
              onPress={() => router.push('/admin')}
              variant="primary"
              size="sm"
              style={{ marginTop: 10 }}
            />
          </Card>
        )}

        {/* ======================================================== */}
        {/* VISÃO DO PASTOR */}
        {/* ======================================================== */}
        {isPastor ? (
          <>
            {/* Card de Acolhimento Pastoral */}
            <View style={[styles.pastoralGreetingCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.pastoralGreetingRow}>
                <View style={styles.pastoralFlameIcon}>
                  <Flame size={20} color="#FFFFFF" fill="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pastoralGreetingTitle, { color: themeColors.textPrimary }]}>
                    Graça e Paz, Pastor {currentUser.full_name?.split(' ')[1] || currentUser.full_name?.split(' ')[0]}!
                  </Text>
                  <Text style={[styles.pastoralGreetingVerse, { color: themeColors.textSecondary }]}>
                    "O Senhor te abençoe e te guarde; faça resplandecer o Seu rosto sobre ti." • Nm 6:24
                  </Text>
                </View>
              </View>
            </View>

            {/* Barra de Ações Rápidas Pastorais */}
            <View style={styles.quickBar}>
              <Button
                title="+ Nova Meta Multi-Ministérios"
                onPress={() => router.push('/goals/new')}
                variant="primary"
                icon={<Plus size={18} color="#FFFFFF" strokeWidth={2.5} />}
                style={styles.newGoalBtn}
              />
            </View>

            {/* Atalhos Rápidos Pastorais */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shortcutsScroll}>
              {/* Central de Aniversariantes */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/birthdays')}
                style={[
                  styles.shortcutCard, 
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                  todayBirthdays.length > 0 ? styles.shortcutCardHighlight : null
                ]}
              >
                <View style={[styles.shortcutIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Cake size={20} color="#DC2626" />
                </View>
                <View>
                  <Text style={[styles.shortcutTitle, { color: themeColors.textPrimary }]}>Aniversários</Text>
                  <Text style={styles.shortcutSub}>
                    {todayBirthdays.length > 0 ? `🎉 ${todayBirthdays.length} hoje!` : 'Ver do mês'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* MAAD - Gestão Contábil */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/maad')}
                style={[styles.shortcutCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={[styles.shortcutIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Landmark size={20} color="#059669" />
                </View>
                <View>
                  <Text style={[styles.shortcutTitle, { color: themeColors.textPrimary }]}>MAAD (Finanças)</Text>
                  <Text style={styles.shortcutSub}>
                    Saldo: R$ {cashSummary.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Calendário da Igreja */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/calendar')}
                style={[styles.shortcutCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={[styles.shortcutIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Calendar size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={[styles.shortcutTitle, { color: themeColors.textPrimary }]}>Agenda & Cultos</Text>
                  <Text style={styles.shortcutSub}>Ver programação</Text>
                </View>
              </TouchableOpacity>

              {/* Avisos */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/announcements')}
                style={[styles.shortcutCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={[styles.shortcutIconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Bell size={20} color="#2563EB" />
                </View>
                <View>
                  <Text style={[styles.shortcutTitle, { color: themeColors.textPrimary }]}>Avisos Pastorais</Text>
                  <Text style={styles.shortcutSub}>Publicar comunicado</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* ORÇAMENTOS PENDENTES DE ANÁLISE PASTORAL (LÍDER -> PASTOR -> MAAD) */}
            {budgetsPendingPastor.length > 0 && (
              <Card 
                style={[
                  styles.budgetReviewCard,
                  {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                    borderColor: isDark ? 'rgba(251, 191, 36, 0.35)' : '#FDE68A',
                  }
                ]} 
                accentColor="#D97706"
              >
                <View style={styles.reviewHeader}>
                  <DollarSign size={20} color="#D97706" />
                  <Text style={[styles.reviewTitle, { color: themeColors.textPrimary }]}>
                    Orçamentos para sua análise, Pastor ({budgetsPendingPastor.length})
                  </Text>
                </View>
                <Text style={[styles.reviewSub, { color: themeColors.textSecondary }]}>
                  Avalie o pedido ministerial e autorize o envio ao MAAD para auditoria e liberação contábil.
                </Text>

                {budgetsPendingPastor.map(b => (
                  <View 
                    key={b.id} 
                    style={[
                      styles.budgetItemBox,
                      {
                        backgroundColor: themeColors.cardBg,
                        borderColor: themeColors.cardBorder,
                      }
                    ]}
                  >
                    <View style={styles.budgetItemTop}>
                      <Text style={[styles.budgetItemTitle, { color: themeColors.textPrimary }]}>{b.title}</Text>
                      <Text style={[styles.budgetItemAmount, { color: isDark ? '#4ADE80' : '#059669' }]}>
                        R$ {b.amount.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={[styles.budgetItemDesc, { color: themeColors.textSecondary }]}>
                      {b.ministry_name} • Por: {b.requester_name}
                    </Text>
                    <Text style={[styles.budgetItemNotes, { color: themeColors.textSecondary }]}>"{b.description}"</Text>

                    <View style={styles.pastorActionButtonsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={async () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          await pastorReviewBudget(b.id, 'encaminhar_maad');
                          Alert.alert(
                            'Orçamento Autorizado!',
                            'A solicitação foi avaliada com sucesso e encaminhada para a equipe do MAAD liberar a verba.'
                          );
                        }}
                        style={styles.forwardMaadBtn}
                      >
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        <Text style={styles.forwardMaadText}>Autorizar e Enviar ao MAAD</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={async () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          await pastorReviewBudget(b.id, 'rejeitar');
                          Alert.alert(
                            'Orçamento Indeferido',
                            'O pedido foi recusado na triagem pastoral e o líder do ministério foi notificado.'
                          );
                        }}
                        style={[
                          styles.rejectBudgetBtn,
                          {
                            backgroundColor: themeColors.actions.destructiveBg,
                            borderColor: themeColors.actions.destructiveBorder,
                            borderWidth: 1,
                          }
                        ]}
                      >
                        <Text style={[styles.rejectBudgetText, { color: themeColors.actions.destructiveText }]}>
                          Recusar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* Painel de Indicadores (KPIs Pastorais) */}
            <View style={styles.kpiGrid}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedFilter('todas')}
                style={[
                  styles.kpiCard, 
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                  selectedFilter === 'todas' ? styles.kpiActive : null
                ]}
              >
                <Clock size={18} color="#2563EB" />
                <Text style={[styles.kpiValue, { color: themeColors.textPrimary }]}>{totalGoals}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Metas Totais</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedFilter('atrasadas')}
                style={[
                  styles.kpiCard, 
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                  selectedFilter === 'atrasadas' ? styles.kpiActive : null
                ]}
              >
                <AlertTriangle size={18} color="#DC2626" />
                <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{overdueGoals}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Em Atraso</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedFilter('duvidas')}
                style={[
                  styles.kpiCard, 
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                  selectedFilter === 'duvidas' ? styles.kpiActive : null
                ]}
              >
                <HelpCircle size={18} color="#D97706" />
                <Text style={[styles.kpiValue, { color: '#D97706' }]}>{doubtGoals}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Com Dúvida</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedFilter('concluidas')}
                style={[
                  styles.kpiCard, 
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                  selectedFilter === 'concluidas' ? styles.kpiActive : null
                ]}
              >
                <CheckCircle2 size={18} color="#16A34A" />
                <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{completedGoals}</Text>
                <Text style={[styles.kpiLabel, { color: themeColors.textSecondary }]}>Concluídas</Text>
              </TouchableOpacity>
            </View>

            {/* Filtro por Ministérios */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Metas dos Ministérios</Text>
              {selectedMinistryFilter && (
                <TouchableOpacity onPress={() => setSelectedMinistryFilter(null)}>
                  <Text style={styles.clearFilterText}>Limpar filtro</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ministryChipsScroll}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedMinistryFilter(null)}
                style={[
                  styles.ministryChip, 
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                  !selectedMinistryFilter ? styles.ministryChipActive : null
                ]}
              >
                <Text style={[styles.ministryChipText, !selectedMinistryFilter ? styles.ministryChipTextActive : { color: themeColors.textPrimary }]}>
                  Todos ({ministries.length})
                </Text>
              </TouchableOpacity>

              {ministries.map(min => {
                const isSelected = selectedMinistryFilter === min.id;
                return (
                  <TouchableOpacity
                    key={min.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedMinistryFilter(isSelected ? null : min.id);
                    }}
                    style={[
                      styles.ministryChip,
                      { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                      isSelected ? { backgroundColor: min.color_hex, borderColor: min.color_hex } : null,
                    ]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: isSelected ? '#FFFFFF' : min.color_hex }]} />
                    <Text style={[styles.ministryChipText, isSelected ? { color: '#FFFFFF', fontWeight: '700' } : { color: themeColors.textPrimary }]}>
                      {min.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Lista de Metas */}
            <View style={styles.goalsListContainer}>
              {filteredGoals.length === 0 ? (
                <View style={[styles.emptyContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                  <CheckCircle2 size={40} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>Nenhuma meta ativa</Text>
                  <Text style={[styles.emptySub, { color: themeColors.textSecondary }]}>
                    Clique em "+ Nova Meta" acima para criar demandas estratégicas para a Igreja Aliado.
                  </Text>
                </View>
              ) : (
                filteredGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    ministries={ministries}
                    onPress={() => router.push(`/goals/${goal.id}`)}
                    isPastorView={true}
                  />
                ))
              )}
            </View>
          </>
        ) : isSecretaria ? (
          /* ======================================================== */
          /* VISÃO DA SECRETARIA GERAL */
          /* ======================================================== */
          <>
            <Card style={styles.secretariaCard} accentColor="#2563EB">
              <View style={styles.secCardRow}>
                <View style={styles.secIconBox}>
                  <Calendar size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.secTitle, { color: themeColors.textPrimary }]}>Secretaria & Agenda</Text>
                  <Text style={[styles.secSub, { color: themeColors.textSecondary }]}>
                    Gerenciamento oficial de cultos fixos semanais, cancelamentos e eventos da igreja.
                  </Text>
                </View>
              </View>

              <Button
                title="Abrir Gestão do Calendário"
                onPress={() => router.push('/calendar')}
                variant="primary"
                icon={<Calendar size={18} color="#FFFFFF" />}
                style={{ marginTop: 12 }}
              />
            </Card>

            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Comunicações da Igreja</Text>
              <Button
                title="+ Publicar Comunicado no Mural"
                onPress={() => router.push('/announcements')}
                variant="secondary"
                icon={<Bell size={18} color="#FFFFFF" />}
                style={{ marginTop: 8 }}
              />
            </View>
          </>
        ) : isMaad ? (
          /* ======================================================== */
          /* VISÃO DO MAAD (CONTABILIDADE & TESOURARIA) */
          /* ======================================================== */
          <>
            <Card style={styles.maadHomeCard} accentColor="#059669">
              <View style={styles.secCardRow}>
                <View style={[styles.secIconBox, { backgroundColor: '#059669' }]}>
                  <Landmark size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.secTitle, { color: themeColors.textPrimary }]}>
                    MAAD • Contabilidade & Tesouraria
                  </Text>
                  <Text style={[styles.secSub, { color: themeColors.textSecondary }]}>
                    Aprovação final de verbas orçamentárias e lançamento de fluxo de caixa (entradas/saídas).
                  </Text>
                </View>
              </View>

              <Button
                title="Acessar Painel Financeiro MAAD"
                onPress={() => router.push('/maad')}
                variant="whatsapp"
                icon={<ArrowRight size={18} color="#FFFFFF" />}
                style={{ marginTop: 12 }}
              />
            </Card>
          </>
        ) : (
          /* ======================================================== */
          /* VISÃO DO LÍDER DE MINISTÉRIO */
          /* ======================================================== */
          <>
            <View style={styles.leaderBanner}>
              <View style={styles.leaderBannerLeft}>
                <View style={styles.leaderIconBox}>
                  <Music size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.leaderMinistryName}>{currentUser.ministry_name}</Text>
                  <Text style={styles.leaderSub}>Líder: {currentUser.full_name}</Text>
                </View>
              </View>
            </View>

            {/* 4 Abas do Líder */}
            <View style={[styles.leaderTabsRow, { backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLeaderTab('metas')}
                style={[styles.leaderTabBtn, leaderTab === 'metas' ? styles.leaderTabBtnActive : null]}
              >
                <Text style={[styles.leaderTabText, leaderTab === 'metas' ? styles.leaderTabTextActive : { color: themeColors.textSecondary }]}>
                  Metas ({leaderGoals.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLeaderTab('escalas')}
                style={[styles.leaderTabBtn, leaderTab === 'escalas' ? styles.leaderTabBtnActive : null]}
              >
                <Text style={[styles.leaderTabText, leaderTab === 'escalas' ? styles.leaderTabTextActive : { color: themeColors.textSecondary }]}>
                  Escalas ({mySchedules.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLeaderTab('orcamentos')}
                style={[styles.leaderTabBtn, leaderTab === 'orcamentos' ? styles.leaderTabBtnActive : null]}
              >
                <Text style={[styles.leaderTabText, leaderTab === 'orcamentos' ? styles.leaderTabTextActive : { color: themeColors.textSecondary }]}>
                  Orçamentos ({myBudgets.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLeaderTab('gastos')}
                style={[styles.leaderTabBtn, leaderTab === 'gastos' ? styles.leaderTabBtnActive : null]}
              >
                <Text style={[styles.leaderTabText, leaderTab === 'gastos' ? styles.leaderTabTextActive : { color: themeColors.textSecondary }]}>
                  Recibos ({myExpenses.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ABA 1: METAS */}
            {leaderTab === 'metas' && (
              <View style={styles.goalsListContainer}>
                {leaderGoals.length === 0 ? (
                  <View style={[styles.emptyContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <CheckCircle2 size={40} color="#16A34A" />
                    <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>Tudo em dia!</Text>
                    <Text style={[styles.emptySub, { color: themeColors.textSecondary }]}>
                      Nenhuma meta pendente para o seu ministério no momento.
                    </Text>
                  </View>
                ) : (
                  leaderGoals.map(goal => {
                    const asg = goal.assignments?.find(a => a.ministry_id === leaderMinistryId);
                    return (
                      <View key={goal.id} style={styles.leaderGoalWrapper}>
                        <GoalCard
                          goal={goal}
                          assignment={asg}
                          ministries={ministries}
                          onPress={() => router.push(`/goals/${goal.id}`)}
                          isPastorView={false}
                        />

                        {asg?.status !== 'concluida' && (
                          <View style={styles.leaderActionsRow}>
                            <Button
                              title="Entregar Relatório (Fotos/Vídeo)"
                              onPress={() => router.push(`/report/${asg?.id || goal.id}`)}
                              variant="primary"
                              size="sm"
                              icon={<Send size={16} color="#FFFFFF" />}
                              style={{ flex: 1 }}
                            />
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ABA 2: ESCALAS DO MINISTÉRIO (COM BOTÃO DE EDITAR/CRIAR) */}
            {leaderTab === 'escalas' && (
              <View style={styles.goalsListContainer}>
                {/* Botão de Criar Nova Escala */}
                <Button
                  title="+ Criar / Escalar Voluntários"
                  onPress={() => router.push('/schedules/edit')}
                  variant="primary"
                  icon={<Plus size={18} color="#FFFFFF" />}
                  style={{ marginBottom: 12 }}
                />

                {mySchedules.map(sch => (
                  <Card key={sch.id} style={styles.scheduleCard}>
                    <View style={styles.scheduleHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.scheduleTitle, { color: themeColors.textPrimary }]}>{sch.title}</Text>
                        <Text style={styles.scheduleDate}>
                          {new Date(sch.event_date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                      {/* Botão de Editar Escala */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push(`/schedules/edit?id=${sch.id}`)}
                        style={styles.editScheduleBtn}
                      >
                        <Edit size={16} color={Colors.primary.DEFAULT} />
                        <Text style={styles.editScheduleText}>Editar</Text>
                      </TouchableOpacity>
                    </View>

                    {sch.notes && <Text style={[styles.scheduleNotes, { color: themeColors.textSecondary }]}>{sch.notes}</Text>}

                    <View style={styles.membersList}>
                      {sch.members.map(member => (
                        <View key={member.id} style={styles.memberRow}>
                          <View>
                            <Text style={[styles.memberName, { color: themeColors.textPrimary }]}>{member.user_name}</Text>
                            <Text style={styles.memberRole}>{member.role_in_service}</Text>
                          </View>

                          <View style={styles.memberStatusActions}>
                            {member.status === 'confirmado' ? (
                              <Badge label="Confirmado" bgColor="#DCFCE7" textColor="#16A34A" />
                            ) : member.status === 'solicitou_troca' ? (
                              <Badge label="Solicitou Troca" bgColor="#FEF3C7" textColor="#D97706" />
                            ) : (
                              <View style={styles.confirmButtonsRow}>
                                <TouchableOpacity
                                  activeOpacity={0.8}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    confirmScheduleAttendance(sch.id, member.id);
                                  }}
                                  style={styles.confirmBtn}
                                >
                                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  activeOpacity={0.8}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    requestScheduleSwap(sch.id, member.id, 'Imprevisto de trabalho');
                                  }}
                                  style={styles.swapBtn}
                                >
                                  <RefreshCw size={14} color="#D97706" />
                                  <Text style={styles.swapBtnText}>Pedir Troca</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {/* ABA 3: ORÇAMENTOS DO MINISTÉRIO */}
            {leaderTab === 'orcamentos' && (
              <View style={styles.goalsListContainer}>
                <Button
                  title="+ Solicitar Orçamento ao Pastor"
                  onPress={() => router.push('/budgets/new')}
                  variant="primary"
                  icon={<DollarSign size={18} color="#FFFFFF" />}
                  style={{ marginBottom: 12 }}
                />

                {myBudgets.length === 0 ? (
                  <View style={[styles.emptyContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <DollarSign size={36} color="#94A3B8" />
                    <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>Nenhum orçamento solicitado</Text>
                    <Text style={[styles.emptySub, { color: themeColors.textSecondary }]}>
                      Precisa de verba para seu ministério? Clique no botão acima para enviar ao Pastor e ao MAAD.
                    </Text>
                  </View>
                ) : (
                  myBudgets.map(b => (
                    <Card key={b.id}>
                      <View style={styles.budgetHeader}>
                        <Text style={[styles.budgetAmount, { color: '#059669' }]}>R$ {b.amount.toFixed(2)}</Text>
                        <Badge
                          label={
                            b.status === 'aprovado_maad' 
                              ? 'Aprovado pelo MAAD' 
                              : b.status === 'encaminhado_maad' 
                              ? 'Com o MAAD' 
                              : b.status === 'aguardando_pastor'
                              ? 'Com o Pastor'
                              : 'Não Aprovado'
                          }
                          bgColor={
                            b.status === 'aprovado_maad' ? '#DCFCE7' : b.status === 'encaminhado_maad' ? '#DBEAFE' : '#FEF3C7'
                          }
                          textColor={
                            b.status === 'aprovado_maad' ? '#16A34A' : b.status === 'encaminhado_maad' ? '#2563EB' : '#D97706'
                          }
                        />
                      </View>
                      <Text style={[styles.budgetTitle, { color: themeColors.textPrimary }]}>{b.title}</Text>
                      <Text style={[styles.budgetDesc, { color: themeColors.textSecondary }]}>{b.description}</Text>
                    </Card>
                  ))
                )}
              </View>
            )}

            {/* ABA 4: GASTOS E RECIBOS */}
            {leaderTab === 'gastos' && (
              <View style={styles.goalsListContainer}>
                <Button
                  title="+ Lançar Comprovante / Recibo"
                  onPress={() => router.push('/expenses')}
                  variant="secondary"
                  icon={<Receipt size={18} color="#FFFFFF" />}
                  style={{ marginBottom: 12 }}
                />

                {myExpenses.map(exp => (
                  <Card key={exp.id}>
                    <View style={styles.expenseHeader}>
                      <Text style={[styles.expenseDesc, { color: themeColors.textPrimary }]}>{exp.description}</Text>
                      <Text style={styles.expenseAmount}>R$ {exp.amount.toFixed(2)}</Text>
                    </View>
                    <Text style={[styles.expenseDate, { color: themeColors.textSecondary }]}>Data: {exp.expense_date}</Text>
                    <View style={styles.expenseFooter}>
                      <Badge
                        label={exp.status === 'aprovado' ? 'Aprovado' : exp.status === 'rejeitado' ? 'Ajustar' : 'Pendente de Aprovação'}
                        bgColor={exp.status === 'aprovado' ? '#DCFCE7' : '#FEF3C7'}
                        textColor={exp.status === 'aprovado' ? '#16A34A' : '#D97706'}
                      />
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  adminSpecialCard: {
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  adminCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  adminCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  pastoralGreetingCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pastoralGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pastoralFlameIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastoralGreetingTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pastoralGreetingVerse: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  quickBar: {
    marginBottom: 14,
  },
  newGoalBtn: {
    minHeight: 50,
  },
  shortcutsScroll: {
    marginBottom: 16,
  },
  shortcutCard: {
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    minWidth: 155,
  },
  shortcutCardHighlight: {
    borderColor: '#DC2626',
    backgroundColor: '#FFF5F5',
  },
  shortcutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  shortcutSub: {
    fontSize: 11,
    color: '#64748B',
  },
  budgetReviewCard: {
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  reviewSub: {
    fontSize: 12,
    marginBottom: 10,
  },
  budgetItemBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  budgetItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  budgetItemAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  budgetItemDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  budgetItemNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  pastorActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  forwardMaadBtn: {
    flex: 2,
    minHeight: 44, // UI/UX Pro Max
    backgroundColor: '#059669',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  forwardMaadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBudgetBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBudgetText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  kpiActive: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: '#FFF5F5',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  ministryChipsScroll: {
    marginBottom: 16,
  },
  ministryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44, // UI/UX Pro Max
  },
  ministryChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  ministryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ministryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  goalsListContainer: {
    gap: 8,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    marginVertical: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  secretariaCard: {
    marginBottom: 16,
  },
  secCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  secSub: {
    fontSize: 13,
    marginTop: 2,
  },
  maadHomeCard: {
    marginBottom: 16,
  },
  leaderBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leaderBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderMinistryName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  leaderSub: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 2,
  },
  leaderTabsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  leaderTabBtn: {
    flex: 1,
    minHeight: 44, // UI/UX Pro Max
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  leaderTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leaderTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leaderTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  leaderGoalWrapper: {
    marginBottom: 12,
  },
  leaderActionsRow: {
    flexDirection: 'row',
    marginTop: -4,
    marginBottom: 12,
  },
  scheduleCard: {
    marginBottom: 12,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scheduleDate: {
    fontSize: 13,
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  editScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 44, // UI/UX Pro Max
  },
  editScheduleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  scheduleNotes: {
    fontSize: 13,
    marginBottom: 12,
  },
  membersList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: 12,
    color: '#64748B',
  },
  memberStatusActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 44,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 44,
  },
  swapBtnText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  budgetTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  budgetDesc: {
    fontSize: 13,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  expenseDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});
