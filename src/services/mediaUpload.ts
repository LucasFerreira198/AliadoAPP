import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage as firebaseStorage } from './firebase';
import { supabase, isSupabaseConfigured } from './supabase';

export interface UploadMediaResult {
  url: string;
  error?: string;
  isRemote: boolean;
}

/**
 * Faz upload de imagem ou vídeo para o Firebase Cloud Storage.
 */
export async function uploadMediaToFirebase(
  localUri: string,
  folder = 'uploads'
): Promise<UploadMediaResult> {
  if (!localUri) {
    return { url: '', isRemote: false, error: 'URI de mídia não informada' };
  }

  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return { url: localUri, isRemote: true };
  }

  try {
    const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const storageRef = ref(firebaseStorage, filename);

    const response = await fetch(localUri);
    const blob = await response.blob();

    const snapshot = await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return { url: downloadUrl, isRemote: true };
  } catch (err: any) {
    console.warn('[UploadMedia] Falha no upload para Firebase Storage:', err);
    return { url: localUri, isRemote: false, error: err?.message };
  }
}

/**
 * Faz upload de imagem ou vídeo para o Supabase Storage no bucket 'church_media'.
 */
export async function uploadMediaToSupabase(
  localUri: string,
  bucketName = 'church_media'
): Promise<UploadMediaResult> {
  if (!localUri) {
    return { url: '', isRemote: false, error: 'URI de mídia não informada' };
  }

  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return { url: localUri, isRemote: true };
  }

  if (!isSupabaseConfigured()) {
    return { url: localUri, isRemote: false };
  }

  try {
    const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const isVideo = extension === 'mp4' || extension === 'mov';
    const contentType = isVideo ? `video/${extension === 'mov' ? 'quicktime' : 'mp4'}` : `image/${extension === 'png' ? 'png' : 'jpeg'}`;
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = `uploads/${filename}`;

    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: filename,
      type: contentType,
    } as any);

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, formData, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.warn(`[UploadMedia] Falha ao enviar para bucket ${bucketName}:`, error.message);
      return { url: localUri, isRemote: false, error: error.message };
    }

    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      url: publicData.publicUrl || localUri,
      isRemote: true,
    };
  } catch (err: any) {
    console.warn('[UploadMedia] Exceção durante upload no Supabase:', err);
    return { url: localUri, isRemote: false, error: err.message };
  }
}

/**
 * Upload unificado: prioriza Firebase Storage, com fallback para Supabase Storage
 * e por fim retenção da URI local offline para posterior sincronização.
 */
export async function uploadMedia(localUri: string, folder = 'uploads'): Promise<UploadMediaResult> {
  try {
    const fbResult = await uploadMediaToFirebase(localUri, folder);
    if (fbResult.isRemote) {
      return fbResult;
    }
  } catch {
    // Segue para fallback
  }

  if (isSupabaseConfigured()) {
    return uploadMediaToSupabase(localUri, folder);
  }

  return { url: localUri, isRemote: false };
}
