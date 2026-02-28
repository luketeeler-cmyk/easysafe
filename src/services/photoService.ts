import imageCompression from 'browser-image-compression';
import { supabase } from '../config/supabase';
import type { PhotoEntry } from '../types';

/* ------------------------------------------------------------------ */
/*  Photo Upload / Delete / URL Service                                */
/* ------------------------------------------------------------------ */

/**
 * Compress, upload, and return a PhotoEntry for a single image file.
 *
 * Storage path: {userId}/{entityType}/{entityId}/{photoId}.jpg
 * Compression: max 1 MB, max 1400px on longest side.
 */
export async function uploadPhoto(
  file: File,
  entityType: string,
  entityId: string,
): Promise<{ photo: PhotoEntry | null; error: unknown }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { photo: null, error: new Error('Not authenticated') };

  /* ---- Compress -------------------------------------------------- */
  let compressed: File;
  try {
    compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1400,
      useWebWorker: true,
    });
  } catch {
    // If compression fails, use original file
    compressed = file;
  }

  /* ---- Upload ---------------------------------------------------- */
  const photoId = crypto.randomUUID();
  const storagePath = `${user.id}/${entityType}/${entityId}/${photoId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('item-photos')
    .upload(storagePath, compressed, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) return { photo: null, error: uploadError };

  /* ---- Signed URL ------------------------------------------------ */
  const { url, error: urlError } = await getSignedUrl(storagePath);

  if (urlError || !url) return { photo: null, error: urlError };

  const photo: PhotoEntry = { id: photoId, url, storagePath };

  return { photo, error: null };
}

/** Delete a photo from storage by its path. */
export async function deletePhoto(
  storagePath: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase.storage
    .from('item-photos')
    .remove([storagePath]);

  return { error };
}

/**
 * Create a signed URL for a photo.
 * Default expiry: 10 years (315 360 000 seconds).
 */
export async function getSignedUrl(
  storagePath: string,
): Promise<{ url: string | null; error: unknown }> {
  const { data, error } = await supabase.storage
    .from('item-photos')
    .createSignedUrl(storagePath, 315_360_000);

  if (error) return { url: null, error };

  return { url: data.signedUrl, error: null };
}
