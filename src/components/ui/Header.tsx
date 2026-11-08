import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { router } from 'expo-router';
import { 
  Flame, 
  WifiOff, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  ShieldCheck, 
  X,
  Mail,
  Phone
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../context/AppContext';
import { Colors, getThemeColors } from '../../theme/colors';
import { getCurrentAppVersion } from '../../services/appUpdates';

export const Header: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { 
    currentUser, 
    isOffline, 
    offlineQueueCount,
    theme,
    toggleTheme,
    signOut
  } = useApp();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const themeColors = getThemeColors(theme);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProfileModalVisible(false);
    await signOut();
    router.replace('/login');
  };

  const getRoleLabel = () => {
    if (!currentUser) return 'Visitante';
    switch (currentUser.role) {
      case 'admin':
        return 'Admin Geral';
      case 'pastor':
        return 'Pastor Titular';
      case 'secretaria':
        return 'Secretária';
      case 'maad':
        return 'MAAD';
      default:
        return currentUser.ministry_name?.split(' ')[0] || 'Líder';
    }
  };

  const getRoleColor = () => {
    if (!currentUser) return '#94A3B8';
    switch (currentUser.role) {
      case 'admin':
        return '#F59E0B';
      case 'pastor':
        return '#DC2626';
      case 'secretaria':
        return '#38BDF8';
      case 'maad':
        return '#4ADE80';
      default:
        return '#F87171';
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Banner de Modo Offline */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#FFFFFF" />
          <Text style={styles.offlineText}>
            Modo Offline ativo {offlineQueueCount > 0 ? `(${offlineQueueCount} pendente(s) de sincronização)` : ''}
          </Text>
        </View>
      )}

      <View style={styles.contentRow}>
        {/* Identidade Metodista Aliado */}
        <View style={styles.brandContainer}>
          <View style={styles.flameIconBox}>
            <Flame size={20} color="#FFFFFF" fill="#F59E0B" />
          </View>
          <View>
            <Text style={styles.churchName}>METODISTA ALIADO</Text>
            <Text style={styles.churchSub}>Gestão • Metas • MAAD • Agenda</Text>
          </View>
        </View>

        {/* Ações: Tema + Perfil + Logout */}
        <View style={styles.rightActionsRow}>
          {/* Alternar Tema Claro / Escuro */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleTheme();
            }}
            style={styles.iconActionBtn}
            accessibilityLabel="Alternar Tema Claro/Escuro"
          >
            {theme === 'dark' ? (
              <Sun size={18} color="#F59E0B" />
            ) : (
              <Moon size={18} color="#CBD5E1" />
            )}
          </TouchableOpacity>

          {/* Perfil Seguro (Abre Detalhes do Usuário Conectado) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setProfileModalVisible(true)}
            style={styles.profileBtn}
            accessibilityLabel="Ver perfil da conta"
          >
            {currentUser?.avatar_url ? (
              <Image source={{ uri: currentUser.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{currentUser?.full_name?.[0] || 'U'}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser?.full_name?.split(' ')[0] || 'Entrar'}
              </Text>
              <Text style={[styles.roleText, { color: getRoleColor() }]}>
                {getRoleLabel()}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Sair / Logout */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            style={styles.iconActionBtn}
            accessibilityLabel="Sair da conta"
          >
            <LogOut size={16} color="#F87171" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Informações da Sessão do Usuário Conectado */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color={Colors.primary.DEFAULT} />
                <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                  Sessão Autenticada
                </Text>
              </View>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <X size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {currentUser && (
              <View style={styles.profileDetailsBox}>
                <View style={styles.profileCenterRow}>
                  {currentUser.avatar_url ? (
                    <Image source={{ uri: currentUser.avatar_url }} style={styles.modalAvatar} />
                  ) : (
                    <View style={styles.modalAvatarFallback}>
                      <User size={32} color="#FFFFFF" />
                    </View>
                  )}
                  <Text style={[styles.modalUserName, { color: themeColors.textPrimary }]}>
                    {currentUser.full_name}
                  </Text>
                  <Text style={[styles.modalRoleBadge, { color: getRoleColor() }]}>
                    {currentUser.role.toUpperCase()}
                  </Text>
                </View>

                {currentUser.ministry_name && (
                  <Text style={[styles.modalMinistry, { color: themeColors.textSecondary }]}>
                    {currentUser.ministry_name}
                  </Text>
                )}

                <View style={[styles.detailItem, { borderTopColor: themeColors.border }]}>
                  <Mail size={16} color={themeColors.textSecondary} />
                  <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                    {currentUser.email}
                  </Text>
                </View>

                {currentUser.phone && (
                  <View style={styles.detailItem}>
                    <Phone size={16} color={themeColors.textSecondary} />
                    <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                      {currentUser.phone}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              style={styles.logoutBtn}
            >
              <LogOut size={16} color="#DC2626" />
              <Text style={styles.logoutBtnText}>Encerrar Sessão</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginTop: 14 }}>
              <Text style={{ fontSize: 11, color: themeColors.textSecondary, fontWeight: '500' }}>
                Igreja Metodista Aliado • v{getCurrentAppVersion()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  offlineBanner: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  churchName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  churchSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 8,
    minHeight: 44,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  profileInfo: {
    maxWidth: 95,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  profileDetailsBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  profileCenterRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  modalAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalRoleBadge: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  modalMinistry: {
    fontSize: 13,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 8,
  },
  detailText: {
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    minHeight: 46,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
