import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as firearmService from '../../services/firearmService';
import { useFirearmsStore } from '../../stores/firearmsStore';
import type { Firearm, TaxStampStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConditionBadge } from '../../components/ui/ConditionBadge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { SubTabNav } from '../../components/ui/SubTabNav';
import { PhotoGrid } from '../../components/ui/PhotoGrid';
import { Lightbox } from '../../components/ui/Lightbox';
import { toast } from '../../components/ui/Toast';
import { MagazinesTab } from './tabs/MagazinesTab';
import { PartsTab } from './tabs/PartsTab';
import { RoundCountTab } from './tabs/RoundCountTab';
import { AvailableAmmoTab } from './tabs/AvailableAmmoTab';
import styles from './FirearmDetail.module.css';

/* ------------------------------------------------------------------ */
/*  Label helpers                                                       */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, string> = {
  handgun: 'Handgun',
  rifle: 'Rifle',
  shotgun: 'Shotgun',
  nfa_firearm: 'NFA Firearm',
};

const NFA_DESIGNATION_LABELS: Record<string, string> = {
  sbr: 'SBR',
  sbs: 'SBS',
  mg: 'Machine Gun',
  aow: 'AOW',
  dd: 'Destructive Device',
};

const TAX_STAMP_VARIANT: Record<TaxStampStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  denied: 'danger',
};

const TAX_STAMP_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

const fmtCurrency = (val: number | null | undefined): string => {
  if (val == null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};

const fmtDate = (val: string | null | undefined): string => {
  if (!val) return '--';
  return new Date(val).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const FirearmDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { removeFirearm } = useFirearmsStore();

  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  /* Lightbox */
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  /* Fetch */
  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);

    firearmService.getFirearm(id).then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);

      if (error || !data) {
        setFirearm(null);
        return;
      }

      setFirearm(data);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* Tabs definition */
  const tabs = useMemo(() => {
    const list = [{ key: 'details', label: 'Details' }];

    if (firearm?.feed_type === 'external') {
      list.push({ key: 'magazines', label: 'Magazines' });
    }

    list.push(
      { key: 'parts', label: 'Parts & Attachments' },
      { key: 'rounds', label: 'Round Count' },
      { key: 'ammo', label: 'Available Ammo' },
    );

    return list;
  }, [firearm?.feed_type]);

  /* Delete handler */
  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);

    const { error } = await removeFirearm(id);
    setDeleting(false);

    if (error) {
      toast.error(`Delete failed: ${error}`);
      return;
    }

    toast.success('Firearm deleted');
    setDeleteOpen(false);
    navigate(
      `/firearms${firearm?.category ? `?category=${firearm.category}` : ''}`,
    );
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
  if (!firearm) {
    return (
      <div className={styles.centered}>
        <EmptyState
          title="Firearm not found"
          description="The firearm you are looking for does not exist or has been deleted."
          action={
            <Link to="/firearms">
              <Button variant="secondary" size="sm">
                Back to Firearms
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  /* ---- Detail content --------------------------------------------- */
  const renderDetails = () => (
    <div className={styles.infoGrid}>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Serial Number</span>
        <span className={`${styles.infoValue} ${styles.mono}`}>
          {firearm.serial || '--'}
        </span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Caliber</span>
        <span className={styles.infoValue}>{firearm.caliber || '--'}</span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Category</span>
        <span className={styles.infoValue}>
          <Badge>{CATEGORY_LABELS[firearm.category] ?? firearm.category}</Badge>
        </span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Condition</span>
        <span className={styles.infoValue}>
          {firearm.condition ? (
            <ConditionBadge condition={firearm.condition} />
          ) : (
            '--'
          )}
        </span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Barrel Length</span>
        <span className={styles.infoValue}>
          {firearm.barrel_length || '--'}
        </span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Storage Location</span>
        <span className={styles.infoValue}>
          {firearm.storage_location || '--'}
        </span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Purchase Date</span>
        <span className={styles.infoValue}>
          {fmtDate(firearm.purchase_date)}
        </span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Value</span>
        <span className={styles.infoValue}>{fmtCurrency(firearm.price)}</span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Feed Type</span>
        <span className={styles.infoValue}>
          {firearm.feed_type === 'internal'
            ? 'Internal Magazine'
            : firearm.feed_type === 'external'
              ? 'Detachable Magazine'
              : '--'}
        </span>
      </div>
      {firearm.feed_type === 'internal' &&
        firearm.internal_mag_capacity != null && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Internal Mag Capacity</span>
            <span className={styles.infoValue}>
              {firearm.internal_mag_capacity}
            </span>
          </div>
        )}

      {firearm.notes && (
        <div className={`${styles.infoItem} ${styles.fullWidth}`}>
          <span className={styles.infoLabel}>Notes</span>
          <span className={styles.infoValue}>{firearm.notes}</span>
        </div>
      )}
    </div>
  );

  /* ---- NFA info --------------------------------------------------- */
  const renderNfa = () => {
    if (firearm.category !== 'nfa_firearm') return null;

    return (
      <div className={styles.nfaSection}>
        <h3 className={styles.sectionTitle}>NFA Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Designation</span>
            <span className={styles.infoValue}>
              {firearm.nfa_designation
                ? NFA_DESIGNATION_LABELS[firearm.nfa_designation] ??
                  firearm.nfa_designation
                : '--'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Tax Stamp Status</span>
            <span className={styles.infoValue}>
              {firearm.tax_stamp_status ? (
                <Badge variant={TAX_STAMP_VARIANT[firearm.tax_stamp_status]}>
                  {TAX_STAMP_LABELS[firearm.tax_stamp_status] ??
                    firearm.tax_stamp_status}
                </Badge>
              ) : (
                '--'
              )}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Form 4 Approval Date</span>
            <span className={styles.infoValue}>
              {fmtDate(firearm.form4_date)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Trust Name</span>
            <span className={styles.infoValue}>
              {firearm.trust_name || '--'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  /* ---- Render ----------------------------------------------------- */
  return (
    <div className={styles.page}>
      {/* Back link */}
      <Link
        to={`/firearms${firearm.category ? `?category=${firearm.category}` : ''}`}
        className={styles.back}
      >
        &larr; Back to{' '}
        {CATEGORY_LABELS[firearm.category] ?? 'Firearms'}
      </Link>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          {firearm.make} {firearm.model}
        </h1>
        <div className={styles.headerActions}>
          <Link to={`/firearms/${id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Photos */}
      {firearm.photos && firearm.photos.length > 0 && (
        <PhotoGrid
          photos={firearm.photos}
          onPhotoClick={(i) => {
            setLbIndex(i);
            setLbOpen(true);
          }}
        />
      )}

      {/* Lightbox */}
      <Lightbox
        photos={firearm.photos ?? []}
        currentIndex={lbIndex}
        open={lbOpen}
        onClose={() => setLbOpen(false)}
      />

      {/* Sub-tabs */}
      <SubTabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'details' && (
          <>
            {renderDetails()}
            {renderNfa()}
          </>
        )}
        {activeTab === 'magazines' && id && (
          <MagazinesTab firearmId={id} />
        )}
        {activeTab === 'parts' && id && (
          <PartsTab parentType="firearm" parentId={id} />
        )}
        {activeTab === 'rounds' && id && (
          <RoundCountTab parentType="firearm" parentId={id} />
        )}
        {activeTab === 'ammo' && (
          <AvailableAmmoTab caliber={firearm.caliber || null} />
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Firearm"
        footer={
          <div className={styles.modalFooter}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete{' '}
          <strong>
            {firearm.make} {firearm.model}
          </strong>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export { FirearmDetail };
