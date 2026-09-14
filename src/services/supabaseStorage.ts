import { supabase, isSupabaseConfigured } from './supabaseClient';

const BUCKET_NAME = 'oakvalley-assets';

export interface StorageUploadResult {
  url: string;
  path: string;
  fileName: string;
  sizeKb: number;
}

/**
 * Upload an image file directly to Supabase Storage bucket.
 * Returns the permanent public CDN URL without storing base64 in database.
 */
export async function uploadImageToSupabaseStorage(
  file: File | Blob,
  fileName?: string,
  folder: 'products' | 'rooms' | 'media' | 'logos' = 'media'
): Promise<StorageUploadResult> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase가 설정되지 않았습니다. VITE_SUPABASE_URL 및 VITE_SUPABASE_ANON_KEY를 확인하세요.');
  }

  const originalName = fileName || (file instanceof File ? file.name : 'upload.jpg');
  const cleanExt = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanBaseName = originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);

  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const filePath = `${folder}/${cleanBaseName}_${uniqueId}.${cleanExt}`;

  // Ensure bucket exists or upload directly
  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
    cacheControl: '31536000',
    upsert: true,
    contentType: file.type || `image/${cleanExt === 'png' ? 'png' : 'jpeg'}`,
  });

  if (error) {
    console.error('[Supabase Storage Upload Error]', error);
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  // Get public CDN URL
  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
  const publicUrl = publicUrlData.publicUrl;
  const sizeKb = Math.round((file.size || 0) / 1024);

  return {
    url: publicUrl,
    path: data.path,
    fileName: originalName,
    sizeKb,
  };
}

/**
 * Delete an image file from Supabase Storage bucket using URL or relative path.
 */
export async function deleteImageFromSupabaseStorage(urlOrPath: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || !urlOrPath) {
    return false;
  }

  try {
    let filePath = urlOrPath;
    if (urlOrPath.includes(`/storage/v1/object/public/${BUCKET_NAME}/`)) {
      filePath = urlOrPath.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];
    } else if (urlOrPath.startsWith('http')) {
      // External URL (e.g. unsplash), skip deletion
      return true;
    }

    if (!filePath) return false;

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    if (error) {
      console.warn('[Supabase Storage Remove Error]', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase Storage Delete Error]', err);
    return false;
  }
}
