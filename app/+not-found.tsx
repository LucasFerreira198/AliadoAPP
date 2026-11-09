import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, Stack, router } from 'expo-router';
import { AlertCircle, Home } from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { getThemeColors, Colors } from '../src/theme/colors';

export default function NotFoundScreen() {
  const { theme } = useApp();
  const themeColors = getThemeColors(theme);

  return (
    <>
      <Stack.Screen options={{ title: 'Página Não Encontrada', headerShown: true }} />
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <AlertCircle size={48} color="#DC2626" />
          </View>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            Página Não Encontrada
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            A página ou tela que você tentou acessar não foi localizada ou o link foi atualizado.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.replace('/')}
            style={styles.homeBtn}
          >
            <Home size={18} color="#FFFFFF" />
            <Text style={styles.homeBtnText}>Voltar para a Página Inicial</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
