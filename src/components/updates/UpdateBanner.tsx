import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, ArrowDownCircle, X, ExternalLink, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../context/AppContext';
import { getThemeColors, Colors } from '../../theme/colors';
import { 
  checkForAppUpdates, 
  applyAppUpdate, 
  AppUpdateCheckResult 
} from '../../services/appUpdates';

export const UpdateBanner: React.FC = () => {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [updateInfo, setUpdateInfo] = useState<AppUpdateCheckResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await checkForAppUpdates();
        if (isMounted && result.hasUpdate) {
          setUpdateInfo(result);
        }
      } catch {
        // Silêncio em caso de erro de rede
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!updateInfo || !updateInfo.hasUpdate || dismissed) {
    return null;
  }

  const handleUpdatePress = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setApplying(true);
    try {
      await applyAppUpdate(updateInfo);
    } finally {
      setApplying(false);
    }
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissed(true);
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? 'rgba(220, 38, 38, 0.16)' : '#FEF2F2',
          borderColor: isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA',
        }
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Sparkles size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { color: isDark ? '#F87171' : '#DC2626' }]}>
            Nova Versão Disponível: v{updateInfo.latestVersion || 'Mais Recente'}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={handleDismiss} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Fechar aviso de atualização"
        >
          <X size={18} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.notes, { color: themeColors.textSecondary }]} numberOfLines={2}>
        {updateInfo.releaseNotes}
      </Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleUpdatePress}
          disabled={applying}
          style={[styles.updateBtn, { backgroundColor: isDark ? '#DC2626' : Colors.primary.DEFAULT }]}
        >
          {applying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              {updateInfo.type === 'ota' ? (
                <RefreshCw size={14} color="#FFFFFF" />
              ) : (
                <ArrowDownCircle size={14} color="#FFFFFF" />
              )}
              <Text style={styles.updateBtnText}>
                {updateInfo.type === 'ota' ? 'Instalar & Reiniciar' : 'Atualizar pelo App'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handleDismiss} 
          style={styles.laterBtn}
        >
          <Text style={[styles.laterBtnText, { color: themeColors.textSecondary }]}>Mais tarde</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  notes: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 38,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  laterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  laterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
