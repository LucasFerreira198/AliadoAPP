import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedAction {
  id: string;
  type: 'submit_report' | 'submit_expense' | 'confirm_schedule' | 'submit_doubt';
  payload: any;
  createdAt: string;
}

const OFFLINE_QUEUE_KEY = '@aliado_offline_queue';

export const OfflineSyncService = {
  // Obter itens na fila
  async getQueue(): Promise<QueuedAction[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Adicionar ação à fila offline
  async enqueue(action: Omit<QueuedAction, 'id' | 'createdAt'>): Promise<void> {
    const queue = await this.getQueue();
    const newItem: QueuedAction = {
      ...action,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    queue.push(newItem);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  // Remover item sincronizado
  async dequeue(id: string): Promise<void> {
    const queue = await this.getQueue();
    const updated = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  },

  // Limpar fila
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  // Contagem de itens pendentes
  async count(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
};
