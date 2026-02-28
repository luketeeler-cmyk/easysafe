import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAmmunitionStore } from '../../stores/ammunitionStore';
import { getAmmunitionItem } from '../../services/ammunitionService';
import { useProductScrape } from '../../hooks/useProductScrape';
import type { Ammunition, CasingMaterial, PhotoEntry } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import { UrlScrapeInput } from '../../components/ui/UrlScrapeInput';
import { toast } from '../../components/ui/Toast';
import styles from './AmmunitionForm.module.css';

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const CASING_OPTIONS = [
  { value: '', label: 'Select casing...' },
  { value: 'brass', label: 'Brass' },
  { value: 'steel', label: 'Steel' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'nickel', label: 'Nickel' },
  { value: 'other', label: 'Other' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const AmmunitionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { addAmmunition, updateAmmunition } = useAmmunitionStore();
  const { scrape, loading: scrapeLoading, data: scrapeData } = useProductScrape();

  const [loadingItem, setLoadingItem] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Form fields */
  const [caliber, setCaliber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [bulletType, setBulletType] = useState('');
  const [grain, setGrain] = useState('');
  const [casingMaterial, setCasingMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  /* Validation errors */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---- Load existing item for edit mode --------------------------- */
  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoadingItem(true);

    (async () => {
      const { data } = await getAmmunitionItem(id);
      if (cancelled || !data) {
        setLoadingItem(false);
        return;
      }

      setCaliber(data.caliber ?? '');
      setManufacturer(data.manufacturer ?? '');
      setBulletType(data.bullet_type ?? '');
      setGrain(data.grain != null ? String(data.grain) : '');
      setCasingMaterial(data.casing_material ?? '');
      setQuantity(String(data.quantity ?? ''));
      setPrice(data.price != null ? String(data.price) : '');
      setNotes(data.notes ?? '');
      setPhotos(data.photos ?? []);
      setLoadingItem(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ---- Apply scraped data ----------------------------------------- */
  useEffect(() => {
    if (!scrapeData) return;

    if (scrapeData.caliber && !caliber) setCaliber(scrapeData.caliber);
    if (scrapeData.manufacturer && !manufacturer) setManufacturer(scrapeData.manufacturer);
    if (scrapeData.name && !bulletType) setBulletType(String(scrapeData.name));
    if (scrapeData.price != null && !price) setPrice(String(scrapeData.price));
  }, [scrapeData]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Validation ------------------------------------------------- */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!caliber.trim()) errs.caliber = 'Caliber is required';
    if (!quantity.trim() || Number(quantity) < 0) errs.quantity = 'Valid quantity is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ---- Submit ----------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    const payload: Partial<Ammunition> = {
      caliber: caliber.trim(),
      manufacturer: manufacturer.trim(),
      bullet_type: bulletType.trim() || null,
      grain: grain ? Number(grain) : null,
      casing_material: (casingMaterial || null) as CasingMaterial | null,
      quantity: Number(quantity),
      price: price ? Number(price) : null,
      notes: notes.trim() || null,
      photos,
    };

    try {
      if (isEdit && id) {
        const { error } = await updateAmmunition(id, payload);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success('Ammunition updated');
        navigate(`/ammunition/${id}`);
      } else {
        const { data, error } = await addAmmunition(payload);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success('Ammunition added');
        navigate(data ? `/ammunition/${data.id}` : '/ammunition');
      }
    } finally {
      setSaving(false);
    }
  };

  /* ---- Loading state ---------------------------------------------- */
  if (loadingItem) {
    return (
      <div className={styles.centered}>
        <Spinner size={32} />
      </div>
    );
  }

  /* ---- Render ----------------------------------------------------- */
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {isEdit ? 'Edit Ammunition' : 'Add Ammunition'}
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        {/* URL Scraper */}
        <div className={styles.scrapeRow}>
          <UrlScrapeInput
            onDataFetched={() => {}}
            loading={scrapeLoading}
            onSubmit={scrape}
          />
        </div>

        {/* 2-column grid */}
        <div className={styles.grid}>
          <Input
            label="Caliber *"
            value={caliber}
            onChange={(e) => setCaliber(e.target.value)}
            error={errors.caliber}
            placeholder="e.g. 9mm, .223, .45 ACP"
          />
          <Input
            label="Manufacturer"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="e.g. Federal, Winchester"
          />
          <Input
            label="Bullet Type"
            value={bulletType}
            onChange={(e) => setBulletType(e.target.value)}
            placeholder="FMJ, HP, JHP..."
          />
          <Input
            label="Grain Weight"
            type="number"
            value={grain}
            onChange={(e) => setGrain(e.target.value)}
            placeholder="e.g. 115, 147"
          />
          <Select
            label="Casing Material"
            value={casingMaterial}
            onChange={(e) => setCasingMaterial(e.target.value)}
            options={CASING_OPTIONS}
          />
          <Input
            label="Quantity *"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            error={errors.quantity}
            placeholder="Number of rounds"
          />
          <Input
            label="Price per Box"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Notes - full width */}
        <div className={styles.fullRow}>
          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        {/* Photos */}
        <div className={styles.fullRow}>
          <label className={styles.sectionLabel}>Photos</label>
          <PhotoUploader photos={photos} onPhotosChange={setPhotos} />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button type="submit" variant="primary" loading={saving}>
            {isEdit ? 'Save Changes' : 'Add Ammunition'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit && id ? `/ammunition/${id}` : '/ammunition')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export { AmmunitionForm };
