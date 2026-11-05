import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { 
  Flame, 
  WifiOff, 
  Users, 
  ChevronDown, 
  Check, 
  Sun, 
  Moon, 
  LogOut, 
  ShieldCheck, 
  Landmark, 
  Calendar 
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../context/AppContext';
import { Colors, getThemeColors } from '../../theme/colors';

export const Header: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { 
    currentUser, 
    switchUser, 
    profiles, 
    isOffline, 
    offlineQueueCount,
    theme,
    toggleTheme,
    signOut
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const themeColors = getThemeColors(theme);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace('/login');
  };

  const getRoleLabel = () => {
    if (!currentUser) return 'Visitante';
    switch (currentUser.role) {
      case 'admin':
        return 'Admin Geral';
      case 'pastor':
        return 'Pastor';
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
      {/* Banner de Modo Offline Inteligente */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#FFFFFF" />
          <Text style={styles.offlineText}>
            Modo Offline ativo {offlineQueueCount > 0 ? `(${offlineQueueCount} pendente(s) de envio)` : ''}
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

        {/* Botão de Tema + Perfil + Logout */}
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

          {/* Perfil & Seletor de Papel */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
            style={styles.profileBtn}
            accessibilityLabel="Alterar perfil de usuário"
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
              <View style={styles.roleTag}>
                <Text style={[styles.roleText, { color: getRoleColor() }]}>
                  {getRoleLabel()}
                </Text>
                <ChevronDown size={12} color="#94A3B8" />
              </View>
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

      {/* Modal Seletor de Perfil (Simulação & Testes) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Users size={20} color={Colors.primary.DEFAULT} />
              <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                Alternar Visão do Usuário
              </Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              Selecione o perfil para testar as permissões de cada ministério e liderança:
            </Text>

            <ScrollView style={{ maxHeight: 380 }}>
              {profiles.map(p => {
                const isSelected = p.id === currentUser?.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      switchUser(p.id);
                      setModalVisible(false);
                    }}
                    style={[
                      styles.userOption, 
                      { borderColor: themeColors.border },
                      isSelected ? styles.userOptionSelected : null
                    ]}
                  >
                    <Image source={{ uri: p.avatar_url }} style={styles.optionAvatar} />
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionName, { color: themeColors.textPrimary }]}>{p.full_name}</Text>
                      <Text style={[styles.optionRole, { color: themeColors.textSecondary }]}>
                        {p.role === 'admin' 
                          ? 'Administrador Geral' 
                          : p.role === 'pastor' 
                          ? 'Pastor Titular' 
                          : p.role === 'secretaria' 
                          ? 'Secretária da Igreja' 
                          : p.role === 'maad' 
                          ? 'MAAD (Contabilidade)' 
                          : `${p.ministry_name || 'Líder'}`}
                      </Text>
                    </View>
                    {isSelected && <Check size={20} color={Colors.primary.DEFAULT} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    width: 44, // UI/UX Pro Max touch area
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
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 6,
    minHeight: 44, // UI/UX Pro Max
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
    maxWidth: 85,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 12,
  },
  userOptionSelected: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: '#FEF2F2',
  },
  optionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionRole: {
    fontSize: 12,
    marginTop: 2,
  },
});
