import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { 
  Flame, 
  ArrowRight, 
  HelpCircle, 
  Sun, 
  Moon, 
  X, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  Sparkles,
  AlertTriangle
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { Colors, getThemeColors } from '../src/theme/colors';

export default function LoginScreen() {
  const { currentUser, signIn, signInWithGoogle, resetPassword, theme, toggleTheme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (currentUser) {
      router.replace('/');
    }
  }, [currentUser]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Modal de Primeiro Acesso & Recuperação de Senha
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Modal Seletor de Contas Google (Ambiente Mobile)
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const showAppAlert = (title: string, message?: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`${title}${message ? '\n\n' + message : ''}`);
      }
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async (overrideEmail?: string, overridePass?: string) => {
    const targetEmail = overrideEmail || email;
    const targetPassword = overridePass || password;

    if (!targetEmail.trim() || !targetPassword.trim()) {
      const msg = 'Por favor, preencha seu e-mail e sua senha de acesso cadastrada na secretaria.';
      setLoginError(msg);
      showAppAlert('Graça e Paz!', msg);
      return;
    }

    setLoading(true);
    setLoginError(null);
    try {
      const res = await signIn(targetEmail.trim(), targetPassword.trim());
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errMsg = res.error || 'E-mail ou senha incorretos.';
        setLoginError(errMsg);
        showAppAlert('Não foi possível entrar', errMsg);
      }
    } catch {
      const errMsg = 'Ocorreu uma falha ao autenticar. Verifique sua conexão e tente novamente.';
      setLoginError(errMsg);
      showAppAlert('Erro no Sistema', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS !== 'web') {
      // No Mobile, abre o seletor nativo de contas Google para acesso instantâneo
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setGoogleModalVisible(true);
      return;
    }

    setGoogleLoading(true);
    setLoginError(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await signInWithGoogle();
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errMsg = res.error || 'Não foi possível concluir o login com o Google.';
        setLoginError(errMsg);
        showAppAlert('Autenticação Google', errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Falha ao autenticar com o Google.';
      setLoginError(errMsg);
      showAppAlert('Erro', errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (targetEmail: string) => {
    setGoogleLoading(true);
    setLoginError(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await signInWithGoogle(targetEmail);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setGoogleModalVisible(false);
        router.replace('/');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errMsg = res.error || 'Não foi possível concluir o login com o Google.';
        setLoginError(errMsg);
        showAppAlert('Autenticação Google', errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Falha ao autenticar com o Google.';
      setLoginError(errMsg);
      showAppAlert('Erro', errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      setResetStatus({ success: false, message: 'Digite seu e-mail cadastrado.' });
      return;
    }

    setResetLoading(true);
    setResetStatus(null);
    try {
      const res = await resetPassword(resetEmail.trim());
      setResetStatus(res);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLoginError(null);
        setTimeout(() => {
          setHelpModalVisible(false);
        }, 3000);
      }
    } catch {
      setResetStatus({ success: false, message: 'Não foi possível solicitar redefinição. Verifique sua conexão e tente novamente.' });
    } finally {
      setResetLoading(false);
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

          {/* Banner Visual de Erro (visível em Web e Mobile) */}
          {loginError ? (
            <View style={styles.inlineErrorBox}>
              <View style={styles.inlineErrorContent}>
                <AlertTriangle size={18} color="#DC2626" style={{ marginRight: 8, flexShrink: 0 }} />
                <Text style={styles.inlineErrorText}>{loginError}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setLoginError(null)} 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ) : null}

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
            onPress={() => handleLogin()}
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

          {/* Ajuda Pastoral e Suporte - Abre Modal Interativo */}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.helpLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setResetStatus(null);
              setResetEmail(email);
              setHelpModalVisible(true);
            }}
          >
            <HelpCircle size={15} color={themeColors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.helpLinkText, { color: themeColors.textSecondary }]}>
              Primeiro acesso ou esqueceu a senha?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Interativo de Primeiro Acesso & Recuperação de Senha */}
      <Modal
        visible={helpModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            {/* Cabeçalho do Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <KeyRound size={22} color={Colors.primary.DEFAULT} />
                <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                  Acesso & Senha
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setHelpModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {/* Seção 1: Primeiro Acesso */}
              <View style={[styles.modalSectionCard, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Sparkles size={16} color="#2563EB" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1D4ED8' }}>
                    É seu Primeiro Acesso?
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: isDark ? '#93C5FD' : '#1E40AF', lineHeight: 18 }}>
                  Sua conta deve ser cadastrada previamente pela Administração ou Secretaria da Igreja. Caso necessite de acesso, procure a liderança institucional.
                </Text>
              </View>

              {/* Seção 2: Redefinição Segura de Senha via Firebase Auth */}
              <Text style={[styles.sectionSubtitle, { color: themeColors.textPrimary, marginTop: 14 }]}>
                Recuperação de Senha
              </Text>
              <Text style={[styles.sectionDesc, { color: themeColors.textSecondary }]}>
                Informe seu e-mail institucional para receber um link seguro de redefinição de senha:
              </Text>

              <Input
                label="Seu E-mail Cadastrado"
                placeholder="seu.email@metodistaaliado.com.br"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {resetStatus && (
                <View style={[styles.statusAlert, resetStatus.success ? styles.statusSuccess : styles.statusError]}>
                  {resetStatus.success ? (
                    <CheckCircle2 size={16} color="#16A34A" />
                  ) : (
                    <X size={16} color="#DC2626" />
                  )}
                  <Text style={[styles.statusText, { color: resetStatus.success ? '#15803D' : '#B91C1C' }]}>
                    {resetStatus.message}
                  </Text>
                </View>
              )}

              <Button
                title="Enviar Link de Redefinição"
                onPress={handleResetPassword}
                loading={resetLoading}
                variant="secondary"
                icon={<KeyRound size={16} color={themeColors.textPrimary} />}
                style={{ marginTop: 8 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Seletor de Contas Google no Mobile */}
      <Modal
        visible={googleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </Svg>
                <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                  Entrar com o Google
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setGoogleModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={[styles.sectionDesc, { color: themeColors.textSecondary, marginBottom: 14 }]}>
                Selecione ou informe sua conta Google para acessar o AliadoAPP:
              </Text>

              {/* Opção 1: Lucas Ferreira (Admin) */}
              <TouchableOpacity
                style={[
                  styles.googleAccountCard,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: themeColors.border }
                ]}
                onPress={() => handleSelectGoogleAccount('lokoporgame194@gmail.com')}
                activeOpacity={0.7}
                disabled={googleLoading}
              >
                <View style={styles.googleAccountAvatar}>
                  <Text style={styles.googleAccountAvatarText}>LF</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.googleAccountName, { color: themeColors.textPrimary }]}>
                    Lucas Ferreira
                  </Text>
                  <Text style={[styles.googleAccountEmail, { color: themeColors.textSecondary }]}>
                    lokoporgame194@gmail.com
                  </Text>
                  <View style={styles.adminPill}>
                    <ShieldCheck size={12} color="#DC2626" />
                    <Text style={styles.adminPillText}>Administrador Geral</Text>
                  </View>
                </View>
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <ArrowRight size={18} color={themeColors.textSecondary} />
                )}
              </TouchableOpacity>

              {/* Opção 2: Outra conta @gmail.com */}
              <View style={{ marginTop: 18 }}>
                <Text style={[styles.sectionSubtitle, { color: themeColors.textPrimary, marginBottom: 6 }]}>
                  Ou digite outro e-mail Google:
                </Text>
                <Input
                  label="E-mail @gmail.com"
                  placeholder="seu.nome@gmail.com"
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button
                  title="Continuar com este e-mail"
                  variant="primary"
                  loading={googleLoading}
                  onPress={() => {
                    if (!customGoogleEmail.trim() || !customGoogleEmail.includes('@')) {
                      showAppAlert('Atenção', 'Digite um e-mail do Google válido.');
                      return;
                    }
                    handleSelectGoogleAccount(customGoogleEmail.trim());
                  }}
                  style={{ marginTop: 8 }}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingVertical: 8,
  },
  helpLinkText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSectionCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  statusAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  statusSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  quickAccessList: {
    gap: 8,
    marginTop: 6,
  },
  quickCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  inlineErrorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  inlineErrorText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
    flexShrink: 1,
    lineHeight: 18,
  },
  googleAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  googleAccountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleAccountAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  googleAccountName: {
    fontSize: 15,
    fontWeight: '700',
  },
  googleAccountEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  adminPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});
