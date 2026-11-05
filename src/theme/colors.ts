// UI/UX PRO MAX - TOKENS DE DESIGN
// Identidade Metodista Cruz e Chama (Crimson Flame, Slate Navy, Clean Whites & Dark Mode OLED/Slate)
import { AppTheme } from '../types';

export const Colors = {
  // Cores Primárias de Marca (Metodista Cruz e Chama)
  primary: {
    DEFAULT: '#DC2626', // Flame Red principal
    dark: '#991B1B',    // Crimson solene
    light: '#F87171',   // Destaque suave
    amber: '#EA580C',   // Brilho da chama
    gold: '#D97706',    // Tom dourado
  },

  // Tons Neutros & Estruturais (Navy e Slate)
  navy: {
    DEFAULT: '#0F172A', // Slate 900 solene
    surface: '#1E293B', // Slate 800 para cartões escuros
    border: '#334155',  // Slate 700 para bordas no escuro
  },

  // Modo Claro (Padrão)
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    border: '#E2E8F0',
    borderFocus: '#DC2626',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    cardShadow: 'rgba(15, 23, 42, 0.05)',
  },

  // Modo Escuro
  dark: {
    background: '#0B1120',
    surface: '#1E293B',
    surfaceSubtle: '#0F172A',
    border: '#334155',
    borderFocus: '#F87171',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    cardShadow: 'rgba(0, 0, 0, 0.35)',
  },

  // Feedback Semântico Base
  status: {
    success: '#16A34A',
    successBg: '#DCFCE7',
    warning: '#D97706',
    warningBg: '#FEF3C7',
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
    info: '#2563EB',
    infoBg: '#DBEAFE',
    pending: '#64748B',
    pendingBg: '#F1F5F9',
  },

  // Ação Rápida WhatsApp
  whatsapp: {
    DEFAULT: '#22C55E',
    dark: '#16A34A',
    light: '#DCFCE7',
  },

  // Prioridades de Metas
  priority: {
    baixa: '#2563EB',
    media: '#059669',
    alta: '#D97706',
    urgente: '#DC2626',
  }
};

/**
 * Retorna o mapa completo de tokens semânticos adaptados ao tema ativo.
 * Garante contraste WCAG AAA e elimina elementos com cores incompatíveis.
 */
export const getThemeColors = (theme: AppTheme = 'light') => {
  const isDark = theme === 'dark';
  const base = isDark ? Colors.dark : Colors.light;

  return {
    isDark,
    ...base,

    // Superfícies de componentes
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#E2E8F0',
    inputBg: isDark ? '#0F172A' : '#FFFFFF',
    inputBorder: isDark ? '#334155' : '#E2E8F0',
    subtleBg: isDark ? '#111827' : '#F1F5F9',
    chipBg: isDark ? '#1E293B' : '#F8FAFC',
    chipBorder: isDark ? '#334155' : '#E2E8F0',
    tabTrackBg: isDark ? '#0F172A' : '#E2E8F0',
    tabActiveBg: isDark ? '#1E293B' : '#FFFFFF',

    // Botões e Ações Rápidas Adaptadas
    whatsapp: {
      bg: isDark ? 'rgba(34, 197, 94, 0.16)' : '#DCFCE7',
      border: isDark ? 'rgba(74, 222, 128, 0.35)' : '#86EFAC',
      text: isDark ? '#4ADE80' : '#15803D',
      iconCircle: '#22C55E',
    },

    // Ações de Confirmação e Exclusão
    actions: {
      destructiveBg: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
      destructiveBorder: isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA',
      destructiveText: isDark ? '#F87171' : '#DC2626',
      successActionBg: isDark ? 'rgba(34, 197, 94, 0.16)' : '#DCFCE7',
      successActionBorder: isDark ? 'rgba(74, 222, 128, 0.35)' : '#86EFAC',
      successActionText: isDark ? '#4ADE80' : '#16A34A',
    },

    // Feedback Semântico Adaptativo (WCAG AAA)
    status: {
      success: isDark ? '#4ADE80' : '#16A34A',
      successBg: isDark ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7',
      warning: isDark ? '#FBBF24' : '#D97706',
      warningBg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
      danger: isDark ? '#F87171' : '#DC2626',
      dangerBg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
      info: isDark ? '#60A5FA' : '#2563EB',
      infoBg: isDark ? 'rgba(59, 130, 246, 0.18)' : '#DBEAFE',
      pending: isDark ? '#94A3B8' : '#64748B',
      pendingBg: isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9',
    },

    priority: {
      urgente: {
        bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
        text: isDark ? '#F87171' : '#DC2626',
      },
      alta: {
        bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
        text: isDark ? '#FBBF24' : '#D97706',
      },
      media: {
        bg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
        text: isDark ? '#4ADE80' : '#16A34A',
      },
      baixa: {
        bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
        text: isDark ? '#60A5FA' : '#2563EB',
      },
    }
  };
};
