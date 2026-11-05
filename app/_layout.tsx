import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../src/context/AppContext';
import { registerForPushNotificationsAsync } from '../src/services/notifications';
import { getThemeColors } from '../src/theme/colors';

function RootNavigator() {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: themeColors.background },
          headerStyle: { backgroundColor: isDark ? '#1E293B' : '#0F172A' },
          headerTintColor: '#FFFFFF',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="admin"
          options={{
            headerShown: true,
            title: 'Painel do Administrador',
          }}
        />
        <Stack.Screen
          name="maad"
          options={{
            headerShown: true,
            title: 'MAAD • Finanças & Orçamentos',
          }}
        />
        <Stack.Screen
          name="budgets/new"
          options={{
            headerShown: true,
            title: 'Solicitar Orçamento',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="schedules/edit"
          options={{
            headerShown: true,
            title: 'Editar Escala do Ministério',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="goals/new"
          options={{
            headerShown: true,
            title: 'Nova Meta Pastoral',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="goals/[id]"
          options={{
            headerShown: true,
            title: 'Detalhes da Meta',
          }}
        />
        <Stack.Screen
          name="report/[id]"
          options={{
            headerShown: true,
            title: 'Entregar Relatório',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="birthdays"
          options={{
            headerShown: true,
            title: 'Central de Aniversariantes',
          }}
        />
        <Stack.Screen
          name="expenses"
          options={{
            headerShown: true,
            title: 'Comprovantes & Gastos',
          }}
        />
        <Stack.Screen
          name="announcements"
          options={{
            headerShown: true,
            title: 'Mural de Avisos Pastorais',
          }}
        />
        <Stack.Screen
          name="calendar"
          options={{
            headerShown: true,
            title: 'Agenda da Igreja',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
