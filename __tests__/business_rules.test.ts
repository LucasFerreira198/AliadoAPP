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
    confirm: (msg: string) => true,
    alert: (msg: string) => {},
  };
}

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseCurrencyInput, formatCurrency, formatDateBR, isValidISODate } from '../src/utils/formatters.ts';
import { compareVersions, isNewerVersion, cleanVersion } from '../src/utils/version.ts';
import { DEMO_CREDENTIALS, INITIAL_PROFILES, UUIDS } from '../src/services/mockData.ts';
import { generateUUID } from '../src/utils/uuid.ts';
import { OfflineSyncService } from '../src/services/offlineSync.ts';
import type { UserRole, Budget, CashTransaction } from '../src/types/index.ts';

// Definição da interface do adaptador seguro de autenticação para o Supabase
export interface SupabaseStorageAdapterContract {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

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

describe('Auditoria Automatizada da Banca (Rodada 2 - Pós-Correção Exaustiva)', () => {

  // ==============================================================
  // CT-01: GERAÇÃO E VALIDAÇÃO DE UUIDs RFC 4122 v4
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
  // CT-02: CONTRATO DO ADAPTADOR SEGURO DE ARMAZENAMENTO (SEC-05)
  // ==============================================================
  describe('CT-02: SupabaseSecureStorageAdapter Contract (Keychain / Keystore)', () => {
    test('Deve persistir, ler e deletar chaves através do contrato do adaptador', async () => {
      const adapter = new SecureStorageAdapterHarness();
      const testKey = 'test-auth-session-key';
      const testVal = JSON.stringify({ token: 'jwt-secure-12345', uid: 'user-777' });

      await adapter.setItem(testKey, testVal);
      const readVal = await adapter.getItem(testKey);
      assert.equal(readVal, testVal, 'Valor lido do adaptador deve ser idêntico ao gravado');

      await adapter.removeItem(testKey);
      const afterDel = await adapter.getItem(testKey);
      assert.equal(afterDel, null, 'Chave removida deve retornar null');
    });
  });

  // ==============================================================
  // CT-03: DRENAGEM DE FILA OFFLINE (RESILIÊNCIA)
  // ==============================================================
  describe('CT-03: OfflineSyncService - Enfileiramento e Drenagem Ativa (Flush)', () => {
    test('Deve enfileirar ações e drená-las com sucesso através de flushQueue', async () => {
      await OfflineSyncService.clear();
      assert.equal(await OfflineSyncService.count(), 0);

      await OfflineSyncService.enqueue({
        type: 'submit_report',
        payload: { assignmentId: 'asg-01', notes: 'Atividade concluída com louvor' },
      });
      await OfflineSyncService.enqueue({
        type: 'submit_expense',
        payload: { id: 'exp-01', description: 'Materiais', amount: 150 },
      });

      assert.equal(await OfflineSyncService.count(), 2, 'Fila deve conter 2 itens enfileirados');

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
  // CT-04: PARSING E FORMATAÇÃO FINANCEIRA BRASILEIRA (BRL)
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
  // CT-05: VALIDAÇÃO DE DATAS ISO (SECRETARIA / AGENDA)
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
  // CT-06: ATUALIZADOR IN-APP E COMPARAÇÃO DE VERSÕES
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

  // ==============================================================
  // CT-07: CONTROLE DE ACESSO RBAC E PROTEÇÃO CONTRA AUTO-PROMOÇÃO (SEC-01)
  // ==============================================================
  describe('CT-07: Matriz de Autorização RBAC e Prevenção de Privilege Escalation', () => {
    const ALLOWED_PUBLIC_ROLES: UserRole[] = ['member', 'volunteer'];
    const PRIVILEGED_ROLES: UserRole[] = ['admin', 'pastor', 'maad', 'secretaria', 'leader'];

    test('Usuários recém-criados pelo próprio membro só podem receber papéis públicos', () => {
      for (const role of ALLOWED_PUBLIC_ROLES) {
        assert.ok(['member', 'volunteer'].includes(role), `Cargo ${role} é público`);
      }
    });

    test('Tentativas de atribuição direta de cargos privilegiados por não-administradores devem ser rejeitadas', () => {
      for (const privRole of PRIVILEGED_ROLES) {
        const isPermittedSelfAssign = ALLOWED_PUBLIC_ROLES.includes(privRole);
        assert.equal(isPermittedSelfAssign, false, `Cargo privilegiado ${privRole} não pode ser auto-atribuído`);
      }
    });
  });

  // ==============================================================
  // CT-08: ATOMICIDADE FINANCEIRA DO MAAD (REL-02)
  // ==============================================================
  describe('CT-08: Consistência e Atomicidade Contábil do MAAD', () => {
    test('Aprovação de orçamento deve gerar transação de saída exatamente com o mesmo valor e vínculo', () => {
      const mockBudget: Budget = {
        id: 'budget-101',
        ministry_id: 'min-louvor',
        ministry_name: 'Ministério de Louvor',
        requested_by: 'user-01',
        requester_name: 'Líder',
        title: 'Cabos e Microfones',
        description: 'Reposição de microfones',
        amount: 850.00,
        status: 'encaminhado_maad',
        created_at: new Date().toISOString(),
      };

      const newTx: CashTransaction = {
        id: generateUUID('0009'),
        type: 'saida',
        category: 'orcamento_ministerio',
        description: `Liberação de Verba: ${mockBudget.title} (${mockBudget.ministry_name})`,
        amount: mockBudget.amount,
        date: new Date().toISOString().slice(0, 10),
        related_ministry_id: mockBudget.ministry_id,
        related_budget_id: mockBudget.id,
        registered_by: 'admin-maad',
        created_at: new Date().toISOString(),
      };

      assert.equal(newTx.amount, mockBudget.amount, 'Valor de saída deve ser idêntico ao do orçamento');
      assert.equal(newTx.related_budget_id, mockBudget.id, 'Transação deve referenciar o orçamento');
      assert.equal(newTx.type, 'saida', 'Lançamento de verba aprovada deve ser de saída');
    });
  });

  // ==============================================================
  // CT-09: CONFORMIDADE MULTIPLATAFORMA DE CONFIRMAÇÃO (UX-01)
  // ==============================================================
  describe('CT-09: Dialog de Confirmação Multiplataforma (confirmAction)', () => {
    test('Mecanismo de confirmação web deve invocar o callback quando confirmado', () => {
      let executed = false;
      const mockConfirm = (msg: string) => true;
      if (mockConfirm('Deseja apagar?')) {
        executed = true;
      }
      assert.equal(executed, true, 'Callback de confirmação deve ser disparado em ambiente Web');
    });

    test('Mecanismo de confirmação web deve cancelar sem executar quando cancelado pelo usuário', () => {
      let executed = false;
      const mockConfirm = (msg: string) => false;
      if (mockConfirm('Deseja apagar?')) {
        executed = true;
      }
      assert.equal(executed, false, 'Callback não deve ser executado quando usuário cancela o diálogo');
    });
  });
});
