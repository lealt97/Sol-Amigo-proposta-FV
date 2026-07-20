import { supabase } from '../supabase/client';

export type StorageAssetBucket = 'pdf-assets' | 'proposals' | 'logos';

const STORAGE_REFERENCE_PREFIX = 'storage://';
const PRIVATE_BUCKETS = new Set<StorageAssetBucket>(['pdf-assets', 'proposals']);
const SIGNED_URL_MIN_SECONDS = 60;
const SIGNED_URL_MAX_SECONDS = 3600;

const STORAGE_URL_MARKERS = [
  '/storage/v1/object/public/',
  '/storage/v1/object/sign/',
  '/storage/v1/object/authenticated/',
];

export interface StorageAssetReference {
  bucket: StorageAssetBucket;
  path: string;
}

export const PRIVATE_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const PRIVATE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

function isStorageAssetBucket(value: string): value is StorageAssetBucket {
  return value === 'pdf-assets' || value === 'proposals' || value === 'logos';
}

function normalizeStoragePath(value: string) {
  return decodeURIComponent(value.split('?')[0] || '')
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/');
}

export function createStorageReference(bucket: StorageAssetBucket, path: string) {
  const normalizedPath = normalizeStoragePath(path);
  if (!normalizedPath) throw new Error('Caminho do arquivo inválido.');
  return `${STORAGE_REFERENCE_PREFIX}${bucket}/${normalizedPath}`;
}

export function parseStorageReference(value: string | null | undefined): StorageAssetReference | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  if (raw.startsWith(STORAGE_REFERENCE_PREFIX)) {
    const remainder = raw.slice(STORAGE_REFERENCE_PREFIX.length);
    const separatorIndex = remainder.indexOf('/');
    if (separatorIndex <= 0) return null;

    const bucket = remainder.slice(0, separatorIndex);
    const path = normalizeStoragePath(remainder.slice(separatorIndex + 1));
    if (!isStorageAssetBucket(bucket) || !path) return null;
    return { bucket, path };
  }

  for (const marker of STORAGE_URL_MARKERS) {
    const markerIndex = raw.indexOf(marker);
    if (markerIndex === -1) continue;

    const remainder = raw.slice(markerIndex + marker.length);
    const separatorIndex = remainder.indexOf('/');
    if (separatorIndex <= 0) return null;

    const bucket = remainder.slice(0, separatorIndex);
    const path = normalizeStoragePath(remainder.slice(separatorIndex + 1));
    if (!isStorageAssetBucket(bucket) || !path) return null;
    return { bucket, path };
  }

  return null;
}

export function assertPrivateRasterImage(file: File, label = 'imagem') {
  const normalizedType = String(file.type || '').toLowerCase();
  const extension = String(file.name || '').split('.').pop()?.toLowerCase();
  const extensionAllowed = extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'webp';

  if (!PRIVATE_IMAGE_MIME_TYPES.has(normalizedType) && !extensionAllowed) {
    throw new Error(`Envie ${label} em PNG, JPG ou WebP.`);
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error(`O arquivo de ${label} está vazio ou inválido.`);
  }

  if (file.size > PRIVATE_IMAGE_MAX_BYTES) {
    throw new Error(`O arquivo de ${label} deve ter no máximo 8 MB.`);
  }
}

export async function resolveStorageAssetUrl(
  value: string | null | undefined,
  expiresInSeconds = 900,
): Promise<string | null> {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  const reference = parseStorageReference(raw);
  if (!reference) return raw;

  if (!PRIVATE_BUCKETS.has(reference.bucket)) {
    const { data } = supabase.storage.from(reference.bucket).getPublicUrl(reference.path);
    return data.publicUrl;
  }

  const expiresIn = Math.min(
    SIGNED_URL_MAX_SECONDS,
    Math.max(SIGNED_URL_MIN_SECONDS, Math.trunc(expiresInSeconds)),
  );
  const { data, error } = await supabase.storage
    .from(reference.bucket)
    .createSignedUrl(reference.path, expiresIn);

  if (error || !data?.signedUrl) {
    throw error || new Error('Não foi possível autorizar o acesso temporário ao arquivo.');
  }

  return data.signedUrl;
}
