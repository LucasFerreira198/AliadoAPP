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
  ShieldCheck, 
  UserPlus, 
  Check, 
  X, 
  Users, 
  Power, 
  Phone, 
  Mail 
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { UserRole } from '../src/types';
import { Colors, getThemeColors } from '../src/theme/colors';

export default function AdminScreen() {
  const { 
    currentUser, 
    profiles, 
    ministries, 
    createAccount, 
    toggleAccountStatus,
    theme 
  } = useApp();

  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [showNewUser, setShowNewUser] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('leader');
  const [selectedMinistryId, setSelectedMinistryId] = useState(ministries[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Dados Incompletos', 'Preencha o nome completo, email e telefone.');
      return;
    }

    setLoading(true);
    try {
      await createAccount({
        full_name: fullName,
        email,
        phone,
        role,
        ministry_id: role === 'leader' ? selectedMinistryId : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Conta Criada!', `O usuário ${fullName} foi cadastrado com sucesso.`);
      setFullName('');
      setEmail('');
      setPhone('');
      setShowNewUser(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar o usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (userId: string, currentStatus: boolean, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleAccountStatus(userId);
    Alert.alert(
      currentStatus ? 'Conta Desativada' : 'Conta Ativada',
      `O acesso de ${name} foi ${currentStatus ? 'suspenso' : 'reativado'}.`
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.adminBadge}>
          <ShieldCheck size={18} color="#DC2626" />
          <Text style={styles.adminBadgeText}>PAINEL DO ADMINISTRADOR</Text>
        </View>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>Gestão de Contas & Acessos</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Criação oficial de credenciais para o Pastor, Secretária, MAAD e Líderes de Ministérios.
        </Text>
      </View>

      <Button
        title={showNewUser ? 'Cancelar' : '+ Cadastrar Nova Conta de Acesso'}
        onPress={() => setShowNewUser(!showNewUser)}
        variant={showNewUser ? 'outline' : 'primary'}
        icon={showNewUser ? <X size={18} color={Colors.primary.DEFAULT} /> : <UserPlus size={18} color="#FFFFFF" />}
        style={{ marginBottom: 16 }}
      />

      {/* Formulário de Criação de Usuário */}
      {showNewUser && (
        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: themeColors.textPrimary }]}>
            Novo Usuário Autorizado
          </Text>

          <Input
            label="Nome Completo *"
            placeholder="Ex: Pr. Carlos Alberto ou Mariana Ramos"
            value={fullName}
            onChangeText={setFullName}
          />

          <Input
            label="Email de Acesso *"
            placeholder="usuario@metodistaaliado.com.br"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Telefone com DDD (WhatsApp) *"
            placeholder="11988887777"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Seletor de Papel */}
          <Text style={[styles.roleSelectLabel, { color: themeColors.textPrimary }]}>Papel no Aplicativo *</Text>
          <View style={styles.rolesRow}>
            {[
              { id: 'pastor', label: 'Pastor' },
              { id: 'leader', label: 'Líder' },
              { id: 'secretaria', label: 'Secretária' },
              { id: 'maad', label: 'MAAD' },
            ].map(r => {
              const isSelected = role === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.8}
                  onPress={() => setRole(r.id as UserRole)}
                  style={[
                    styles.roleBtn,
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
                      styles.roleBtnText, 
                      { color: isSelected ? '#FFFFFF' : themeColors.textPrimary }
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Se for Líder, seleciona o ministério */}
          {role === 'leader' && (
            <View style={{ marginVertical: 8 }}>
              <Text style={[styles.roleSelectLabel, { color: themeColors.textPrimary }]}>
                Ministério sob sua liderança:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {ministries.map(min => {
                  const isSelected = selectedMinistryId === min.id;
                  return (
                    <TouchableOpacity
                      key={min.id}
                      activeOpacity={0.7}
                      onPress={() => setSelectedMinistryId(min.id)}
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

          <Button
            title="Criar e Liberar Conta"
            onPress={handleCreate}
            loading={loading}
            variant="primary"
            size="lg"
            style={{ marginTop: 14 }}
          />
        </Card>
      )}

      {/* Lista de Contas Cadastradas */}
      <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
        Usuários Cadastrados ({profiles.length})
      </Text>

      {profiles.map(p => {
        const isActive = p.is_active !== false;
        return (
          <Card key={p.id} style={styles.userCard}>
            <View style={styles.userRow}>
              <View style={styles.userInfo}>
                <View style={styles.nameBadgeRow}>
                  <Text style={[styles.userName, { color: themeColors.textPrimary }]}>{p.full_name}</Text>
                  <Badge 
                    label={p.role.toUpperCase()} 
                    bgColor={
                      p.role === 'pastor' 
                        ? themeColors.priority.urgente.bg 
                        : p.role === 'maad' 
                        ? themeColors.priority.media.bg 
                        : p.role === 'secretaria' 
                        ? themeColors.priority.baixa.bg 
                        : themeColors.priority.alta.bg
                    }
                    textColor={
                      p.role === 'pastor' 
                        ? themeColors.priority.urgente.text 
                        : p.role === 'maad' 
                        ? themeColors.priority.media.text 
                        : p.role === 'secretaria' 
                        ? themeColors.priority.baixa.text 
                        : themeColors.priority.alta.text
                    }
                  />
                </View>

                {p.ministry_name && (
                  <Text style={styles.userMinistry}>{p.ministry_name}</Text>
                )}

                <View style={styles.contactRow}>
                  <Mail size={12} color={themeColors.textSecondary} />
                  <Text style={[styles.contactText, { color: themeColors.textSecondary }]}>{p.email}</Text>
                </View>

                <View style={styles.contactRow}>
                  <Phone size={12} color={themeColors.textSecondary} />
                  <Text style={[styles.contactText, { color: themeColors.textSecondary }]}>{p.phone}</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleToggle(p.id, isActive, p.full_name)}
                style={[
                  styles.toggleBtn, 
                  {
                    backgroundColor: isActive 
                      ? themeColors.actions.successActionBg 
                      : themeColors.actions.destructiveBg,
                    borderColor: isActive 
                      ? themeColors.actions.successActionBorder 
                      : themeColors.actions.destructiveBorder,
                  }
                ]}
              >
                <Power 
                  size={18} 
                  color={isActive ? themeColors.actions.successActionText : themeColors.actions.destructiveText} 
                />
                <Text 
                  style={[
                    styles.toggleText, 
                    { color: isActive ? themeColors.actions.successActionText : themeColors.actions.destructiveText }
                  ]}
                >
                  {isActive ? 'Ativo' : 'Inativo'}
                </Text>
              </TouchableOpacity>
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
  header: {
    marginBottom: 16,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
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
  formCard: {
    marginBottom: 20,
    borderColor: '#DC2626',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  roleSelectLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  roleBtn: {
    flex: 1,
    minHeight: 44, // UI/UX Pro Max
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleBtnSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  roleBtnTextSelected: {
    color: '#FFFFFF',
  },
  minChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 44,
    justifyContent: 'center',
  },
  minChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  userCard: {
    marginBottom: 10,
    padding: 14,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    paddingRight: 10,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
  },
  userMinistry: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  contactText: {
    fontSize: 12,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 44,
  },
  toggleBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  toggleBtnInactive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
