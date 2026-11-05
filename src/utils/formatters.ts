/**
 * Utilitários de Formatação e Parsing Seguro para o AliadoAPP
 * Igreja Metodista Aliado
 */

/**
 * Faz o parsing seguro de valores monetários digitados por usuários brasileiros.
 * Lida corretamente com:
 * - "1.500,00" -> 1500.00
 * - "1500,50"  -> 1500.50
 * - "1500.50"  -> 1500.50
 * - "1.500"    -> 1500.00
 * - "1500"     -> 1500.00
 * - "R$ 1.500,00" -> 1500.00
 */
export function parseCurrencyInput(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  let cleaned = value.trim().replace(/[R$\s]/g, '');
  if (!cleaned) return 0;

  // Se tiver ponto E vírgula: ex: 1.500,50 ou 1,500.50
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');

    if (lastComma > lastDot) {
      // Padrão Brasileiro: 1.500,50 -> remove os pontos e troca a vírgula por ponto
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Padrão Americano: 1,500.50 -> remove as vírgulas
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Apenas vírgula: ex: 1500,50
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

/**
 * Formata um valor numérico para a moeda brasileira (BRL).
 * Ex: 1500.5 -> "R$ 1.500,50"
 */
export function formatCurrency(amount: number | undefined | null): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return safeAmount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata uma data ISO (YYYY-MM-DD ou ISO string) para o padrão brasileiro (DD/MM/AAAA).
 */
export function formatDateBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    // Se vier no formato YYYY-MM-DD, divide manualmente para evitar distorção de fuso horário UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

/**
 * Valida se uma string é uma data válida no formato YYYY-MM-DD.
 */
export function isValidISODate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
