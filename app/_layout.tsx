import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { AppProvider, useApp } from '../src/context/AppContext';
import { registerForPushNotificationsAsync } from '../src/services/notifications';
import { getThemeColors } from '../src/theme/colors';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Erro crítico não capturado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Ocorreu uma falha inesperada</Text>
          <Text style={styles.errorSubtitle}>
            A equipe técnica da Igreja Metodista Aliado já foi notificada.
          </Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Erro de execução'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={this.handleReset}
            activeOpacity={0.8}
          >
            <RefreshCw size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

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
        <Stack.Screen name="profile" options={{ headerShown: false }} />
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
      <RootErrorBoundary>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </RootErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#F87171',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 46,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
