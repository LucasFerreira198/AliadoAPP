import { supabase, isSupabaseConfigured } from './supabase';

export interface UploadMediaResult {
  url: string;
  error?: string;
  isRemote: boolean;
}

/**
 * Faz upload de imagem ou vídeo para o Supabase Storage no bucket 'church_media'.
 * Se o Supabase não estiver configurado ou ocorrer falha de rede temporária,
 * mantém a URI local para visualização temporária e futura sincronização.
 */
export async function uploadMediaToSupabase(
  localUri: string,
  bucketName = 'church_media'
): Promise<UploadMediaResult> {
  if (!localUri) {
    return { url: '', isRemote: false, error: 'URI de mídia não informada' };
  }

  // Se já for uma URL remota HTTP/HTTPS, não faz novo upload
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

    const { data, error } = await supabase.storage
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
    console.warn('[UploadMedia] Exceção durante upload:', err);
    return { url: localUri, isRemote: false, error: err.message };
  }
}
