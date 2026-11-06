import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Home, Calendar, Users, Landmark, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../context/AppContext';
import { Colors, getThemeColors } from '../../theme/colors';

interface BottomNavBarProps {
  activeTab?: 'inicio' | 'agenda' | 'escalas' | 'maad' | 'mural';
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab }) => {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { theme, budgets, currentUser } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  // Contagem de pendências para badge visual no MAAD
  const isPastor = currentUser?.role === 'pastor' || currentUser?.role === 'admin';
  const pendingCount = isPastor 
    ? budgets.filter(b => b.status === 'aguardando_pastor').length 
    : budgets.filter(b => b.status === 'encaminhado_maad').length;

  const currentActive = activeTab || (
    pathname === '/' || pathname === '/index' ? 'inicio' :
    pathname.startsWith('/calendar') ? 'agenda' :
    pathname.startsWith('/schedules') ? 'escalas' :
    pathname.startsWith('/maad') ? 'maad' :
    pathname.startsWith('/announcements') ? 'mural' :
    'inicio'
  );

  interface TabItem {
    id: 'inicio' | 'agenda' | 'escalas' | 'maad' | 'mural';
    label: string;
    route: string;
    Icon: any;
    badge?: number;
  }

  const tabs: TabItem[] = [
    {
      id: 'inicio',
      label: 'Início',
      route: '/',
      Icon: Home,
    },
    {
      id: 'agenda',
      label: 'Agenda',
      route: '/calendar',
      Icon: Calendar,
    },
    {
      id: 'escalas',
      label: 'Escalas',
      route: '/schedules/edit',
      Icon: Users,
    },
    {
      id: 'maad',
      label: 'MAAD',
      route: '/maad',
      Icon: Landmark,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'mural',
      label: 'Mural',
      route: '/announcements',
      Icon: Bell,
    },
  ];

  const handleTabPress = (route: string, tabId: string) => {
    if (currentActive === tabId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(route as any);
  };

  return (
    <View 
      style={[
        styles.navContainer,
        {
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopColor: themeColors.border,
          paddingBottom: Math.max(insets.bottom, 10),
        }
      ]}
    >
      <View style={styles.tabsRow}>
        {tabs.map(tab => {
          const isActive = currentActive === tab.id;
          const { Icon } = tab;
          const activeColor = Colors.primary.DEFAULT;
          const inactiveColor = isDark ? '#64748B' : '#94A3B8';

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => handleTabPress(tab.route, tab.id)}
              style={styles.tabBtn}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Aba ${tab.label}`}
            >
              <View style={styles.iconWrapper}>
                <View 
                  style={[
                    styles.iconPill, 
                    isActive && { backgroundColor: isDark ? 'rgba(197, 34, 31, 0.2)' : '#FEE2E2' }
                  ]}
                >
                  <Icon 
                    size={22} 
                    color={isActive ? activeColor : inactiveColor} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </View>
                
                {tab.badge !== undefined && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>

              <Text 
                style={[
                  styles.tabLabel, 
                  { 
                    color: isActive ? (isDark ? '#F87171' : activeColor) : inactiveColor,
                    fontWeight: isActive ? '800' : '600'
                  }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48, // Ergonomia de toque recomendada
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: 4,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
