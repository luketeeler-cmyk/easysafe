import { useState, useCallback } from 'react';
import type { PhotoEntry } from '../types';
import { uploadPhoto, deletePhoto } from '../services/photoService';

/* ------------------------------------------------------------------ */
/*  Photo Upload Management Hook                                        */
/* ------------------------------------------------------------------ */

interface UsePhotoUploadReturn {
  photos: PhotoEntry[];
  addPhotos: (
    files: File[],
    entityType: string,
    entityId: string,
  ) => Promise<void>;
  removePhoto: (index: number) => Promise<void>;
  uploading: boolean;
}

/**
 * Manages a list of photos: handles uploads (with compression via
 * photoService), deletions, and tracks upload-in-progress state.
 *
 * @param existingPhotos  Photos already persisted (e.g. from a loaded entity).
 */
export function usePhotoUpload(
  existingPhotos: PhotoEntry[] = [],
): UsePhotoUploadReturn {
  const [photos, setPhotos] = useState<PhotoEntry[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);

  /* ---- addPhotos ------------------------------------------------- */
  const addPhotos = useCallback(
    async (files: File[], entityType: string, entityId: string) => {
      if (files.length === 0) return;

      setUploading(true);

      try {
        const results = await Promise.all(
          files.map((file) => uploadPhoto(file, entityType, entityId)),
        );

        const newPhotos: PhotoEntry[] = [];
        for (const result of results) {
          if (result.photo) {
            newPhotos.push(result.photo);
          }
        }

        if (newPhotos.length > 0) {
          setPhotos((prev) => [...prev, ...newPhotos]);
        }
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  /* ---- removePhoto ----------------------------------------------- */
  const removePhoto = useCallback(
    async (index: number) => {
      const photo = photos[index];
      if (!photo) return;

      /* If the photo has a storage path it has been uploaded — delete it */
      if (photo.storagePath) {
        await deletePhoto(photo.storagePath);
      }

      setPhotos((prev) => prev.filter((_, i) => i !== index));
    },
    [photos],
  );

  return { photos, addPhotos, removePhoto, uploading };
}
