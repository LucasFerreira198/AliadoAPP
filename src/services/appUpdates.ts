import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { isNewerVersion, cleanVersion } from '../utils/version';
import { scheduleLocalNotification } from './notifications';

export const GITHUB_REPO_OWNER = 'LucasFerreira198';
export const GITHUB_REPO_NAME = 'AliadoAPP';
export const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

export interface GitHubReleaseInfo {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets?: Array<{
    name: string;
    browser_download_url: string;
    content_type: string;
    size: number;
  }>;
}

export interface AppUpdateCheckResult {
  hasUpdate: boolean;
  type: 'ota' | 'github_release' | 'none';
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  isMandatory?: boolean;
}

/**
 * Obtém a versão atual do app instalada no dispositivo.
 */
export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * Consulta a API do GitHub para verificar se existe uma Release mais recente publicada.
 */
export async function checkForGitHubRelease(): Promise<AppUpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos de timeout

    const response = await fetch(GITHUB_API_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AliadoAPP-Updater',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      // Repositório recém-criado sem releases publicadas ainda
      return { hasUpdate: false, type: 'none', currentVersion };
    }

    if (response.status === 403) {
      // Rate limit atingido da API pública do GitHub
      console.warn('GitHub API rate limit atingido, pulando checagem de release.');
      return { hasUpdate: false, type: 'none', currentVersion };
    }

    if (!response.ok) {
      return { hasUpdate: false, type: 'none', currentVersion };
    }

    const data: GitHubReleaseInfo = await response.json();
    const latestVersion = data.tag_name || '1.0.0';

    if (isNewerVersion(latestVersion, currentVersion)) {
      // Procura se tem asset APK anexado
      const apkAsset = data.assets?.find(a => a.name.endsWith('.apk') || a.content_type?.includes('android'));
      const downloadUrl = apkAsset?.browser_download_url || data.html_url;

      return {
        hasUpdate: true,
        type: 'github_release',
        currentVersion,
        latestVersion: cleanVersion(latestVersion),
        releaseNotes: data.body || 'Melhorias de desempenho e estabilidade para a liderança e membros.',
        downloadUrl,
      };
    }

    return { hasUpdate: false, type: 'none', currentVersion };
  } catch (err) {
    // Falha silenciosa de rede/timeout para não impactar o fluxo do usuário
    return { hasUpdate: false, type: 'none', currentVersion };
  }
}

/**
 * Verifica atualizações Over-the-Air (OTA) via expo-updates se estiver rodando em build nativo de produção.
 */
export async function checkForOTAUpdate(): Promise<AppUpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();

  try {
    if (!__DEV__ && Updates.isEnabled) {
      const updateCheck = await Updates.checkForUpdateAsync();
      if (updateCheck.isAvailable) {
        return {
          hasUpdate: true,
          type: 'ota',
          currentVersion,
          latestVersion: currentVersion,
          releaseNotes: 'Atualização instantânea disponível no canal oficial da igreja.',
        };
      }
    }
  } catch (err) {
    // Em Expo Go ou ambiente de desenvolvimento, Updates.checkForUpdateAsync pode não estar habilitado
  }

  return { hasUpdate: false, type: 'none', currentVersion };
}

/**
 * Checagem Unificada de Atualizações (OTA + GitHub Releases).
 * Primeiro verifica se há OTA instantâneo (sem necessidade de reinstalação);
 * se não houver, verifica se há nova Release no GitHub.
 */
export async function checkForAppUpdates(): Promise<AppUpdateCheckResult> {
  // 1. Tenta OTA se disponível
  const otaResult = await checkForOTAUpdate();
  if (otaResult.hasUpdate) return otaResult;

  // 2. Tenta GitHub Release
  return await checkForGitHubRelease();
}

/**
 * Executa a atualização no aparelho:
 * - Se for OTA: baixa o bundle e reinicia o app suavemente.
 * - Se for GitHub Release: abre o link de download seguro do APK ou da Release oficial.
 */
export async function applyAppUpdate(update: AppUpdateCheckResult): Promise<boolean> {
  if (update.type === 'ota') {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return true;
    } catch (err) {
      console.warn('Erro ao aplicar OTA update:', err);
      return false;
    }
  }

  if (update.type === 'github_release' && update.downloadUrl) {
    const canOpen = await Linking.canOpenURL(update.downloadUrl);
    if (canOpen) {
      await Linking.openURL(update.downloadUrl);
      return true;
    }
  }

  return false;
}
