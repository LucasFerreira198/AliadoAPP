import AsyncStorage from '@react-native-async-storage/async-storage';

// Suporte uniforme para runtime React Native e Node.js test runner
const storage = (AsyncStorage as any)?.default || AsyncStorage;

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
      const data = await storage.getItem(OFFLINE_QUEUE_KEY);
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
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    queue.push(newItem);
    await storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  // Remover item sincronizado
  async dequeue(id: string): Promise<void> {
    const queue = await this.getQueue();
    const updated = queue.filter(item => item.id !== id);
    await storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  },

  // Limpar fila
  async clear(): Promise<void> {
    await storage.removeItem(OFFLINE_QUEUE_KEY);
  },

  // Contagem de itens pendentes
  async count(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  },

  // Processa e drena todos os itens acumulados na fila offline
  async flushQueue(
    executor: (action: QueuedAction) => Promise<boolean>
  ): Promise<{ processed: number; failed: number }> {
    const queue = await this.getQueue();
    if (queue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;
    const remaining: QueuedAction[] = [];

    for (const item of queue) {
      try {
        const success = await executor(item);
        if (success) {
          processed++;
        } else {
          failed++;
          remaining.push(item);
        }
      } catch (err) {
        console.warn(`[OfflineSync] Erro ao processar item ${item.id}:`, err);
        failed++;
        remaining.push(item);
      }
    }

    await storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    return { processed, failed };
  },
};
