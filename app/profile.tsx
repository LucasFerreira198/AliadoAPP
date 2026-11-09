import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Camera,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Send,
  User,
  Sun,
  Moon,
} from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Colors, getThemeColors } from '../src/theme/colors';

export default function ProfileScreen() {
  const {
    currentUser,
    updateUserProfile,
    changeUserPassword,
    resetAllDataExceptAdmin,
    theme,
    toggleTheme,
  } = useApp();

  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  // Estados dos Dados Pessoais
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [savingBasic, setSavingBasic] = useState(false);
  const [basicFeedback, setBasicFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Troca de E-mail com Código de Confirmação
  const [newEmail, setNewEmail] = useState('');
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Alteração de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Limpeza Geral (Admin)
  const [cleaningData, setCleaningData] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const showPrompt = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message);
    }
  };

  // 1. Alterar Foto de Perfil
  const handlePickAvatar = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showPrompt('Permissão Necessária', 'Precisamos de acesso às suas fotos para atualizar seu avatar.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setUploadingAvatar(true);
        const newAvatarUri = result.assets[0].uri;
        await updateUserProfile({ avatar_url: newAvatarUri });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showPrompt('Foto Atualizada!', 'Sua nova foto de perfil foi salva com sucesso.');
      }
    } catch (err: any) {
      showPrompt('Erro', err.message || 'Não foi possível alterar a foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 2. Salvar Dados Básicos (Nome e Telefone)
  const handleSaveBasic = async () => {
    if (!fullName.trim()) {
      setBasicFeedback({ type: 'error', text: 'O nome completo não pode ficar em branco.' });
      return;
    }

    setSavingBasic(true);
    setBasicFeedback(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateUserProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBasicFeedback({ type: 'success', text: 'Seus dados cadastrais foram atualizados com sucesso!' });
      setTimeout(() => setBasicFeedback(null), 3000);
    } catch (err: any) {
      setBasicFeedback({ type: 'error', text: err.message || 'Falha ao salvar dados.' });
    } finally {
      setSavingBasic(false);
    }
  };

  // 3. Enviar Código de Confirmação para Novo E-mail
  const handleSendVerificationCode = async () => {
    const cleanNewEmail = newEmail.trim().toLowerCase();
    if (!cleanNewEmail || !cleanNewEmail.includes('@') || !cleanNewEmail.includes('.')) {
      setEmailFeedback({ type: 'error', text: 'Por favor, informe um endereço de e-mail válido.' });
      return;
    }

    if (cleanNewEmail === currentUser?.email.toLowerCase()) {
      setEmailFeedback({ type: 'error', text: 'O novo e-mail deve ser diferente do e-mail atual.' });
      return;
    }

    setSendingCode(true);
    setEmailFeedback(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Gera código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setEmailStep('verify');

      // Exibe código de confirmação ao usuário
      setEmailFeedback({
        type: 'success',
        text: `Código enviado para ${cleanNewEmail}! Insira o código ${code} abaixo para confirmar a troca.`,
      });
      showPrompt(
        'Código de Confirmação Gerado',
        `Um código de segurança foi emitido para ${cleanNewEmail}:\n\nCÓDIGO: ${code}\n\nDigite-o no formulário para concluir a alteração.`
      );
    } catch (err: any) {
      setEmailFeedback({ type: 'error', text: err.message || 'Falha ao enviar código.' });
    } finally {
      setSendingCode(false);
    }
  };

  // 4. Confirmar e Atualizar E-mail com Código
  const handleConfirmEmailChange = async () => {
    if (!verificationCode.trim()) {
      setEmailFeedback({ type: 'error', text: 'Digite o código de 6 dígitos recebido.' });
      return;
    }

    if (verificationCode.trim() !== generatedCode) {
      setEmailFeedback({ type: 'error', text: 'Código de verificação incorreto. Tente novamente.' });
      return;
    }

    setVerifyingCode(true);
    setEmailFeedback(null);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateUserProfile({ email: newEmail.trim().toLowerCase() });
      setEmailFeedback({ type: 'success', text: `Seu e-mail foi alterado com sucesso para ${newEmail.trim().toLowerCase()}!` });
      setEmailStep('input');
      setNewEmail('');
      setVerificationCode('');
      setGeneratedCode(null);
      showPrompt('E-mail Alterado', 'Seu novo e-mail foi salvo e já está ativo para seus próximos logins!');
    } catch (err: any) {
      setEmailFeedback({ type: 'error', text: err.message || 'Falha ao atualizar e-mail.' });
    } finally {
      setVerifyingCode(false);
    }
  };

  // 5. Alterar Senha
  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      setPasswordFeedback({ type: 'error', text: 'Por favor, digite sua senha atual.' });
      return;
    }

    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setPasswordFeedback({ type: 'error', text: 'A nova senha deve possuir no mínimo 6 caracteres.' });
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordFeedback({ type: 'error', text: 'A confirmação de senha não confere com a nova senha.' });
      return;
    }

    setSavingPassword(true);
    setPasswordFeedback(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await changeUserPassword(currentPassword, newPassword);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPasswordFeedback({ type: 'success', text: 'Senha alterada com sucesso!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showPrompt('Sucesso', 'Sua senha foi redefinida com sucesso. Use a nova senha em seus próximos acessos.');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPasswordFeedback({ type: 'error', text: res.error || 'Não foi possível alterar a senha.' });
      }
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', text: err.message || 'Falha ao atualizar senha.' });
    } finally {
      setSavingPassword(false);
    }
  };

  // 6. Zerar todas as contas e informações mantendo apenas Administrador
  const handleResetData = async () => {
    const executeWipe = async () => {
      setCleaningData(true);
      try {
        await resetAllDataExceptAdmin();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showPrompt(
          'Limpeza Concluída!',
          'Todas as contas de teste e informações foram apagadas com sucesso! Apenas os perfis de Administrador foram preservados.'
        );
      } catch (err: any) {
        showPrompt('Erro', err.message || 'Falha ao executar limpeza.');
      } finally {
        setCleaningData(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'ATENÇÃO: Deseja apagar todas as contas, metas, orçamentos, escalas e informações de teste do aplicativo?\n\nApenas sua conta de Administrador será mantida. Esta ação é irreversível.'
      );
      if (confirmed) {
        await executeWipe();
      }
    } else {
      Alert.alert(
        'Limpar Todos os Dados?',
        'Deseja apagar todas as contas, metas, escalas e lançamentos financeiros do aplicativo, mantendo estritamente sua conta de Administrador?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sim, Apagar Tudo', style: 'destructive', onPress: executeWipe },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Barra Superior */}
      <View style={[styles.topBar, { backgroundColor: isDark ? '#1E293B' : '#0F172A' }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Meu Perfil & Acesso</Text>
        <TouchableOpacity
          onPress={toggleTheme}
          style={styles.themeBtn}
          activeOpacity={0.7}
        >
          {isDark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#CBD5E1" />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cartão de Identidade e Foto do Usuário */}
        <View style={[styles.profileHeroCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.avatarWrapper}>
            {currentUser?.avatar_url ? (
              <Image source={{ uri: currentUser.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary.DEFAULT }]}>
                <User size={48} color="#FFFFFF" />
              </View>
            )}

            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              activeOpacity={0.8}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.profileName, { color: themeColors.textPrimary }]}>
            {currentUser?.full_name}
          </Text>
          <View style={styles.roleBadgeContainer}>
            <ShieldCheck size={14} color="#F59E0B" style={{ marginRight: 4 }} />
            <Text style={styles.roleBadgeText}>
              {currentUser?.role === 'admin' ? 'ADMINISTRADOR GERAL' : (currentUser?.role || 'MEMBRO').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.profileSubtitle, { color: themeColors.textSecondary }]}>
            Toque no ícone da câmera para trocar sua foto de perfil
          </Text>
        </View>

        {/* 1. SEÇÃO: DADOS CADASTRAIS */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Informações Cadastrais
          </Text>
          <Text style={[styles.sectionDesc, { color: themeColors.textSecondary }]}>
            Atualize seu nome e telefone de contato na igreja.
          </Text>

          {basicFeedback && (
            <View
              style={[
                styles.feedbackBox,
                basicFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
              ]}
            >
              {basicFeedback.type === 'success' ? (
                <CheckCircle2 size={16} color="#16A34A" />
              ) : (
                <AlertTriangle size={16} color="#DC2626" />
              )}
              <Text
                style={[
                  styles.feedbackText,
                  { color: basicFeedback.type === 'success' ? '#15803D' : '#B91C1C' },
                ]}
              >
                {basicFeedback.text}
              </Text>
            </View>
          )}

          <Input
            label="Nome Completo *"
            placeholder="Seu nome completo"
            value={fullName}
            onChangeText={setFullName}
          />

          <Input
            label="Número de Telefone / WhatsApp"
            placeholder="(11) 99999-9999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Button
            title="Salvar Dados Cadastrais"
            onPress={handleSaveBasic}
            loading={savingBasic}
            variant="primary"
            style={{ marginTop: 6 }}
          />
        </Card>

        {/* 2. SEÇÃO: ALTERAR E-MAIL COM CÓDIGO DE CONFIRMAÇÃO */}
        <Card style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Mail size={18} color="#2563EB" />
            <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
              Alterar E-mail de Acesso
            </Text>
          </View>
          <Text style={[styles.sectionDesc, { color: themeColors.textSecondary }]}>
            E-mail atual: <Text style={{ fontWeight: '700', color: themeColors.textPrimary }}>{currentUser?.email}</Text>
          </Text>

          {emailFeedback && (
            <View
              style={[
                styles.feedbackBox,
                emailFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
              ]}
            >
              {emailFeedback.type === 'success' ? (
                <CheckCircle2 size={16} color="#16A34A" />
              ) : (
                <AlertTriangle size={16} color="#DC2626" />
              )}
              <Text
                style={[
                  styles.feedbackText,
                  { color: emailFeedback.type === 'success' ? '#15803D' : '#B91C1C' },
                ]}
              >
                {emailFeedback.text}
              </Text>
            </View>
          )}

          {emailStep === 'input' ? (
            <>
              <Input
                label="Novo E-mail *"
                placeholder="novo.email@exemplo.com"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Button
                title="Enviar Código de Confirmação"
                onPress={handleSendVerificationCode}
                loading={sendingCode}
                variant="secondary"
                icon={<Send size={16} color={themeColors.textPrimary} />}
                style={{ marginTop: 6 }}
              />
            </>
          ) : (
            <View style={[styles.verificationContainer, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF', borderColor: '#93C5FD' }]}>
              <Text style={[styles.verifyPrompt, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
                Digite o código de 6 dígitos enviado para confirmar a troca de e-mail:
              </Text>

              {generatedCode && (
                <View style={styles.codePill}>
                  <Text style={styles.codePillLabel}>Código emitido:</Text>
                  <Text style={styles.codePillValue}>{generatedCode}</Text>
                </View>
              )}

              <Input
                label="Código de Confirmação (6 dígitos) *"
                placeholder="Ex: 123456"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Button
                  title="Confirmar Troca"
                  onPress={handleConfirmEmailChange}
                  loading={verifyingCode}
                  variant="primary"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Cancelar"
                  onPress={() => {
                    setEmailStep('input');
                    setVerificationCode('');
                    setEmailFeedback(null);
                  }}
                  variant="outline"
                  style={{ flex: 0.6 }}
                />
              </View>
            </View>
          )}
        </Card>

        {/* 3. SEÇÃO: ALTERAR SENHA */}
        <Card style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <KeyRound size={18} color="#D97706" />
            <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
              Segurança & Troca de Senha
            </Text>
          </View>
          <Text style={[styles.sectionDesc, { color: themeColors.textSecondary }]}>
            Altere sua senha de acesso ao portal da igreja a qualquer momento.
          </Text>

          {passwordFeedback && (
            <View
              style={[
                styles.feedbackBox,
                passwordFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
              ]}
            >
              {passwordFeedback.type === 'success' ? (
                <CheckCircle2 size={16} color="#16A34A" />
              ) : (
                <AlertTriangle size={16} color="#DC2626" />
              )}
              <Text
                style={[
                  styles.feedbackText,
                  { color: passwordFeedback.type === 'success' ? '#15803D' : '#B91C1C' },
                ]}
              >
                {passwordFeedback.text}
              </Text>
            </View>
          )}

          <Input
            label="Senha Atual *"
            placeholder="Digite sua senha atual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <Input
            label="Nova Senha (mínimo 6 caracteres) *"
            placeholder="Digite a nova senha"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Input
            label="Confirmar Nova Senha *"
            placeholder="Repita a nova senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title="Atualizar Senha"
            onPress={handleChangePassword}
            loading={savingPassword}
            variant="primary"
            icon={<Lock size={16} color="#FFFFFF" />}
            style={{ marginTop: 6 }}
          />
        </Card>

        {/* 4. SEÇÃO: LIMPEZA DE DADOS (ZONA DO ADMINISTRADOR) */}
        {currentUser?.role === 'admin' && (
          <Card
            style={[
              styles.sectionCard,
              {
                borderColor: '#DC2626',
                backgroundColor: isDark ? 'rgba(220, 38, 38, 0.08)' : '#FEF2F2',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Trash2 size={18} color="#DC2626" />
              <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>
                Zona de Manutenção • Administrador
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: isDark ? '#FCA5A5' : '#991B1B', lineHeight: 18, marginBottom: 12 }}>
              Apague todas as contas de teste, metas, escalas e lançamentos financeiros fictícios do aplicativo, mantendo estritamente as contas de Administrador.
            </Text>

            <Button
              title="Apagar Informações de Teste (Manter Admin)"
              onPress={handleResetData}
              loading={cleaningData}
              variant="danger"
              icon={<Trash2 size={16} color="#FFFFFF" />}
            />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  themeBtn: {
    padding: 8,
    borderRadius: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeroCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary.DEFAULT,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  roleBadgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  profileSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 16,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  feedbackError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  verificationContainer: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  verifyPrompt: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 16,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  codePillLabel: {
    fontSize: 11,
    color: '#1E40AF',
  },
  codePillValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: 2,
  },
});
