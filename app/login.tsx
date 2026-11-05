import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { router } from 'expo-router';
import { Flame, Lock, Mail, Sun, Moon, ArrowRight, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { Colors, getThemeColors } from '../src/theme/colors';

export default function LoginScreen() {
  const { signIn, theme, toggleTheme, profiles } = useApp();
  const themeColors = getThemeColors(theme);

  const [role, setRole] = useState<'pastor' | 'leader' | 'maad'>('pastor');
  const [email, setEmail] = useState('pastor@metodistaaliado.com.br');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (selectedRole: 'pastor' | 'leader' | 'maad') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRole(selectedRole);
    if (selectedRole === 'pastor') {
      setEmail('pastor@metodistaaliado.com.br');
    } else if (selectedRole === 'maad') {
      setEmail('maad@metodistaaliado.com.br');
    } else {
      setEmail('mariana.louvor@metodistaaliado.com.br');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Dados Incompletos', 'Por favor, informe seu email e senha de acesso.');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(email, password, role);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        Alert.alert('Acesso Negado', res.error || 'Email ou senha não conferem.');
      }
    } catch {
      Alert.alert('Erro', 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userRole: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEmail(userEmail);
    setRole(userRole as any);
    setPassword('123456');
    const res = await signIn(userEmail, '123456', userRole);
    if (res.success) {
      router.replace('/');
    } else {
      Alert.alert('Erro', res.error || 'Falha ao autenticar.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra Superior com Botão de Tema */}
        <View style={styles.topBar}>
          <View style={styles.churchBadge}>
            <Text style={styles.churchBadgeText}>IGREJA METODISTA ALIADO</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleTheme();
            }}
            style={[styles.themeBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            accessibilityLabel="Alternar Tema Claro e Escuro"
          >
            {theme === 'dark' ? (
              <Sun size={20} color="#F59E0B" />
            ) : (
              <Moon size={20} color="#64748B" />
            )}
          </TouchableOpacity>
        </View>

        {/* Logo Cruz e Chama */}
        <View style={styles.logoSection}>
          <View style={styles.flameCircle}>
            <Flame size={44} color="#FFFFFF" fill="#F59E0B" />
          </View>
          <Text style={[styles.mainTitle, { color: themeColors.textPrimary }]}>Metodista Aliado</Text>
          <Text style={[styles.mainSubtitle, { color: themeColors.textSecondary }]}>
            Portal de Gestão Ministerial, Metas e Finanças MAAD
          </Text>
        </View>

        {/* Seletor de Perfil de Acesso */}
        <View style={[styles.roleSelector, { backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRoleChange('pastor')}
            style={[styles.roleTab, role === 'pastor' ? styles.roleTabActive : null]}
          >
            <Text style={[styles.roleTabText, role === 'pastor' ? styles.roleTabTextActive : { color: themeColors.textSecondary }]}>
              Pastor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRoleChange('leader')}
            style={[styles.roleTab, role === 'leader' ? styles.roleTabActive : null]}
          >
            <Text style={[styles.roleTabText, role === 'leader' ? styles.roleTabTextActive : { color: themeColors.textSecondary }]}>
              Líder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRoleChange('maad')}
            style={[styles.roleTab, role === 'maad' ? styles.roleTabActive : null]}
          >
            <Text style={[styles.roleTabText, role === 'maad' ? styles.roleTabTextActive : { color: themeColors.textSecondary }]}>
              MAAD (Finanças)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card do Formulário */}
        <View style={[styles.formCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Input
            label="Email institucional *"
            placeholder="seu.email@metodistaaliado.com.br"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Senha de acesso *"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="Acessar o Aplicativo"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            style={{ marginTop: 8 }}
          />
        </View>

        {/* Acesso Rápido para Demonstração */}
        <View style={styles.quickAccessSection}>
          <Text style={[styles.quickAccessTitle, { color: themeColors.textSecondary }]}>
            Acessos rápidos de teste:
          </Text>

          <View style={styles.quickButtonsGrid}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleQuickLogin('pastor@metodistaaliado.com.br', 'pastor')}
              style={[styles.quickBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            >
              <Text style={[styles.quickBtnText, { color: themeColors.textPrimary }]}>👔 Pastor Carlos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleQuickLogin('maad@metodistaaliado.com.br', 'maad')}
              style={[styles.quickBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            >
              <Text style={[styles.quickBtnText, { color: '#059669', fontWeight: '800' }]}>📊 Equipe MAAD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleQuickLogin('mariana.louvor@metodistaaliado.com.br', 'leader')}
              style={[styles.quickBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            >
              <Text style={[styles.quickBtnText, { color: themeColors.textPrimary }]}>🎵 Mariana (Louvor)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleQuickLogin('lucas.jovens@metodistaaliado.com.br', 'leader')}
              style={[styles.quickBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            >
              <Text style={[styles.quickBtnText, { color: themeColors.textPrimary }]}>🔥 Lucas (Jovens)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  churchBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  churchBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  themeBtn: {
    width: 44, // UI/UX Pro Max área mínima
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  flameCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DC2626',
    borderWidth: 3,
    borderColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mainSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  roleSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    minHeight: 44, // UI/UX Pro Max touch target
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  roleTabActive: {
    backgroundColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickAccessSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44, // UI/UX Pro Max
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
