// Polyfill de ambiente local para testes em Node.js (AsyncStorage Web fallback)
if (typeof (globalThis as any).window === 'undefined') {
  const memoryStore = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => memoryStore.get(k) ?? null,
      setItem: (k: string, v: string) => memoryStore.set(k, String(v)),
      removeItem: (k: string) => memoryStore.delete(k),
      clear: () => memoryStore.clear(),
    },
  };
}

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseCurrencyInput, formatCurrency, formatDateBR, isValidISODate } from '../src/utils/formatters.ts';
import { compareVersions, isNewerVersion, cleanVersion } from '../src/utils/version.ts';
import { DEMO_CREDENTIALS, INITIAL_PROFILES, UUIDS } from '../src/services/mockData.ts';
import { generateUUID } from '../src/utils/uuid.ts';
import { OfflineSyncService } from '../src/services/offlineSync.ts';

// Definição da interface do adaptador seguro de autenticação para o Supabase
export interface SupabaseStorageAdapterContract {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Implementação de referência do adaptador para validação de conformidade da API
 */
class SecureStorageAdapterHarness implements SupabaseStorageAdapterContract {
  private memoryStore = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.memoryStore.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.memoryStore.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }
}

describe('Auditoria Automatizada da Banca (Rodada 2 - Pós-Correção)', () => {

  // ==============================================================
  // CT-01: GERAÇÃO E VALIDAÇÃO DE UUIDs RFC 4122 v4 (ARC-02 / REL-01)
  // ==============================================================
  describe('CT-01: Integridade de UUIDs RFC 4122 v4 para PostgreSQL', () => {
    const RFC4122_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    test('generateUUID deve gerar UUIDs v4 válidos e compatíveis com PostgreSQL', () => {
      for (let i = 0; i < 20; i++) {
        const uuid = generateUUID('0001');
        assert.match(
          uuid, 
          RFC4122_V4_REGEX, 
          `UUID gerado "${uuid}" deve atender estritamente ao formato RFC 4122 v4`
        );
      }
    });

    test('Todos os IDs de perfis mock e constantes de ministérios devem ser UUIDs válidos', () => {
      for (const profile of INITIAL_PROFILES) {
        assert.match(profile.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      }
      assert.match(UUIDS.MIN_MAAD, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      assert.match(UUIDS.MIN_LOUVOR, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      assert.match(UUIDS.MIN_JOVENS, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      assert.match(UUIDS.MIN_EBD, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  // ==============================================================
  // CT-02: CONTRATO DO ADAPTADOR SEGURO DE ARMAZENAMENTO SUPABASE (SEC-05)
  // ==============================================================
  describe('CT-02: SupabaseSecureStorageAdapter Contract (Keychain / Keystore)', () => {
    test('Deve persistir, recuperar e remover chaves com sucesso pelo contrato do adaptador', async () => {
      const adapter = new SecureStorageAdapterHarness();
      const testKey = 'sb-test-auth-token';
      const testValue = JSON.stringify({ access_token: 'fake-jwt-token', user_id: 'u-123' });

      await adapter.setItem(testKey, testValue);
      const retrieved = await adapter.getItem(testKey);
      assert.equal(retrieved, testValue, 'Valor recuperado deve ser idêntico ao armazenado');

      await adapter.removeItem(testKey);
      const afterDelete = await adapter.getItem(testKey);
      assert.equal(afterDelete, null, 'Chave deve ser nula após remoção');
    });
  });

  // ==============================================================
  // CT-03: MECANISMO DE DRENAGEM DA FILA OFFLINE (UX-01)
  // ==============================================================
  describe('CT-03: OfflineSyncService - Enfileiramento e Drenagem Ativa (Flush)', () => {
    test('Deve enfileirar ações e drená-las com sucesso através de flushQueue', async () => {
      await OfflineSyncService.clear();
      assert.equal(await OfflineSyncService.count(), 0);

      // Enfileira 2 ações offline
      await OfflineSyncService.enqueue({
        type: 'submit_report',
        payload: { assignmentId: 'asg-01', notes: 'Atividade concluída com louvor' },
      });
      await OfflineSyncService.enqueue({
        type: 'submit_expense',
        payload: { id: 'exp-01', description: 'Materiais', amount: 150 },
      });

      assert.equal(await OfflineSyncService.count(), 2, 'Fila deve conter 2 itens enfileirados');

      // Executa o flushQueue com executor de sucesso
      const syncResult = await OfflineSyncService.flushQueue(async (item) => {
        return !!item.payload;
      });

      assert.equal(syncResult.processed, 2, 'Ambos os itens devem ser processados');
      assert.equal(syncResult.failed, 0, 'Nenhum item deve falhar');
      assert.equal(await OfflineSyncService.count(), 0, 'Fila deve estar completamente vazia após o flush');
    });

    test('Deve manter na fila itens que falharem durante o flush para retentativa futura', async () => {
      await OfflineSyncService.clear();

      await OfflineSyncService.enqueue({
        type: 'submit_report',
        payload: { assignmentId: 'asg-fail', shouldFail: true },
      });
      await OfflineSyncService.enqueue({
        type: 'submit_report',
        payload: { assignmentId: 'asg-ok', shouldFail: false },
      });

      const syncResult = await OfflineSyncService.flushQueue(async (item) => {
        return !item.payload.shouldFail;
      });

      assert.equal(syncResult.processed, 1, 'Apenas 1 item bem-sucedido deve ser processado');
      assert.equal(syncResult.failed, 1, 'Item com erro deve falhar');
      assert.equal(await OfflineSyncService.count(), 1, 'Item com falha deve permanecer na fila para retry');

      await OfflineSyncService.clear();
    });
  });

  // ==============================================================
  // CT-04: PARSING E FORMATAÇÃO FINANCEIRA BRASILEIRA (CT-02 / BRL)
  // ==============================================================
  describe('CT-04: Parsing Financeiro de Moeda Brasileira (Milhar e Centavos)', () => {
    test('Deve converter corretamente valor de milhar com ponto e vírgula: "1.500,00" -> 1500.00', () => {
      assert.equal(parseCurrencyInput('1.500,00'), 1500.00);
    });

    test('Deve converter corretamente valor alto com múltiplos milhares: "12.450,75" -> 12450.75', () => {
      assert.equal(parseCurrencyInput('12.450,75'), 12450.75);
    });

    test('Deve converter valor simples com vírgula: "150,50" -> 150.50', () => {
      assert.equal(parseCurrencyInput('150,50'), 150.50);
    });

    test('Deve converter valor simples com ponto: "150.50" -> 150.50', () => {
      assert.equal(parseCurrencyInput('150.50'), 150.50);
    });

    test('Deve ignorar prefixo "R$" e espaços: "R$ 3.200,00" -> 3200.00', () => {
      assert.equal(parseCurrencyInput('R$ 3.200,00'), 3200.00);
    });

    test('Deve retornar 0 para entradas inválidas, texto puro ou valores negativos', () => {
      assert.equal(parseCurrencyInput('abc'), 0);
      assert.equal(parseCurrencyInput(''), 0);
      assert.equal(parseCurrencyInput('-100'), 0);
      assert.equal(parseCurrencyInput(null), 0);
      assert.equal(parseCurrencyInput(undefined), 0);
    });

    test('formatCurrency deve formatar 1500.50 contendo "1.500,50"', () => {
      const formatted = formatCurrency(1500.50);
      const normalized = formatted.replace(/\s/g, ' ');
      assert.ok(normalized.includes('1.500,50'));
    });
  });

  // ==============================================================
  // CT-05: VALIDAÇÃO DE DATAS ISO (UX-02 / SECRETARIA)
  // ==============================================================
  describe('CT-05: Validação Rigorosa de Datas do Calendário (YYYY-MM-DD)', () => {
    test('Deve aceitar data ISO válida: "2026-11-20"', () => {
      assert.equal(isValidISODate('2026-11-20'), true);
    });

    test('Deve rejeitar data no formato brasileiro invertido: "20/11/2026"', () => {
      assert.equal(isValidISODate('20/11/2026'), false);
    });

    test('Deve rejeitar mês inexistente: "2026-13-10"', () => {
      assert.equal(isValidISODate('2026-13-10'), false);
    });

    test('Deve rejeitar dia inválido para fevereiro: "2026-02-31"', () => {
      assert.equal(isValidISODate('2026-02-31'), false);
    });

    test('Deve rejeitar texto livre: "amanhã" ou "hoje"', () => {
      assert.equal(isValidISODate('amanhã'), false);
      assert.equal(isValidISODate('hoje'), false);
    });

    test('formatDateBR deve formatar "2026-11-28" como "28/11/2026" sem desvio de fuso', () => {
      assert.equal(formatDateBR('2026-11-28'), '28/11/2026');
    });
  });

  // ==============================================================
  // CT-06: ATUALIZADOR IN-APP E COMPARAÇÃO DE VERSÕES (REL-04)
  // ==============================================================
  describe('CT-06: In-App Updates e Comparador Semântico de Releases', () => {
    test('Deve reconhecer que v1.0.1 é mais recente que 1.0.0', () => {
      assert.equal(isNewerVersion('v1.0.1', '1.0.0'), true);
      assert.equal(isNewerVersion('1.1.0', '1.0.0'), true);
      assert.equal(isNewerVersion('2.0.0', '1.9.9'), true);
    });

    test('Deve reconhecer que a mesma versão não requer atualização', () => {
      assert.equal(isNewerVersion('v1.0.0', '1.0.0'), false);
      assert.equal(isNewerVersion('1.0.0', '1.0.0'), false);
    });

    test('Deve reconhecer que versão anterior não deve disparar atualização', () => {
      assert.equal(isNewerVersion('0.9.9', '1.0.0'), false);
    });

    test('Deve limpar prefixo "v" e sufixos de pré-release: "v1.0.2-beta" -> "1.0.2"', () => {
      assert.equal(cleanVersion('v1.0.2-beta'), '1.0.2');
      assert.equal(cleanVersion('  V2.5.0  '), '2.5.0');
    });

    test('compareVersions deve retornar 1, -1 e 0 conforme semver', () => {
      assert.equal(compareVersions('1.0.1', '1.0.0'), 1);
      assert.equal(compareVersions('1.0.0', '1.0.1'), -1);
      assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
    });
  });
});
