import { supabase } from '../lib/supabase/client';
import {
  assertPrivateRasterImage,
  createStorageReference,
  resolveStorageAssetUrl,
  type StorageAssetBucket,
} from '../lib/storage/privateAsset';

const ALLOWED_DESIGN_ASSET_BUCKETS = ['logos', 'pdf-assets'] as const;
type DesignAssetBucket = typeof ALLOWED_DESIGN_ASSET_BUCKETS[number];

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9_.-]/g, '-');
const sanitizeFolder = (folder: string) => folder
  .split('/')
  .map((segment) => sanitizeFileName(segment))
  .filter(Boolean)
  .join('/');

async function uploadImage(
  file: File,
  bucket: StorageAssetBucket,
  userId: string,
  folder: string,
): Promise<string> {
  if (!userId) throw new Error('Usuário não autenticado.');
  assertPrivateRasterImage(file, bucket === 'proposals' ? 'uma foto do telhado' : 'uma imagem');

  const safeName = sanitizeFileName(file.name || 'asset');
  const safeFolder = sanitizeFolder(folder) || 'assets';
  const filePath = `${userId}/${safeFolder}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: file.type || undefined,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  if (bucket === 'pdf-assets' || bucket === 'proposals') {
    return createStorageReference(bucket, filePath);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export const storageAssetService = {
  async uploadAsset(file: File, bucket: DesignAssetBucket, userId: string): Promise<string> {
    if (!ALLOWED_DESIGN_ASSET_BUCKETS.includes(bucket)) {
      throw new Error('Bucket de upload não permitido.');
    }

    return uploadImage(file, bucket, userId, 'models');
  },

  async uploadRoofImage(file: File, userId: string): Promise<string> {
    return uploadImage(file, 'proposals', userId, 'roof-photos');
  },

  resolveAssetUrl(value: string | null | undefined, expiresInSeconds?: number) {
    return resolveStorageAssetUrl(value, expiresInSeconds);
  },
};
