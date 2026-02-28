import React from 'react';
import styles from './PhotoGrid.module.css';
import type { PhotoEntry } from '../../types';

interface PhotoGridProps {
  photos: PhotoEntry[];
  onPhotoClick?: (index: number) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onPhotoClick }) => {
  if (photos.length === 0) return null;

  return (
    <div className={styles.grid}>
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          className={styles.cell}
          onClick={() => onPhotoClick?.(index)}
          type="button"
          aria-label={`View photo ${index + 1}`}
        >
          <img src={photo.url} alt="" className={styles.img} loading="lazy" />
        </button>
      ))}
    </div>
  );
};

export { PhotoGrid };
