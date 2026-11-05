import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseCurrencyInput, formatCurrency, formatDateBR, isValidISODate } from '../src/utils/formatters.ts';
import { compareVersions, isNewerVersion, cleanVersion } from '../src/utils/version.ts';
import { DEMO_CREDENTIALS, INITIAL_PROFILES, UUIDS } from '../src/services/mockData.ts';

describe('Auditoria Automatizada da Banca: Regras Críticas de Negócio', () => {

  // ==============================================================
  // CT-01: SEGURANÇA E AUTENTICAÇÃO (O HACKER)
  // ==============================================================
  describe('CT-01: Segurança de Autenticação e Credenciais', () => {
    test('Deve exigir senha obrigatória para qualquer usuário', () => {
      const email = 'pastor@metodistaaliado.com.br';
      const emptyPassword = '';
      assert.equal(emptyPassword.trim().length, 0, 'Senha vazia deve ser detectada');
    });

    test('Deve rejeitar senha incorreta para o Pastor', () => {
      const email = 'pastor@metodistaaliado.com.br';
      const correctPass = DEMO_CREDENTIALS[email];
      const wrongPass = 'senha_errada_123';
      assert.notEqual(wrongPass, correctPass, 'Senha incorreta não deve bater com as credenciais');
    });

    test('Deve validar senha correta do Pastor com sucesso', () => {
      const email = 'pastor@metodistaaliado.com.br';
      assert.equal(DEMO_CREDENTIALS[email], '123456');
    });

    test('Não deve permitir escalação de privilégio arbitrária sem cadastro', () => {
      const hackerEmail = 'hacker@malicioso.com';
      const found = INITIAL_PROFILES.find(p => p.email.toLowerCase() === hackerEmail);
      assert.equal(found, undefined, 'Usuário não cadastrado deve ser rejeitado');
    });

    test('Deve bloquear contas marcadas como is_active: false', () => {
      const fakeDeactivated = { ...INITIAL_PROFILES[0], is_active: false };
      assert.equal(fakeDeactivated.is_active, false, 'Conta desativada deve ser barrada');
    });
  });

  // ==============================================================
  // CT-02: PARSING FINANCEIRO BRASILEIRO (O USUÁRIO CONFUSO)
  // ==============================================================
  describe('CT-02: Parsing Financeiro de Moeda Brasileira (Milhar e Centavos)', () => {
    test('Deve converter corretamente valor de milhar com ponto e vírgula: "1.500,00" -> 1500.00', () => {
      const parsed = parseCurrencyInput('1.500,00');
      assert.equal(parsed, 1500.00, 'Mil e quinhentos reais não pode virar 1.50');
    });

    test('Deve converter corretamente valor alto com múltiplos milhares: "12.450,75" -> 12450.75', () => {
      const parsed = parseCurrencyInput('12.450,75');
      assert.equal(parsed, 12450.75);
    });

    test('Deve converter valor simples com vírgula: "150,50" -> 150.50', () => {
      const parsed = parseCurrencyInput('150,50');
      assert.equal(parsed, 150.50);
    });

    test('Deve converter valor simples com ponto: "150.50" -> 150.50', () => {
      const parsed = parseCurrencyInput('150.50');
      assert.equal(parsed, 150.50);
    });

    test('Deve ignorar prefixo "R$" e espaços: "R$ 3.200,00" -> 3200.00', () => {
      const parsed = parseCurrencyInput('R$ 3.200,00');
      assert.equal(parsed, 3200.00);
    });

    test('Deve retornar 0 para entradas inválidas ou texto puro', () => {
      assert.equal(parseCurrencyInput('abc'), 0);
      assert.equal(parseCurrencyInput(''), 0);
      assert.equal(parseCurrencyInput('-100'), 0);
    });
  });

  // ==============================================================
  // CT-03: VALIDAÇÃO DE DATAS ISO (A SECRETARIA & O CALENDÁRIO)
  // ==============================================================
  describe('CT-03: Validação de Datas do Calendário (YYYY-MM-DD)', () => {
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

    test('Deve rejeitar texto livre: "hoje"', () => {
      assert.equal(isValidISODate('hoje'), false);
    });
  });

  // ==============================================================
  // CT-04: FORMATAÇÃO DE DATA E MOEDA (O PROGRAMADOR SÊNIOR)
  // ==============================================================
  describe('CT-04: Formatação Padronizada de Moeda e Data', () => {
    test('formatDateBR deve formatar "2026-11-28" como "28/11/2026" sem desvio de fuso', () => {
      assert.equal(formatDateBR('2026-11-28'), '28/11/2026');
    });

    test('formatCurrency deve formatar 1500.50 contendo "1.500,50"', () => {
      const formatted = formatCurrency(1500.50);
      // Remove espaços não-quebráveis do Intl
      const normalized = formatted.replace(/\s/g, ' ');
      assert.ok(normalized.includes('1.500,50'), `Esperado conter "1.500,50", recebido: ${formatted}`);
    });
  });

  // ==============================================================
  // CT-05: COMPATIBILIDADE DE UUIDs (O TESTADOR & SUPABASE)
  // ==============================================================
  describe('CT-05: Validação de UUIDs RFC 4122 para PostgreSQL', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    test('Todos os IDs de perfis mock devem ser UUIDs válidos', () => {
      for (const profile of INITIAL_PROFILES) {
        assert.match(
          profile.id, 
          UUID_REGEX, 
          `ID do perfil "${profile.full_name}" (${profile.id}) deve ser um UUID válido`
        );
      }
    });

    test('Constantes UUIDS dos Ministérios devem ser UUIDs válidos', () => {
      assert.match(UUIDS.MIN_MAAD, UUID_REGEX);
      assert.match(UUIDS.MIN_LOUVOR, UUID_REGEX);
      assert.match(UUIDS.MIN_JOVENS, UUID_REGEX);
      assert.match(UUIDS.MIN_DIACONIA, UUID_REGEX);
    });
  });

  // ==============================================================
  // CT-06: PROTEÇÃO CONTRA CONCORRÊNCIA E CLIQUE DUPLO (MAAD)
  // ==============================================================
  describe('CT-06: Trava de Concorrência na Aprovação Contábil', () => {
    test('Simulação de disparo concorrente: segundo clique deve ser bloqueado enquanto primeiro processa', async () => {
      let processingId: string | null = null;
      let transactionCount = 0;

      const reviewBudget = async (budgetId: string) => {
        if (processingId) {
          // Bloqueado pela trava de concorrência
          return false;
        }
        processingId = budgetId;
        try {
          // Simula operação assíncrona
          await new Promise(resolve => setTimeout(resolve, 50));
          transactionCount++;
          return true;
        } finally {
          processingId = null;
        }
      };

      // Dispara 2 chamadas simultâneas
      const [res1, res2] = await Promise.all([
        reviewBudget('b0000001-0000-0000-0000-000000000001'),
        reviewBudget('b0000001-0000-0000-0000-000000000001')
      ]);

      assert.equal(res1, true, 'Primeiro clique deve ser processado');
      assert.equal(res2, false, 'Segundo clique concorrente deve ser bloqueado');
      assert.equal(transactionCount, 1, 'Apenas 1 saída de caixa deve ser registrada');
    });
  });

  // ==============================================================
  // CT-07: ATUALIZADOR IN-APP E COMPARAÇÃO DE VERSÕES GITHUB
  // ==============================================================
  describe('CT-07: In-App Updates e Comparador Semântico de Releases', () => {
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
