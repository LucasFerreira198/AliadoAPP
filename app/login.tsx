import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Flame, ArrowRight, HelpCircle, Sun, Moon } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { Colors, getThemeColors } from '../src/theme/colors';

export default function LoginScreen() {
  const { signIn, signInWithGoogle, theme, toggleTheme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await signInWithGoogle();
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Autenticação Google', res.error || 'Não foi possível concluir o login com o Google.');
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao autenticar com o Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra Superior com Badge e Toggle de Tema */}
        <View style={styles.topBar}>
          <View style={[styles.churchBadge, { backgroundColor: Colors.primary.DEFAULT }]}>
            <Text style={styles.churchBadgeText}>METODISTA ALIADO</Text>
          </View>
          <TouchableOpacity 
            style={[styles.themeBtn, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            {isDark ? (
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
            disabled={googleLoading}
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            style={{ marginTop: 8 }}
          />

          {/* Divisor "ou continue com" */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            <Text style={[styles.dividerText, { color: themeColors.textSecondary }]}>ou continue com</Text>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
          </View>

          {/* Botão de Login com Google */}
          <TouchableOpacity
            style={[
              styles.googleButton, 
              { 
                borderColor: themeColors.border, 
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF' 
              }
            ]}
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={themeColors.textPrimary} />
            ) : (
              <>
                <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginRight: 10 }}>
                  <Path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <Path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <Path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <Path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </Svg>
                <Text style={[styles.googleButtonText, { color: themeColors.textPrimary }]}>
                  Entrar com o Google
                </Text>
              </>
            )}
          </TouchableOpacity>

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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  helpLinkText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
