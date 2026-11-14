import { Alert, Platform } from 'react-native';

/**
 * Utilitário multiplataforma para confirmações e alertas interativos.
 * Resolve a inoperância do Alert.alert com callbacks no React Native Web (UX-01).
 */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmText = 'Sim, Confirmar'
): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: confirmText,
        style: 'destructive',
        onPress: () => {
          void onConfirm();
        },
      },
    ]);
  }
}

export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}${message ? '\n\n' + message : ''}`);
    }
  } else {
    Alert.alert(title, message);
  }
}
