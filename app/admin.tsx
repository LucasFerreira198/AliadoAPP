import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Switch,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { 
  ShieldCheck, 
  UserPlus, 
  Check, 
  X, 
  Users, 
  Power, 
  Phone, 
  Mail,
  AlertTriangle,
  Trash2,
  Edit3,
  Plus,
  Landmark,
  Layers,
  Settings2,
  Calendar,
  Bell,
  Cake,
  FileText,
  DollarSign,
  Sparkles,
  Lock,
  Flame,
  ChevronRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { UserRole, Ministry, Profile, AppFeatureKey } from '../src/types';
import { Colors, getThemeColors } from '../src/theme/colors';

type AdminTab = 'accounts' | 'ministries' | 'features';

const COLOR_PRESETS = [
  '#DC2626', // Vermelho
  '#EA580C', // Laranja
  '#F59E0B', // Âmbar
  '#059669', // Verde
  '#0D9488', // Teal
  '#2563EB', // Azul
  '#4F46E5', // Índigo
  '#7C3AED', // Roxo
  '#DB2777', // Rosa
  '#0F172A', // Grafite
];

const ICON_PRESETS = [
  'flame',
  'music',
  'landmark',
  'smile',
  'heart-handshake',
  'camera',
  'users',
  'shield',
  'globe',
  'book',
  'sun',
];

interface FeatureItemDef {
  key: AppFeatureKey;
  label: string;
  description: string;
  icon: any;
  color: string;
}

const FEATURE_ITEMS: FeatureItemDef[] = [
  {
    key: 'schedules',
    label: 'Escalas de Voluntários',
    description: 'Organização de escalas por culto e solicitação de trocas',
    icon: Calendar,
    color: '#2563EB',
  },
  {
    key: 'goals',
    label: 'Metas da Igreja',
    description: 'Planejamento e acompanhamento pastoral de alvos',
    icon: Sparkles,
    color: '#DC2626',
  },
  {
    key: 'maad',
    label: 'Caixa & Tesouraria MAAD',
    description: 'Fluxo financeiro, lançamentos de dízimos, ofertas e despesas fixas',
    icon: Landmark,
    color: '#059669',
  },
  {
    key: 'budgets',
    label: 'Pedidos de Orçamento',
    description: 'Solicitações ministeriais enviadas para aprovação pastoral e MAAD',
    icon: DollarSign,
    color: '#D97706',
  },
  {
    key: 'expenses',
    label: 'Despesas Ministeriais',
    description: 'Prestação de contas e envio de notas fiscais pelos líderes',
    icon: FileText,
    color: '#7C3AED',
  },
  {
    key: 'announcements',
    label: 'Mural de Comunicados',
    description: 'Avisos e informativos oficiais para a membresia',
    icon: Bell,
    color: '#0284C7',
  },
  {
    key: 'calendar',
    label: 'Agenda de Cultos & Eventos',
    description: 'Calendário com cultos fixos semanais e programações especiais',
    icon: Calendar,
    color: '#F59E0B',
  },
  {
    key: 'birthdays',
    label: 'Mural de Aniversariantes',
    description: 'Controle de aniversários do dia e do mês',
    icon: Cake,
    color: '#EC4899',
  },
  {
    key: 'reports',
    label: 'Relatórios de Metas',
    description: 'Envio de feedback e fotos da conclusão de metas',
    icon: FileText,
    color: '#4F46E5',
  },
];

export default function AdminScreen() {
  const { 
    currentUser, 
    profiles, 
    ministries, 
    createAccount, 
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
    createMinistry,
    updateMinistry,
    deleteMinistry,
    deleteAllMinistries,
    featureSettings,
    toggleFeature,
    theme 
  } = useApp();

  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  // RBAC Guard: Apenas Administrador Geral pode acessar
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (currentUser && !isAdmin) {
      Alert.alert('Acesso Negado', 'Apenas o Administrador Geral possui autorização para este painel.');
      router.replace('/');
    }
  }, [currentUser, isAdmin]);

  const [activeTab, setActiveTab] = useState<AdminTab>('accounts');

  // Estado: Criação / Edição de Contas
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [accFullName, setAccFullName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accPassword, setAccPassword] = useState('123456');
  const [accRole, setAccRole] = useState<UserRole>('leader');
  const [accMinistryId, setAccMinistryId] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Estado: Criação / Edição de Ministérios
  const [showMinistryModal, setShowMinistryModal] = useState(false);
  const [editingMinistryId, setEditingMinistryId] = useState<string | null>(null);
  const [minName, setMinName] = useState('');
  const [minDescription, setMinDescription] = useState('');
  const [minColor, setMinColor] = useState('#2563EB');
  const [minIcon, setMinIcon] = useState('users');
  const [minLeaderId, setMinLeaderId] = useState('');
  const [savingMinistry, setSavingMinistry] = useState(false);

  if (!isAdmin) {
    return (
      <View style={[styles.deniedContainer, { backgroundColor: themeColors.background }]}>
        <AlertTriangle size={48} color="#DC2626" />
        <Text style={[styles.deniedTitle, { color: themeColors.textPrimary }]}>Acesso Restrito</Text>
        <Text style={[styles.deniedSub, { color: themeColors.textSecondary }]}>
          Você não possui privilégios de Administrador Geral para acessar este painel.
        </Text>
      </View>
    );
  }

  // ==========================================
  // HANDLERS: CONTAS
  // ==========================================
  const openNewAccountModal = () => {
    setEditingUserId(null);
    setAccFullName('');
    setAccEmail('');
    setAccPhone('');
    setAccPassword('123456');
    setAccRole('leader');
    setAccMinistryId(ministries[0]?.id || '');
    setShowAccountModal(true);
  };

  const openEditAccountModal = (p: Profile) => {
    setEditingUserId(p.id);
    setAccFullName(p.full_name);
    setAccEmail(p.email);
    setAccPhone(p.phone || '');
    setAccPassword('');
    setAccRole(p.role);
    setAccMinistryId(p.ministry_id || '');
    setShowAccountModal(true);
  };

  const handleSaveAccount = async () => {
    if (savingAccount) return;

    if (!accFullName.trim() || !accEmail.trim()) {
      Alert.alert('Dados Incompletos', 'Preencha o nome completo e o e-mail de acesso.');
      return;
    }

    setSavingAccount(true);
    try {
      if (editingUserId) {
        // Atualizando conta existente
        const target = profiles.find(p => p.id === editingUserId);
        if (!target) throw new Error('Conta não localizada.');

        const ministryObj = ministries.find(m => m.id === accMinistryId);
        await updateAccount({
          ...target,
          full_name: accFullName.trim(),
          email: accEmail.trim().toLowerCase(),
          phone: accPhone.trim(),
          role: accRole,
          ministry_id: accRole === 'leader' || accRole === 'volunteer' ? accMinistryId : undefined,
          ministry_name: (accRole === 'leader' || accRole === 'volunteer') ? ministryObj?.name : undefined,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Sucesso', `Conta de ${accFullName} atualizada com sucesso!`);
      } else {
        // Criando nova conta
        await createAccount({
          full_name: accFullName.trim(),
          email: accEmail.trim().toLowerCase(),
          phone: accPhone.trim(),
          role: accRole,
          ministry_id: (accRole === 'leader' || accRole === 'volunteer') ? accMinistryId : undefined,
          password: accPassword.trim() || '123456',
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Conta Criada!', `A conta para ${accFullName} foi criada. Senha inicial: ${accPassword.trim() || '123456'}`);
      }

      setShowAccountModal(false);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar os dados da conta.');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = (userId: string, name: string) => {
    if (userId === currentUser?.id) {
      Alert.alert('Ação Não Permitida', 'Você não pode excluir sua própria conta logada.');
      return;
    }

    Alert.alert(
      'Confirmar Exclusão de Conta',
      `Tem certeza que deseja apagar permanentemente a conta de "${name}"? Esta ação removerá o acesso do usuário.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteAccount(userId);
              Alert.alert('Conta Excluída', `O usuário ${name} foi removido do sistema.`);
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Não foi possível excluir a conta.');
            }
          }
        }
      ]
    );
  };

  const handleToggle = async (userId: string, currentStatus: boolean, name: string) => {
    if (togglingId) return;

    if (userId === currentUser?.id) {
      Alert.alert('Ação Não Permitida', 'Você não pode desativar sua própria conta.');
      return;
    }

    setTogglingId(userId);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await toggleAccountStatus(userId);
      Alert.alert(
        currentStatus ? 'Conta Suspensa' : 'Conta Reativada',
        `O acesso de ${name} foi ${currentStatus ? 'suspenso' : 'reativado'}.`
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível alterar o status da conta.');
    } finally {
      setTogglingId(null);
    }
  };

  // ==========================================
  // HANDLERS: MINISTÉRIOS
  // ==========================================
  const openNewMinistryModal = () => {
    setEditingMinistryId(null);
    setMinName('');
    setMinDescription('');
    setMinColor('#2563EB');
    setMinIcon('users');
    setMinLeaderId(profiles[0]?.id || '');
    setShowMinistryModal(true);
  };

  const openEditMinistryModal = (m: Ministry) => {
    setEditingMinistryId(m.id);
    setMinName(m.name);
    setMinDescription(m.description || '');
    setMinColor(m.color_hex || '#2563EB');
    setMinIcon(m.icon_name || 'users');
    setMinLeaderId(m.leader_id || '');
    setShowMinistryModal(true);
  };

  const handleSaveMinistry = async () => {
    if (savingMinistry) return;

    if (!minName.trim()) {
      Alert.alert('Nome Obrigatório', 'Por favor, informe o nome do ministério.');
      return;
    }

    const leader = profiles.find(p => p.id === minLeaderId);

    setSavingMinistry(true);
    try {
      if (editingMinistryId) {
        await updateMinistry({
          id: editingMinistryId,
          name: minName.trim(),
          description: minDescription.trim(),
          color_hex: minColor,
          icon_name: minIcon,
          leader_id: leader?.id,
          leader_name: leader?.full_name,
          leader_phone: leader?.phone,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Ministério Atualizado', `O ministério "${minName}" foi atualizado com sucesso!`);
      } else {
        await createMinistry({
          name: minName.trim(),
          description: minDescription.trim(),
          color_hex: minColor,
          icon_name: minIcon,
          leader_id: leader?.id,
          leader_name: leader?.full_name,
          leader_phone: leader?.phone,
          member_count: 0,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Ministério Criado', `O ministério "${minName}" foi adicionado com sucesso!`);
      }
      setShowMinistryModal(false);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao salvar ministério.');
    } finally {
      setSavingMinistry(false);
    }
  };

  const handleDeleteMinistry = (id: string, name: string) => {
    Alert.alert(
      'Excluir Ministério',
      `Tem certeza que deseja apagar o ministério "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteMinistry(id);
              Alert.alert('Excluído', `O ministério "${name}" foi removido.`);
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Falha ao excluir ministério.');
            }
          }
        }
      ]
    );
  };

  const handlePurgeAllMinistries = () => {
    Alert.alert(
      '⚠️ APAGAR TODOS OS MINISTÉRIOS',
      'Tem certeza absoluta que deseja excluir TODOS os ministérios existentes da igreja? Esta ação limpará todo o banco de ministérios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Apagar Tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteAllMinistries();
              Alert.alert('Ministérios Apagados', 'Todos os ministérios foram removidos do aplicativo e da nuvem.');
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Falha ao apagar todos os ministérios.');
            }
          }
        }
      ]
    );
  };

  // Separa contas admin e outras contas
  const adminProfiles = profiles.filter(p => p.role === 'admin' || p.email.toLowerCase() === 'lokoporgame194@gmail.com');
  const otherProfiles = profiles.filter(p => p.role !== 'admin' && p.email.toLowerCase() !== 'lokoporgame194@gmail.com');

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      {/* Cabeçalho do Painel Admin */}
      <View style={styles.header}>
        <View style={styles.adminBadge}>
          <ShieldCheck size={18} color="#DC2626" />
          <Text style={styles.adminBadgeText}>PAINEL DO ADMINISTRADOR</Text>
        </View>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          Central de Gestão & Controle Geral
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Gerenciamento total de contas, ministérios e ativação de módulos da igreja.
        </Text>
      </View>

      {/* Navegação por Abas Segmentadas */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: themeColors.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('accounts')}
          style={[
            styles.tabItem,
            activeTab === 'accounts' && [styles.tabItemActive, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]
          ]}
        >
          <Users size={16} color={activeTab === 'accounts' ? Colors.primary.DEFAULT : themeColors.textSecondary} />
          <Text style={[
            styles.tabItemText,
            { color: activeTab === 'accounts' ? (isDark ? '#FFFFFF' : '#0F172A') : themeColors.textSecondary },
            activeTab === 'accounts' && styles.tabItemTextActive
          ]}>
            Contas ({profiles.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('ministries')}
          style={[
            styles.tabItem,
            activeTab === 'ministries' && [styles.tabItemActive, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]
          ]}
        >
          <Layers size={16} color={activeTab === 'ministries' ? Colors.primary.DEFAULT : themeColors.textSecondary} />
          <Text style={[
            styles.tabItemText,
            { color: activeTab === 'ministries' ? (isDark ? '#FFFFFF' : '#0F172A') : themeColors.textSecondary },
            activeTab === 'ministries' && styles.tabItemTextActive
          ]}>
            Ministérios ({ministries.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('features')}
          style={[
            styles.tabItem,
            activeTab === 'features' && [styles.tabItemActive, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]
          ]}
        >
          <Settings2 size={16} color={activeTab === 'features' ? Colors.primary.DEFAULT : themeColors.textSecondary} />
          <Text style={[
            styles.tabItemText,
            { color: activeTab === 'features' ? (isDark ? '#FFFFFF' : '#0F172A') : themeColors.textSecondary },
            activeTab === 'features' && styles.tabItemTextActive
          ]}>
            Módulos
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* ABA 1: CONTAS E ACESSOS */}
      {/* ======================================================== */}
      {activeTab === 'accounts' && (
        <View>
          {/* Card Destaque: Contas de Administrador Geral Centralizadas */}
          <Card 
            style={[
              styles.adminMasterCard,
              { 
                backgroundColor: isDark ? '#1E293B' : '#FFFBEB',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A'
              }
            ]}
          >
            <View style={styles.adminMasterRow}>
              <View style={styles.adminMasterIcon}>
                <Lock size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.adminMasterTitle, { color: themeColors.textPrimary }]}>
                  Administradores do Sistema ({adminProfiles.length})
                </Text>
                <Text style={[styles.adminMasterSub, { color: themeColors.textSecondary }]}>
                  Acesso irrestrito com privilégios de configuração, segurança e controle total.
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 12, gap: 8 }}>
              {adminProfiles.map(p => (
                <View 
                  key={p.id}
                  style={[
                    styles.adminAccountItem,
                    { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: themeColors.border }
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.adminAccountName, { color: themeColors.textPrimary }]}>
                      {p.full_name} {p.id === currentUser?.id ? '(Você)' : ''}
                    </Text>
                    <Text style={[styles.adminAccountEmail, { color: themeColors.textSecondary }]}>
                      {p.email}
                    </Text>
                  </View>
                  <Badge label="ROOT ADMIN" bgColor="#DC2626" textColor="#FFFFFF" size="sm" />
                </View>
              ))}
            </View>
          </Card>

          {/* Botão de Criação de Nova Conta */}
          <Button
            title={showAccountModal ? 'Fechar Formulário' : '+ Cadastrar Nova Conta de Acesso'}
            onPress={() => showAccountModal ? setShowAccountModal(false) : openNewAccountModal()}
            variant={showAccountModal ? 'outline' : 'primary'}
            icon={showAccountModal ? <X size={18} color={Colors.primary.DEFAULT} /> : <UserPlus size={18} color="#FFFFFF" />}
            style={{ marginVertical: 14 }}
          />

          {/* Formulário Inline de Criação/Edição de Conta */}
          {showAccountModal && (
            <Card style={styles.formCard}>
              <Text style={[styles.formTitle, { color: themeColors.textPrimary }]}>
                {editingUserId ? 'Editar Dados da Conta' : 'Nova Credencial Autorizada'}
              </Text>

              <Input
                label="Nome Completo *"
                placeholder="Ex: Pastor Carlos ou Mariana Silva"
                value={accFullName}
                onChangeText={setAccFullName}
              />

              <Input
                label="E-mail de Acesso *"
                placeholder="usuario@metodistaaliado.com.br"
                value={accEmail}
                onChangeText={setAccEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Telefone com DDD (WhatsApp)"
                placeholder="11988887777"
                value={accPhone}
                onChangeText={setAccPhone}
                keyboardType="phone-pad"
              />

              {!editingUserId && (
                <Input
                  label="Senha Inicial (padrão: 123456)"
                  placeholder="Digite a senha"
                  value={accPassword}
                  onChangeText={setAccPassword}
                  secureTextEntry
                />
              )}

              {/* Seletor de Papel / Role */}
              <Text style={[styles.formLabel, { color: themeColors.textPrimary }]}>Papel / Função no Aplicativo *</Text>
              <View style={styles.rolesRow}>
                {[
                  { id: 'admin', label: 'Admin Geral' },
                  { id: 'pastor', label: 'Pastor' },
                  { id: 'leader', label: 'Líder' },
                  { id: 'secretaria', label: 'Secretária' },
                  { id: 'maad', label: 'MAAD' },
                  { id: 'volunteer', label: 'Voluntário' },
                  { id: 'member', label: 'Membro' },
                ].map(r => {
                  const isSelected = accRole === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      activeOpacity={0.8}
                      onPress={() => setAccRole(r.id as UserRole)}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: isSelected 
                            ? (isDark ? '#DC2626' : '#0F172A') 
                            : themeColors.cardBg,
                          borderColor: isSelected 
                            ? (isDark ? '#DC2626' : '#0F172A') 
                            : themeColors.cardBorder,
                        }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.roleChipText, 
                          { color: isSelected ? '#FFFFFF' : themeColors.textPrimary }
                        ]}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Se for Líder ou Voluntário, selecionar ministério se houver algum */}
              {(accRole === 'leader' || accRole === 'volunteer') && ministries.length > 0 && (
                <View style={{ marginVertical: 8 }}>
                  <Text style={[styles.formLabel, { color: themeColors.textPrimary }]}>
                    Vincular a um Ministério:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {ministries.map(min => {
                      const isSelected = accMinistryId === min.id;
                      return (
                        <TouchableOpacity
                          key={min.id}
                          activeOpacity={0.7}
                          onPress={() => setAccMinistryId(min.id)}
                          style={[
                            styles.minChip, 
                            {
                              backgroundColor: isSelected ? min.color_hex : themeColors.subtleBg,
                              borderColor: isSelected ? min.color_hex : themeColors.chipBorder,
                            }
                          ]}
                        >
                          <Text 
                            style={[
                              styles.minChipText, 
                              { color: isSelected ? '#FFFFFF' : themeColors.textPrimary },
                              isSelected ? { fontWeight: '800' } : null
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

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setShowAccountModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title={editingUserId ? 'Salvar Alterações' : 'Criar Conta'}
                  variant="primary"
                  loading={savingAccount}
                  onPress={handleSaveAccount}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {/* Lista de Contas Cadastradas */}
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Demais Usuários da Igreja ({otherProfiles.length})
          </Text>

          {otherProfiles.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyCardTitle, { color: themeColors.textPrimary }]}>
                Nenhum outro usuário cadastrado
              </Text>
              <Text style={[styles.emptyCardSub, { color: themeColors.textSecondary }]}>
                Todas as contas antigas de teste foram removidas com sucesso. Clique no botão acima para adicionar líderes e voluntários.
              </Text>
            </Card>
          ) : (
            otherProfiles.map(p => {
              const isActive = p.is_active !== false;

              return (
                <Card key={p.id} style={styles.userCard}>
                  <View style={styles.userRow}>
                    <View style={styles.userInfo}>
                      <View style={styles.nameBadgeRow}>
                        <Text style={[styles.userName, { color: themeColors.textPrimary }]}>
                          {p.full_name}
                        </Text>
                        <Badge 
                          label={p.role.toUpperCase()} 
                          bgColor={
                            p.role === 'pastor' ? '#DC2626' :
                            p.role === 'maad' ? '#059669' :
                            p.role === 'secretaria' ? '#0284C7' :
                            p.role === 'leader' ? '#D97706' : '#64748B'
                          }
                          textColor="#FFFFFF"
                          size="sm"
                        />
                      </View>

                      {p.ministry_name && (
                        <Text style={styles.userMinistry}>{p.ministry_name}</Text>
                      )}

                      <View style={styles.contactRow}>
                        <Mail size={12} color={themeColors.textSecondary} />
                        <Text style={[styles.contactText, { color: themeColors.textSecondary }]}>{p.email}</Text>
                      </View>

                      {p.phone ? (
                        <View style={styles.contactRow}>
                          <Phone size={12} color={themeColors.textSecondary} />
                          <Text style={[styles.contactText, { color: themeColors.textSecondary }]}>{p.phone}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Botões de Ação */}
                    <View style={styles.actionsColumn}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => openEditAccountModal(p)}
                        style={[styles.smallActionBtn, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
                      >
                        <Edit3 size={15} color={themeColors.textPrimary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleToggle(p.id, isActive, p.full_name)}
                        disabled={togglingId === p.id}
                        style={[
                          styles.smallActionBtn, 
                          { backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' }
                        ]}
                      >
                        <Power size={15} color={isActive ? '#16A34A' : '#DC2626'} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleDeleteAccount(p.id, p.full_name)}
                        style={[styles.smallActionBtn, { backgroundColor: '#FEE2E2' }]}
                      >
                        <Trash2 size={15} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* ======================================================== */}
      {/* ABA 2: MINISTÉRIOS */}
      {/* ======================================================== */}
      {activeTab === 'ministries' && (
        <View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <Button
              title="+ Novo Ministério"
              variant="primary"
              onPress={openNewMinistryModal}
              icon={<Plus size={18} color="#FFFFFF" />}
              style={{ flex: 1 }}
            />
            {ministries.length > 0 && (
              <Button
                title="Apagar Todos"
                variant="danger"
                onPress={handlePurgeAllMinistries}
                icon={<Trash2 size={16} color="#FFFFFF" />}
              />
            )}
          </View>

          {/* Formulário de Criação/Edição de Ministério */}
          {showMinistryModal && (
            <Card style={styles.formCard}>
              <Text style={[styles.formTitle, { color: themeColors.textPrimary }]}>
                {editingMinistryId ? 'Editar Ministério' : 'Cadastrar Novo Ministério'}
              </Text>

              <Input
                label="Nome do Ministério *"
                placeholder="Ex: Ministério de Louvor, Diaconia, Jovens..."
                value={minName}
                onChangeText={setMinName}
              />

              <Input
                label="Descrição / Propósito"
                placeholder="Ex: Responsável pela adoração musical nos cultos"
                value={minDescription}
                onChangeText={setMinDescription}
                multiline
                numberOfLines={2}
              />

              {/* Seletor de Cores */}
              <Text style={[styles.formLabel, { color: themeColors.textPrimary }]}>Cor de Identificação</Text>
              <View style={styles.colorPresetsRow}>
                {COLOR_PRESETS.map(c => {
                  const isSelected = minColor === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={0.8}
                      onPress={() => setMinColor(c)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        isSelected && styles.colorCircleSelected
                      ]}
                    >
                      {isSelected && <Check size={16} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Seletor de Líder Responsável */}
              {profiles.length > 0 && (
                <View style={{ marginVertical: 8 }}>
                  <Text style={[styles.formLabel, { color: themeColors.textPrimary }]}>
                    Líder Responsável:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {profiles.map(p => {
                      const isSelected = minLeaderId === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          activeOpacity={0.7}
                          onPress={() => setMinLeaderId(p.id)}
                          style={[
                            styles.minChip,
                            {
                              backgroundColor: isSelected ? Colors.primary.DEFAULT : themeColors.subtleBg,
                              borderColor: isSelected ? Colors.primary.DEFAULT : themeColors.chipBorder,
                            }
                          ]}
                        >
                          <Text style={[
                            styles.minChipText,
                            { color: isSelected ? '#FFFFFF' : themeColors.textPrimary }
                          ]}>
                            {p.full_name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setShowMinistryModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title={editingMinistryId ? 'Salvar' : 'Criar Ministério'}
                  variant="primary"
                  loading={savingMinistry}
                  onPress={handleSaveMinistry}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {/* Lista de Ministérios */}
          {ministries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Layers size={36} color={themeColors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyCardTitle, { color: themeColors.textPrimary }]}>
                Nenhum ministério cadastrado
              </Text>
              <Text style={[styles.emptyCardSub, { color: themeColors.textSecondary }]}>
                Os ministérios antigos foram apagados com sucesso conforme sua solicitação. Clique em "+ Novo Ministério" para cadastrar os ministérios oficiais da Igreja Aliado!
              </Text>
            </Card>
          ) : (
            ministries.map(m => (
              <Card key={m.id} style={styles.ministryCard} accentColor={m.color_hex}>
                <View style={styles.ministryRow}>
                  <View style={[styles.ministryColorBadge, { backgroundColor: m.color_hex }]}>
                    <Layers size={20} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ministryName, { color: themeColors.textPrimary }]}>{m.name}</Text>
                    {m.description ? (
                      <Text style={[styles.ministryDesc, { color: themeColors.textSecondary }]}>{m.description}</Text>
                    ) : null}
                    {m.leader_name ? (
                      <Text style={styles.ministryLeader}>Líder: {m.leader_name}</Text>
                    ) : null}
                  </View>
                  <View style={styles.actionsColumn}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => openEditMinistryModal(m)}
                      style={[styles.smallActionBtn, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
                    >
                      <Edit3 size={15} color={themeColors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleDeleteMinistry(m.id, m.name)}
                      style={[styles.smallActionBtn, { backgroundColor: '#FEE2E2' }]}
                    >
                      <Trash2 size={15} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {/* ======================================================== */}
      {/* ABA 3: CONTROLE DE RECURSOS (FEATURE TOGGLES) */}
      {/* ======================================================== */}
      {activeTab === 'features' && (
        <View>
          {/* Card explicativo */}
          <Card 
            style={[
              styles.featuresExplainerCard,
              { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: isDark ? '#334155' : '#BFDBFE' }
            ]}
          >
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <Settings2 size={24} color={Colors.primary.DEFAULT} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.featuresExplainerTitle, { color: themeColors.textPrimary }]}>
                  Modo de Desenvolvimento & Testes
                </Text>
                <Text style={[styles.featuresExplainerText, { color: themeColors.textSecondary }]}>
                  Desative funcionalidades que ainda estão sendo ajustadas. Quando desativada:
                  {'\n'}• O botão <Text style={{ fontWeight: '700' }}>some completamente</Text> para todos os outros usuários.
                  {'\n'}• Para você (Administrador), o botão continuará visível com o aviso <Text style={{ color: '#DC2626', fontWeight: '800' }}>"DESATIVADA"</Text>, permitindo testes normais.
                </Text>
              </View>
            </View>
          </Card>

          <View style={{ gap: 10, marginTop: 14 }}>
            {FEATURE_ITEMS.map(item => {
              const IconComp = item.icon;
              const isEnabled = featureSettings[item.key] !== false;

              return (
                <Card key={item.key} style={styles.featureCard}>
                  <View style={styles.featureRow}>
                    <View style={[styles.featureIconBox, { backgroundColor: item.color + '20' }]}>
                      <IconComp size={22} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.featureTitle, { color: themeColors.textPrimary }]}>
                          {item.label}
                        </Text>
                        {!isEnabled && (
                          <Badge 
                            label="DESATIVADA" 
                            bgColor="#DC2626" 
                            textColor="#FFFFFF" 
                            size="sm" 
                          />
                        )}
                      </View>
                      <Text style={[styles.featureSub, { color: themeColors.textSecondary }]}>
                        {item.description}
                      </Text>
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={async (val) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        await toggleFeature(item.key, val);
                      }}
                      trackColor={{ false: '#CBD5E1', true: Colors.primary.DEFAULT }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      )}
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
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  header: {
    marginBottom: 16,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabItemTextActive: {
    fontWeight: '800',
  },
  adminMasterCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  adminMasterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminMasterIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminMasterTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  adminMasterSub: {
    fontSize: 12,
    marginTop: 2,
  },
  adminAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  adminAccountName: {
    fontSize: 13,
    fontWeight: '700',
  },
  adminAccountEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  formCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 14,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  minChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  minChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 10,
  },
  userCard: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  userMinistry: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  contactText: {
    fontSize: 11,
  },
  actionsColumn: {
    flexDirection: 'row',
    gap: 6,
  },
  smallActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: 10,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyCardSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  ministryCard: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
  },
  ministryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ministryColorBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ministryName: {
    fontSize: 15,
    fontWeight: '800',
  },
  ministryDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  ministryLeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 3,
  },
  featuresExplainerCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  featuresExplainerTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  featuresExplainerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  featureCard: {
    padding: 14,
    borderRadius: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  featureSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
