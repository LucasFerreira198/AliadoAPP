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
import { Flame, Lock, Mail, Sun, Moon, ArrowRight, HelpCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { Colors, getThemeColors } from '../src/theme/colors';

export default function LoginScreen() {
  const { signIn, theme, toggleTheme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Graça e Paz!', 
        'Por favor, preencha seu e-mail e sua senha de acesso cadastrada na secretaria.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(email.trim(), password.trim());
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Não foi possível entrar', res.error || 'E-mail ou senha incorretos.');
      }
    } catch {
      Alert.alert('Erro no Sistema', 'Ocorreu uma falha ao autenticar. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra Superior */}
        <View style={styles.topBar}>
          <View style={[styles.churchBadge, { backgroundColor: isDark ? '#1E293B' : '#0F172A' }]}>
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
          <View style={[styles.flameCircle, { backgroundColor: Colors.primary.DEFAULT }]}>
            <Flame size={42} color="#FFFFFF" fill="#F59E0B" />
          </View>
          <Text style={[styles.greetingTitle, { color: themeColors.textPrimary }]}>
            Graça e Paz!
          </Text>
          <Text style={[styles.mainSubtitle, { color: themeColors.textSecondary }]}>
            Portal Integrado de Liderança, Ministérios, Agenda e Finanças MAAD
          </Text>
        </View>

        {/* Card do Formulário de Acesso */}
        <View style={[styles.formCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.cardHeaderTitle, { color: themeColors.textPrimary }]}>
            Identificação de Acesso
          </Text>
          <Text style={[styles.cardHeaderSub, { color: themeColors.textSecondary }]}>
            Digite suas credenciais institucionais para acessar seus ministérios.
          </Text>

          <Input
            label="E-mail Institucional ou Pessoal *"
            placeholder="usuario@metodistaaliado.com.br"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Senha de Acesso *"
            placeholder="Digite sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="Entrar no Portal"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            style={{ marginTop: 8 }}
          />

          {/* Ajuda Pastoral e Suporte */}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.helpLink}
            onPress={() => {
              Alert.alert(
                'Primeiro Acesso ou Redefinição',
                'Para cadastrar novos líderes, alterar sua senha ou solicitar acesso aos ministérios, procure a Secretaria da igreja ou o Pastor titular.'
              );
            }}
          >
            <HelpCircle size={15} color={themeColors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.helpLinkText, { color: themeColors.textSecondary }]}>
              Primeiro acesso ou esqueceu a senha?
            </Text>
          </TouchableOpacity>
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
    paddingTop: 48,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  churchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  churchBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  flameCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#C5221F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  mainSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardHeaderSub: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  helpLinkText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
