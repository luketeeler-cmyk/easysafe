import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAmmunitionStore } from '../../stores/ammunitionStore';
import { getAmmunitionItem } from '../../services/ammunitionService';
import type { Ammunition } from '../../types';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { PhotoGrid } from '../../components/ui/PhotoGrid';
import { Lightbox } from '../../components/ui/Lightbox';
import { toast } from '../../components/ui/Toast';
import styles from './AmmunitionDetail.module.css';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmtCurrency = (val: number | null | undefined): string => {
  if (val == null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};

const capitalize = (s: string | null | undefined): string => {
  if (!s) return '--';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const AmmunitionDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { removeAmmunition } = useAmmunitionStore();

  const [item, setItem] = useState<Ammunition | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* Lightbox state */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  /* ---- Fetch ------------------------------------------------------ */
  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data } = await getAmmunitionItem(id);
      if (!cancelled) {
        setItem(data);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ---- Delete ----------------------------------------------------- */
  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);

    const { error } = await removeAmmunition(id);
    setDeleting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Ammunition deleted');
    navigate('/ammunition');
  };

  /* ---- Loading ---------------------------------------------------- */
  if (loading) {
    return (
      <div className={styles.centered}>
        <Spinner size={32} />
      </div>
    );
  }

  /* ---- Not found -------------------------------------------------- */
  if (!item) {
    return (
      <div className={styles.centered}>
        <p>Ammunition not found.</p>
      </div>
    );
  }

  /* ---- Render ----------------------------------------------------- */
  return (
    <div className={styles.page}>
      {/* Back link */}
      <Link to="/ammunition" className={styles.back}>
        &larr; Back to Ammunition
      </Link>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{item.caliber}</h1>
          {item.manufacturer && (
            <p className={styles.subtitle}>{item.manufacturer}</p>
          )}
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/ammunition/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Info grid */}
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Bullet Type</span>
          <span className={styles.infoValue}>{item.bullet_type || '--'}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Grain Weight</span>
          <span className={styles.infoValue}>
            {item.grain != null ? item.grain : '--'}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Casing Material</span>
          <span className={styles.infoValue}>
            {capitalize(item.casing_material)}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Quantity on Hand</span>
          <span className={styles.infoValue}>
            {item.quantity.toLocaleString()}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Price</span>
          <span className={styles.infoValue}>{fmtCurrency(item.price)}</span>
        </div>
      </div>

      {/* Notes */}
      {item.notes && (
        <div className={styles.notesSection}>
          <h3 className={styles.sectionTitle}>Notes</h3>
          <p className={styles.notesText}>{item.notes}</p>
        </div>
      )}

      {/* Photos */}
      {item.photos && item.photos.length > 0 && (
        <div className={styles.photosSection}>
          <h3 className={styles.sectionTitle}>Photos</h3>
          <PhotoGrid
            photos={item.photos}
            onPhotoClick={(idx) => {
              setLightboxIndex(idx);
              setLightboxOpen(true);
            }}
          />
          <Lightbox
            photos={item.photos}
            currentIndex={lightboxIndex}
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Ammunition"
        footer={
          <div className={styles.modalFooter}>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete <strong>{item.caliber}</strong>
          {item.manufacturer ? ` by ${item.manufacturer}` : ''}? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export { AmmunitionDetail };
