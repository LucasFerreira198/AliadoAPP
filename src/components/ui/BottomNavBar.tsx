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
  const { theme, budgets, currentUser, isFeatureVisible, isFeatureDisabledForAdmin } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const isPastorOrAdmin = currentUser?.role === 'pastor' || currentUser?.role === 'admin';
  const isMaadAuthorized = isPastorOrAdmin || currentUser?.role === 'maad';
  const isLeaderOrHigher = isPastorOrAdmin || currentUser?.role === 'leader';

  const pendingCount = isPastorOrAdmin
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
    authorized: boolean;
  }

  const allTabs: TabItem[] = [
    {
      id: 'inicio',
      label: 'Início',
      route: '/',
      Icon: Home,
      authorized: true,
    },
    {
      id: 'agenda',
      label: isFeatureDisabledForAdmin('calendar') ? 'Agenda (OFF)' : 'Agenda',
      route: '/calendar',
      Icon: Calendar,
      authorized: isFeatureVisible('calendar'),
    },
    {
      id: 'escalas',
      label: isFeatureDisabledForAdmin('schedules') ? 'Escalas (OFF)' : 'Escalas',
      route: '/schedules/edit',
      Icon: Users,
      authorized: isLeaderOrHigher && isFeatureVisible('schedules'),
    },
    {
      id: 'maad',
      label: isFeatureDisabledForAdmin('maad') ? 'MAAD (OFF)' : 'MAAD',
      route: '/maad',
      Icon: Landmark,
      badge: pendingCount > 0 ? pendingCount : undefined,
      authorized: isMaadAuthorized && isFeatureVisible('maad'),
    },
    {
      id: 'mural',
      label: isFeatureDisabledForAdmin('announcements') ? 'Mural (OFF)' : 'Mural',
      route: '/announcements',
      Icon: Bell,
      authorized: isFeatureVisible('announcements'),
    },
  ];

  const visibleTabs = allTabs.filter(t => t.authorized);

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
        {visibleTabs.map(tab => {
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
              accessibilityLabel={tab.label}
            >
              <View style={styles.iconWrapper}>
                <Icon 
                  size={22} 
                  color={isActive ? activeColor : inactiveColor} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={styles.badgeCircle}>
                    <Text style={styles.badgeText}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
                  </View>
                )}
              </View>

              <Text 
                style={[
                  styles.tabLabel, 
                  { 
                    color: isActive ? activeColor : inactiveColor,
                    fontWeight: isActive ? '800' : '500',
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
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 56,
    minHeight: 46,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  badgeCircle: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
