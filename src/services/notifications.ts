import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configura o comportamento padrão quando uma notificação chega com o app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Solicita permissões e obtém o Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permissão para notificações não foi concedida');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Geral',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626', // Vermelho Metodista
      });

      await Notifications.setNotificationChannelAsync('urgente', {
        name: 'Metas e Avisos Urgentes',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#DC2626',
      });
    }
  } catch (error) {
    console.log('Ambiente de simulador ou sem credencial de push:', error);
  }

  return token;
}

/**
 * Dispara uma notificação local instantânea (para feedback ou alertas de demonstração)
 */
export async function scheduleLocalNotification(title: string, body: string, data?: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Disparo imediato
    });
  } catch (err) {
    console.log('Erro ao agendar notificação local:', err);
  }
}
