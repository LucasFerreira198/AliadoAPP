import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isNewerVersion, cleanVersion } from '../utils/version';

export const GITHUB_REPO_OWNER = 'LucasFerreira198';
export const GITHUB_REPO_NAME = 'AliadoAPP';
export const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

const UPDATE_CACHE_KEY = '@aliado_update_check_cache';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas de intervalo para evitar rate limit de 60 req/h

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
 * Consulta a API do GitHub para verificar se existe uma Release mais recente publicada,
 * com cache de 6 horas para proteger contra rate limit em redes compartilhadas.
 */
export async function checkForGitHubRelease(force = false): Promise<AppUpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();

  try {
    if (!force) {
      const cached = await AsyncStorage.getItem(UPDATE_CACHE_KEY);
      if (cached) {
        const { timestamp, result } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS && result) {
          return { ...result, currentVersion };
        }
      }
    }

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
      return { hasUpdate: false, type: 'none', currentVersion };
    }

    if (response.status === 403) {
      console.warn('[AppUpdates] GitHub API rate limit atingido, utilizando versão local.');
      return { hasUpdate: false, type: 'none', currentVersion };
    }

    if (!response.ok) {
      return { hasUpdate: false, type: 'none', currentVersion };
    }

    const data: GitHubReleaseInfo = await response.json();
    const latestVersion = data.tag_name || '1.0.0';

    let result: AppUpdateCheckResult = { hasUpdate: false, type: 'none', currentVersion };

    if (isNewerVersion(latestVersion, currentVersion)) {
      const apkAsset = data.assets?.find(a => a.name.endsWith('.apk') || a.content_type?.includes('android'));
      const downloadUrl = apkAsset?.browser_download_url || data.html_url;

      result = {
        hasUpdate: true,
        type: 'github_release',
        currentVersion,
        latestVersion: cleanVersion(latestVersion),
        releaseNotes: data.body || 'Melhorias de desempenho e estabilidade para a liderança e membros.',
        downloadUrl,
      };
    }

    // Salva no cache com timestamp
    await AsyncStorage.setItem(
      UPDATE_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), result })
    );

    return result;
  } catch {
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
  } catch {
    // Em Expo Go ou desenvolvimento, Updates.checkForUpdateAsync pode não estar habilitado
  }

  return { hasUpdate: false, type: 'none', currentVersion };
}

/**
 * Checagem Unificada de Atualizações (OTA + GitHub Releases).
 */
export async function checkForAppUpdates(): Promise<AppUpdateCheckResult> {
  const otaResult = await checkForOTAUpdate();
  if (otaResult.hasUpdate) return otaResult;

  return await checkForGitHubRelease();
}

/**
 * Executa a atualização no aparelho.
 */
export async function applyAppUpdate(update: AppUpdateCheckResult): Promise<boolean> {
  if (update.type === 'ota') {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return true;
    } catch (err) {
      console.warn('[AppUpdates] Erro ao aplicar OTA update:', err);
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
