import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSuppressorsStore } from '../../stores/suppressorsStore';
import { getSuppressor } from '../../services/suppressorService';
import { useProductScrape } from '../../hooks/useProductScrape';
import type { Suppressor, TaxStampStatus, PhotoEntry } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import { UrlScrapeInput } from '../../components/ui/UrlScrapeInput';
import { toast } from '../../components/ui/Toast';
import styles from './SuppressorForm.module.css';

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const TAX_STAMP_OPTIONS = [
  { value: '', label: 'Select status...' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const SuppressorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { addSuppressor, updateSuppressor } = useSuppressorsStore();
  const { scrape, loading: scrapeLoading, data: scrapeData } = useProductScrape();

  const [loadingItem, setLoadingItem] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Form fields */
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [calibersRatedStr, setCalibersRatedStr] = useState('');
  const [length, setLength] = useState('');
  const [diameter, setDiameter] = useState('');
  const [weight, setWeight] = useState('');
  const [mountType, setMountType] = useState('');
  const [form4Date, setForm4Date] = useState('');
  const [taxStampStatus, setTaxStampStatus] = useState('');
  const [trustName, setTrustName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
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
      const { data } = await getSuppressor(id);
      if (cancelled || !data) {
        setLoadingItem(false);
        return;
      }

      setManufacturer(data.manufacturer ?? '');
      setModel(data.model ?? '');
      setSerial(data.serial ?? '');
      setCalibersRatedStr(
        data.calibers_rated ? data.calibers_rated.join(', ') : '',
      );
      setLength(data.length ?? '');
      setDiameter(data.diameter ?? '');
      setWeight(data.weight ?? '');
      setMountType(data.mount_type ?? '');
      setForm4Date(data.form4_date ?? '');
      setTaxStampStatus(data.tax_stamp_status ?? '');
      setTrustName(data.trust_name ?? '');
      setPurchaseDate(data.purchase_date ?? '');
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

    if (scrapeData.manufacturer && !manufacturer)
      setManufacturer(scrapeData.manufacturer);
    if (scrapeData.model && !model) setModel(String(scrapeData.model));
    if (scrapeData.caliber && !calibersRatedStr)
      setCalibersRatedStr(scrapeData.caliber);
    if (scrapeData.price != null && !price) setPrice(String(scrapeData.price));
  }, [scrapeData]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Validation ------------------------------------------------- */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!manufacturer.trim()) errs.manufacturer = 'Manufacturer is required';
    if (!model.trim()) errs.model = 'Model is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ---- Parse calibers string to array ----------------------------- */
  const parseCalibersRated = (str: string): string[] => {
    return str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  /* ---- Submit ----------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    const payload: Partial<Suppressor> = {
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      serial: serial.trim(),
      calibers_rated: parseCalibersRated(calibersRatedStr),
      length: length.trim() || null,
      diameter: diameter.trim() || null,
      weight: weight.trim() || null,
      mount_type: mountType.trim() || null,
      form4_date: form4Date || null,
      tax_stamp_status: (taxStampStatus || null) as TaxStampStatus | null,
      trust_name: trustName.trim() || null,
      purchase_date: purchaseDate || null,
      price: price ? Number(price) : null,
      notes: notes.trim() || null,
      photos,
    };

    try {
      if (isEdit && id) {
        const { error } = await updateSuppressor(id, payload);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success('Suppressor updated');
        navigate(`/suppressors/${id}`);
      } else {
        const { data, error } = await addSuppressor(payload);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success('Suppressor added');
        navigate(data ? `/suppressors/${data.id}` : '/suppressors');
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
        {isEdit ? 'Edit Suppressor' : 'Add Suppressor'}
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
            label="Manufacturer *"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            error={errors.manufacturer}
            placeholder="e.g. SilencerCo, Dead Air"
          />
          <Input
            label="Model *"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            error={errors.model}
            placeholder="e.g. Omega 300, Sandman S"
          />
          <Input
            label="Serial"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Serial number"
          />
          <Input
            label="Calibers Rated"
            value={calibersRatedStr}
            onChange={(e) => setCalibersRatedStr(e.target.value)}
            placeholder="5.56, 7.62, 9mm"
          />
          <Input
            label="Length"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder='e.g. 7.09"'
          />
          <Input
            label="Diameter"
            value={diameter}
            onChange={(e) => setDiameter(e.target.value)}
            placeholder='e.g. 1.5"'
          />
          <Input
            label="Weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 14.1 oz"
          />
          <Input
            label="Mount Type"
            value={mountType}
            onChange={(e) => setMountType(e.target.value)}
            placeholder="Direct thread, QD KeyMo..."
          />
          <Input
            label="Form 4 Approval Date"
            type="date"
            value={form4Date}
            onChange={(e) => setForm4Date(e.target.value)}
          />
          <Select
            label="Tax Stamp Status"
            value={taxStampStatus}
            onChange={(e) => setTaxStampStatus(e.target.value)}
            options={TAX_STAMP_OPTIONS}
          />
          <Input
            label="Trust Name"
            value={trustName}
            onChange={(e) => setTrustName(e.target.value)}
            placeholder="NFA trust name"
          />
          <Input
            label="Purchase Date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
          <Input
            label="Price"
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
            {isEdit ? 'Save Changes' : 'Add Suppressor'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              navigate(isEdit && id ? `/suppressors/${id}` : '/suppressors')
            }
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export { SuppressorForm };
