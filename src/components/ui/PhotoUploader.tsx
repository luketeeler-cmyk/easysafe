import React, { useRef, useCallback, useState } from 'react';
import styles from './PhotoUploader.module.css';
import type { PhotoEntry } from '../../types';

interface PhotoUploaderProps {
  photos: PhotoEntry[];
  onPhotosChange: (photos: PhotoEntry[]) => void;
  maxPhotos?: number;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const remaining = maxPhotos - photos.length;
      if (remaining <= 0) return;

      const fileArray = Array.from(files).slice(0, remaining);
      const newEntries: PhotoEntry[] = fileArray
        .filter((f) => f.type.startsWith('image/'))
        .map((f) => ({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(f),
          storagePath: '',
        }));

      onPhotosChange([...photos, ...newEntries]);
    },
    [photos, onPhotosChange, maxPhotos]
  );

  const removePhoto = useCallback(
    (id: string) => {
      onPhotosChange(photos.filter((p) => p.id !== id));
    },
    [photos, onPhotosChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const atLimit = photos.length >= maxPhotos;

  return (
    <div className={styles.container}>
      {!atLimit && (
        <div
          className={`${styles.dropZone} ${dragging ? styles.active : ''}`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleClick();
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.cameraIcon}
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className={styles.dropText}>Drop photos here or click to browse</span>
          <span className={styles.dropHint}>
            {photos.length} / {maxPhotos} photos
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            className={styles.hiddenInput}
            tabIndex={-1}
          />
        </div>
      )}

      {photos.length > 0 && (
        <div className={styles.grid}>
          {photos.map((photo) => (
            <div key={photo.id} className={styles.thumb}>
              <img src={photo.url} alt="" className={styles.thumbImg} />
              <button
                className={styles.removeBtn}
                onClick={() => removePhoto(photo.id)}
                aria-label="Remove photo"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="2" y1="2" x2="10" y2="10" />
                  <line x1="10" y1="2" x2="2" y2="10" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { PhotoUploader };
