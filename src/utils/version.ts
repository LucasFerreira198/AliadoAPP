/**
 * Utilitário de Comparação de Versões Semânticas (Semver)
 * Suporta formatos: "v1.0.1", "1.0.1", "1.1.0-beta", etc.
 */

export function cleanVersion(versionStr: string | undefined | null): string {
  if (!versionStr) return '0.0.0';
  return versionStr.trim().replace(/^v/i, '').split('-')[0];
}

/**
 * Retorna:
 *  1 se versionA > versionB (versionA é mais nova)
 * -1 se versionA < versionB (versionB é mais nova)
 *  0 se versionA === versionB (mesma versão)
 */
export function compareVersions(versionA: string, versionB: string): number {
  const partsA = cleanVersion(versionA).split('.').map(p => parseInt(p, 10) || 0);
  const partsB = cleanVersion(versionB).split('.').map(p => parseInt(p, 10) || 0);

  const maxLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLength; i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;

    if (a > b) return 1;
    if (a < b) return -1;
  }

  return 0;
}

/**
 * Retorna true se latestVersion for estritamente mais recente que currentVersion
 */
export function isNewerVersion(latestVersion: string, currentVersion: string): boolean {
  return compareVersions(latestVersion, currentVersion) > 0;
}
