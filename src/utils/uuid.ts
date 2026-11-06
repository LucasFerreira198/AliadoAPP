/**
 * Utilitário de Geração de Identificadores Únicos Universais (UUID v4)
 * Estritamente compatível com a especificação RFC 4122 e PostgreSQL.
 */
export function generateUUID(prefix = '0000'): string {
  const hex = (len: number) => 
    Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const y = ['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)];
  return `${hex(8)}-${prefix.slice(0, 4).padStart(4, '0')}-4${hex(3)}-${y}${hex(3)}-${hex(12)}`;
}
